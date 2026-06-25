import { describe, it, expect } from "vitest";
import { buildPgDumpArgs } from "../admin-backup.service";

const URL = "postgresql://u:p@host:5432/spending";

describe("buildPgDumpArgs", () => {
  it("FULL dumps everything (no data exclusions)", () => {
    const args = buildPgDumpArgs("FULL", URL);
    expect(args).toContain("--format=custom");
    expect(args).toContain("--no-owner");
    expect(args).toContain("--no-privileges");
    expect(args).toContain(`--dbname=${URL}`);
    expect(args.some((a) => a.startsWith("--exclude-table-data"))).toBe(false);
  });

  it("RELATIONAL excludes chunk + vector table data", () => {
    const args = buildPgDumpArgs("RELATIONAL", URL);
    expect(args).toContain("--exclude-table-data=*_chunks");
    expect(args).toContain("--exclude-table-data=*_vectors");
    expect(args).toContain("--format=custom");
  });
});
