import { describe, expect, it } from "vitest";
import { corsOptionsFor } from "../local-storage-cors";

const allowed = ["http://localhost:3004", "https://app.ournigeria.ng"];

describe("corsOptionsFor", () => {
  it("lets any origin PUT/GET the local storage route without credentials (the URL signature is the gate)", () => {
    const o = corsOptionsFor({ originalUrl: "/api/storage/local/staging/c/u?exp=1&size=2&type=image%2Fpng&sig=abc" }, allowed);
    expect(o).toMatchObject({ origin: true, credentials: false });
    expect(o.methods).toEqual(["GET", "PUT", "OPTIONS"]);
    expect(o.allowedHeaders).toEqual(["content-type", "content-length"]);
  });

  it("keeps the credentialed allowlist for every other route, including lookalike paths", () => {
    for (const url of ["/api/admin/campaigns", "/api/storage/localx/a", "/api/storage/local", "/api/auth/login?next=/api/storage/local/x", "/"]) {
      expect(corsOptionsFor({ originalUrl: url }, allowed), url).toEqual({ origin: allowed, credentials: true });
    }
  });

  it("falls back to url when originalUrl is absent", () => {
    expect(corsOptionsFor({ url: "/api/storage/local/a" }, allowed).credentials).toBe(false);
  });
});
