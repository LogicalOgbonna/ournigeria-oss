import { describe, expect, it } from "vitest";
import {
  byDisplayOrder,
  documentBody,
  documentProblems,
  fileProblem,
  reorderPatches,
  shortEdgeWarning,
  type DocumentFormValues,
} from "../campaign-assets";
import { IMAGE_MAX_BYTES, PDF_MAX_BYTES } from "../campaigns";

describe("fileProblem", () => {
  it("accepts the three image types and a PDF", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"])
      expect(fileProblem({ type, size: 1_000 }, "image")).toBeNull();
    expect(fileProblem({ type: "application/pdf", size: 1_000 }, "pdf")).toBeNull();
  });

  it("rejects a gif image and a non-PDF document with the uploader's wording", () => {
    expect(fileProblem({ type: "image/gif", size: 10 }, "image")).toBe(
      "Image type not accepted — use jpeg, png, webp",
    );
    expect(fileProblem({ type: "image/png", size: 10 }, "pdf")).toBe(
      "Documents must be PDF",
    );
  });

  it("rejects a file over the kind's cap and allows one exactly at it", () => {
    expect(fileProblem({ type: "image/png", size: IMAGE_MAX_BYTES }, "image")).toBeNull();
    expect(fileProblem({ type: "image/png", size: IMAGE_MAX_BYTES + 1 }, "image")).toBe(
      "File is larger than 15 MB",
    );
    expect(
      fileProblem({ type: "application/pdf", size: PDF_MAX_BYTES + 1 }, "pdf"),
    ).toBe("File is larger than 50 MB");
  });

  it("checks the type before the size, so a huge gif names the real problem", () => {
    expect(fileProblem({ type: "image/gif", size: IMAGE_MAX_BYTES * 4 }, "image")).toBe(
      "Image type not accepted — use jpeg, png, webp",
    );
  });
});

describe("shortEdgeWarning", () => {
  it("is silent at or above 800 px on the short edge", () => {
    expect(shortEdgeWarning(800, 1200)).toBeNull();
    expect(shortEdgeWarning(1200, 800)).toBeNull();
    expect(shortEdgeWarning(4000, 4000)).toBeNull();
  });

  it("warns (never blocks) when the short edge is under 800 px", () => {
    // A wide banner still fails on its height — the SHORT edge is what counts.
    expect(shortEdgeWarning(4000, 500)).toContain("4000×500");
    expect(shortEdgeWarning(799, 799)).toContain("under 800 px");
  });

  it("says nothing for a size it could not read", () => {
    expect(shortEdgeWarning(0, 0)).toBeNull();
    expect(shortEdgeWarning(Number.NaN, 900)).toBeNull();
  });
});

describe("byDisplayOrder", () => {
  const row = (id: string, displayOrder: number) => ({ id, displayOrder });

  it("sorts by displayOrder first", () => {
    expect([row("z", 2), row("a", 1)].sort(byDisplayOrder).map((r) => r.id)).toEqual([
      "a",
      "z",
    ]);
  });

  it("breaks ties on id so the list order is stable across refetches", () => {
    // Every appended row is created with displayOrder 0, so without a tie-break
    // the cards would shuffle on every render and the up/down buttons would
    // move a different image each time.
    const rows = [row("c", 0), row("a", 0), row("b", 0)];
    expect(rows.sort(byDisplayOrder).map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect([...rows].sort(byDisplayOrder).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("lets displayOrder beat the id", () => {
    expect([row("a", 5), row("z", 1)].sort(byDisplayOrder).map((r) => r.id)).toEqual([
      "z",
      "a",
    ]);
  });
});

describe("reorderPatches", () => {
  // Every appended row is created with displayOrder 0 unless a commit set one,
  // so the common case is a list that is entirely zeroes.
  const zeroes = [
    { id: "a", displayOrder: 0 },
    { id: "b", displayOrder: 0 },
    { id: "c", displayOrder: 0 },
  ];

  it("renumbers a flat list so a move actually moves something", () => {
    expect(reorderPatches(zeroes, "c", -1)).toEqual([
      { id: "c", displayOrder: 1 },
      { id: "b", displayOrder: 2 },
    ]);
  });

  it("moves down as well, leaving rows that land on their old number alone", () => {
    // a,b,c -> b,a,c: b keeps 0, so only a and c are patched.
    expect(reorderPatches(zeroes, "a", 1)).toEqual([
      { id: "a", displayOrder: 1 },
      { id: "c", displayOrder: 2 },
    ]);
  });

  it("returns only the rows whose number changes", () => {
    const numbered = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
      { id: "c", displayOrder: 2 },
    ];
    expect(reorderPatches(numbered, "b", 1)).toEqual([
      { id: "c", displayOrder: 1 },
      { id: "b", displayOrder: 2 },
    ]);
  });

  it("is a no-op at the ends and for an unknown id", () => {
    expect(reorderPatches(zeroes, "a", -1)).toEqual([]);
    expect(reorderPatches(zeroes, "c", 1)).toEqual([]);
    expect(reorderPatches(zeroes, "zz", -1)).toEqual([]);
  });
});

describe("documentProblems", () => {
  const form = (over: Partial<DocumentFormValues> = {}): DocumentFormValues => ({
    title: "2027 Manifesto",
    blurb: "",
    pageCount: "",
    sourceUrl: "",
    ...over,
  });

  it("passes a minimal valid form", () => {
    expect(documentProblems(form())).toEqual({});
  });

  it("demands a title that is more than whitespace", () => {
    expect(documentProblems(form({ title: "   " })).title).toBe("A title is required.");
  });

  it("rejects a page count that is not a whole number in range", () => {
    for (const pageCount of ["0", "5001", "2.5", "twelve"])
      expect(documentProblems(form({ pageCount })).pageCount, pageCount).toBeTruthy();
    expect(documentProblems(form({ pageCount: "5000" })).pageCount).toBeUndefined();
  });

  it("pins the source URL to http(s), like the API's httpUrl()", () => {
    expect(documentProblems(form({ sourceUrl: "example.com" })).sourceUrl).toBeTruthy();
    expect(
      documentProblems(form({ sourceUrl: "javascript:alert(1)" })).sourceUrl,
    ).toBeTruthy();
    expect(
      documentProblems(form({ sourceUrl: "https://inec.gov.ng/x.pdf" })).sourceUrl,
    ).toBeUndefined();
  });
});

describe("documentBody", () => {
  const form: DocumentFormValues = {
    title: "  2027 Manifesto  ",
    blurb: "  ",
    pageCount: "",
    sourceUrl: " https://inec.gov.ng/x.pdf ",
  };

  it("trims the title and collapses empty text to null", () => {
    expect(documentBody(form)).toEqual({
      title: "2027 Manifesto",
      blurb: null,
      sourceUrl: "https://inec.gov.ng/x.pdf",
    });
  });

  it("omits pageCount when a new PDF is staged, so the server's scan wins", () => {
    const body = documentBody(form, {
      stagingKey: "staging/c/u",
      existingPageCount: 12,
    });
    expect(body).not.toHaveProperty("pageCount");
    expect(body.stagingKey).toBe("staging/c/u");
  });

  it("sends an explicit null to clear a stored count when no PDF is staged", () => {
    expect(documentBody(form, { existingPageCount: 12 }).pageCount).toBeNull();
  });

  it("sends nothing for an empty box on a document that has no count", () => {
    expect(documentBody(form, { existingPageCount: null })).not.toHaveProperty(
      "pageCount",
    );
    expect(documentBody(form)).not.toHaveProperty("pageCount");
  });

  it("sends a typed count as a number, even beside a staged PDF", () => {
    expect(
      documentBody({ ...form, pageCount: " 42 " }, { stagingKey: "staging/c/u" })
        .pageCount,
    ).toBe(42);
  });

  it("carries the cover key and the audit reason only when given", () => {
    expect(documentBody(form)).not.toHaveProperty("reason");
    const body = documentBody(form, {
      coverStagingKey: "staging/c/cover",
      reason: "adding the manifesto",
    });
    expect(body.coverStagingKey).toBe("staging/c/cover");
    expect(body.reason).toBe("adding the manifesto");
  });
});
