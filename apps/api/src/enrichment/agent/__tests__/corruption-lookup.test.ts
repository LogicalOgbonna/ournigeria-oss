import { describe, it, expect, vi } from "vitest";
import { slugifyName } from "@ournigeria/database";
import type { ClientBase } from "pg";
import { lookupCorruptionCases } from "../corruption-lookup";

const UUID = "11111111-1111-1111-1111-111111111111";
const now = () => new Date("2026-08-15T10:00:00.000Z");

/** A full corruptioncases.ng search-result case (matches the live API shape). */
function bello(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: "FRN vs Yahaya Adoza Bello (Former Governor of Kogi State)",
    amount: "N80,246,470,088.88",
    date_of_arraignment: "Dec 13, 2024",
    status: "On Trial",
    stage: "Prosecution Stage",
    description: "The defendant allegedly converted the said sum to personal use.",
    type: "Money laundering",
    slug: "frn-vs-yahaya-adoza-bello-former-govern-1",
    hasEnded: false,
    agency: { name: "Economic and Financial Crimes Commission", shortname: "EFCC" },
    court: { name: "Federal High Court, Maitama", state: { name: "Abuja", shortname: "ABJ" } },
    defendants: [{ id: 11883, name: "Yahaya Adoza Bello" }],
    ...over,
  };
}

interface RecordedProposal {
  targetTable: string;
  payload: Record<string, unknown>;
  status: string;
  confidence: string;
  reasoning: string | null;
  agentRunId: string | null;
}
interface RecordedSource {
  url: string;
  publisher: string;
  snippet: string;
  format: string;
  locator: string | null;
  tier: string;
  retrievedAt: string;
}

function makeClient(opts: { existingSlugs?: Set<string>; throwOnTitle?: string } = {}) {
  const existing = opts.existingSlugs ?? new Set<string>();
  let idc = 0;
  const proposals: RecordedProposal[] = [];
  const sources: RecordedSource[] = [];
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    const s = String(sql).trim();
    if (s.startsWith("SELECT 1 FROM corruption_cases WHERE slug")) {
      const slug = (params as unknown[])[0] as string;
      return { rows: existing.has(slug) ? [{ n: 1 }] : [] };
    }
    if (s.startsWith("INSERT INTO change_proposals")) {
      const p = params as unknown[];
      const payload = JSON.parse(p[1] as string) as Record<string, unknown>;
      if (opts.throwOnTitle && String(payload.title).includes(opts.throwOnTitle)) {
        throw new Error("db boom");
      }
      const id = `prop-${idc++}`;
      proposals.push({
        targetTable: p[0] as string,
        payload,
        status: p[2] as string,
        confidence: p[3] as string,
        reasoning: p[4] as string | null,
        agentRunId: p[5] as string | null,
      });
      return { rows: [{ id }] };
    }
    if (s.startsWith("INSERT INTO proposal_sources")) {
      const p = params as unknown[];
      sources.push({
        url: p[1] as string,
        publisher: p[3] as string,
        snippet: p[4] as string,
        format: p[5] as string,
        locator: p[6] as string | null,
        tier: p[7] as string,
        retrievedAt: p[9] as string,
      });
      return { rows: [] };
    }
    // BEGIN / COMMIT / ROLLBACK
    return { rows: [] };
  });
  return { query, proposals, sources, asClient: { query } as unknown as ClientBase };
}

describe("lookupCorruptionCases", () => {
  it("maps a fixture case into a corruption create proposal", async () => {
    const client = makeClient();
    const fetchJson = vi.fn(async () => ({ cases: [bello()] }));
    const res = await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson, now },
    );

    expect(res.filed).toBe(1);
    expect(res.skipped).toEqual([]);
    expect(fetchJson).toHaveBeenCalledWith(
      "https://v1.corruptioncases.ng/api/cases/search?q=Yahaya%20Bello",
    );

    const p = client.proposals[0];
    expect(p.targetTable).toBe("corruption_cases");
    expect(p.status).toBe("pending");
    expect(p.confidence).toBe("medium");
    expect(p.reasoning).toMatch(/corruptioncases\.ng/i);

    expect(p.payload.officialId).toBe(UUID);
    expect(p.payload.subjectName).toBe("Yahaya Adoza Bello");
    expect(String(p.payload.title)).toContain("Yahaya Adoza Bello");
    expect(p.payload.caseType).toBe("money_laundering");
    expect(p.payload.status).toBe("on_trial");
    expect(p.payload.forum).toBe("EFCC");
    expect(String(p.payload.summary)).toContain("converted");
    expect(p.payload.amountInvolved).toBeCloseTo(80246470088.88, 2);
    expect(p.payload.chargeDate).toBe("2024-12-13");
    expect(p.payload.currency).toBe("NGN");
    expect(p.payload.role).toBe("defendant");
  });

  it("cites exactly one canonical corruptioncases.ng backlink", async () => {
    const client = makeClient();
    await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson: async () => ({ cases: [bello()] }), now },
    );
    expect(client.sources).toHaveLength(1);
    const src = client.sources[0];
    expect(src.url).toBe(
      "https://corruptioncases.ng/cases/frn-vs-yahaya-adoza-bello-former-govern-1",
    );
    expect(src.publisher).toBe("corruptioncases.ng");
    expect(src.format).toBe("html");
    expect(src.locator).toBe("frn-vs-yahaya-adoza-bello-former-govern-1");
    expect(src.tier).toBe("canonical"); // guards the profiles.ts sourceTemplate edit
    expect(src.retrievedAt).toBe("2026-08-15T10:00:00.000Z");
    expect(src.snippet).toBe(
      "FRN vs Yahaya Adoza Bello (Former Governor of Kogi State) — EFCC",
    );
  });

  it("maps the OUTCOME (stage) to the status enum — a Decided/Convicted case is 'convicted', not 'on_trial'", async () => {
    const client = makeClient();
    // Real API shape for an ended case: status is procedural ("Decided"), the
    // outcome lives in stage ("Convicted"). stage must win.
    await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson: async () => ({ cases: [bello({ status: "Decided", stage: "Convicted", hasEnded: true, slug: "c-1" })] }), now },
    );
    expect(client.proposals[0].payload.status).toBe("convicted");
  });

  it("maps an on-trial case (Prosecution Stage) to 'on_trial'", async () => {
    const client = makeClient();
    await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson: async () => ({ cases: [bello({ status: "On Trial", stage: "Prosecution Stage", slug: "c-2" })] }), now },
    );
    expect(client.proposals[0].payload.status).toBe("on_trial");
  });

  it("skips a fuzzy hit whose defendants do not include the official", async () => {
    const client = makeClient();
    const c = bello({ defendants: [{ id: 2, name: "Someone Else Entirely" }] });
    const res = await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson: async () => ({ cases: [c] }), now },
    );
    expect(res.filed).toBe(0);
    expect(client.proposals).toHaveLength(0);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0].reason).toMatch(/no defendant match/i);
  });

  it("skips a case whose computed slug already exists (dedup)", async () => {
    const subjectName = "Yahaya Adoza Bello";
    const slug = slugifyName(`${subjectName} ${bello().title}`).slice(0, 140);
    const client = makeClient({ existingSlugs: new Set([slug]) });
    const res = await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson: async () => ({ cases: [bello()] }), now },
    );
    expect(res.filed).toBe(0);
    expect(client.proposals).toHaveLength(0);
    expect(res.skipped[0].reason).toMatch(/already exists/i);
  });

  it("isolates a failing case and still files the others", async () => {
    const good = bello({
      slug: "good-1",
      title: "FRN vs Yahaya Bello Good Case",
      defendants: [{ id: 1, name: "Yahaya Bello" }],
    });
    const bad = bello({
      slug: "bad-1",
      title: "FRN vs Yahaya Bello BOOM Case",
      defendants: [{ id: 2, name: "Yahaya Bello" }],
    });
    const client = makeClient({ throwOnTitle: "BOOM" });
    const res = await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Yahaya Bello" },
      { fetchJson: async () => ({ cases: [bad, good] }), now },
    );
    expect(res.filed).toBe(1);
    expect(res.skipped).toHaveLength(1);
    expect(client.proposals.map((p) => p.payload.title)).toContain(
      "FRN vs Yahaya Bello Good Case",
    );
  });

  it("returns zero for an empty / malformed search response", async () => {
    const client = makeClient();
    const res = await lookupCorruptionCases(
      client.asClient,
      { id: UUID, name: "Nobody Here" },
      { fetchJson: async () => ({}), now },
    );
    expect(res).toEqual({ filed: 0, skipped: [] });
    expect(client.proposals).toHaveLength(0);
  });
});
