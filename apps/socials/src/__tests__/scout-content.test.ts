import { describe, it, expect } from "vitest";
import {
  buildScoutQueries,
  MAX_QUERY_CHARS,
} from "../platforms/twitter/scout/scout-content.js";

describe("buildScoutQueries", () => {
  it("leads with a state-level self-identification query", () => {
    const [stateQuery] = buildScoutQueries("Kano", []);
    expect(stateQuery).toContain('"from Kano"');
    expect(stateQuery).toContain('"based in Kano"');
    expect(stateQuery).toContain('"Kano indigene"');
    expect(stateQuery).toContain("-filter:retweets");
  });

  it("chunks LGA queries so every query stays under MAX_QUERY_CHARS", () => {
    const lgas = Array.from({ length: 44 }, (_, i) => `Some Local Gov ${i}`);
    const queries = buildScoutQueries("Kano", lgas);
    expect(queries.length).toBeGreaterThan(2); // state + several LGA chunks
    for (const q of queries) {
      expect(q.length).toBeLessThanOrEqual(MAX_QUERY_CHARS + 20);
      expect(q).toContain("-filter:retweets");
    }
    // Every LGA appears in exactly one chunk.
    const joined = queries.join(" ");
    for (const lga of lgas) expect(joined).toContain(`"from ${lga}"`);
  });

  it("skips an LGA whose name equals the state name", () => {
    const queries = buildScoutQueries("Bauchi", ["Bauchi", "Ganjuwa"]);
    const lgaQueries = queries.slice(1).join(" ");
    expect(lgaQueries).toContain("Ganjuwa");
    expect(lgaQueries).not.toContain('"Bauchi LGA"');
  });

  it("returns only the state query when there are no LGAs", () => {
    expect(buildScoutQueries("Lagos", [])).toHaveLength(1);
  });
});
