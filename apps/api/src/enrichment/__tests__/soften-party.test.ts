import { describe, it, expect } from "vitest";
import { softenUnknownParty } from "../creatable.registry";
import type { RawTx } from "../creatable.registry";

/**
 * `party_acronym` is an FK and `political_parties.acronym` is mixed-case
 * (`Accord`), so softenUnknownParty must rewrite a resolved party to the
 * DB's canonical acronym (not the raw agent input) and soften an unknown one to
 * null — never leave a value that would trip the FK. SQL matching itself is
 * integration-tested; here we lock the JS contract + the resolution intent using
 * a fake tx that records the query and returns a canned match.
 */
function fakeTx(match: { acronym: string } | null): { tx: RawTx; sql: () => string } {
  let captured = "";
  const tx: RawTx = {
    async $queryRawUnsafe<T>(sql: string): Promise<T> {
      captured = sql;
      return (match ? [match] : []) as T;
    },
    async $executeRawUnsafe(): Promise<number> {
      return 0;
    },
  };
  return { tx, sql: () => captured };
}

describe("softenUnknownParty", () => {
  it("rewrites a matched party to the DB's canonical acronym (not the raw input)", async () => {
    const { tx } = fakeTx({ acronym: "APC" });
    const payload: Record<string, unknown> = { partyAcronym: "apc" }; // wrong case
    await softenUnknownParty(tx, payload);
    expect(payload.partyAcronym).toBe("APC");
  });

  it("softens an unknown party to null", async () => {
    const { tx } = fakeTx(null);
    const payload: Record<string, unknown> = { partyAcronym: "Not A Party" };
    await softenUnknownParty(tx, payload);
    expect(payload.partyAcronym).toBeNull();
  });

  it("no-ops when no party is supplied", async () => {
    const { tx, sql } = fakeTx({ acronym: "APC" });
    const payload: Record<string, unknown> = {};
    await softenUnknownParty(tx, payload);
    expect(payload.partyAcronym).toBeUndefined();
    expect(sql()).toBe(""); // never queried
  });

  it("matches case-insensitively and by full party name (resolution intent)", async () => {
    const { tx, sql } = fakeTx({ acronym: "APC" });
    await softenUnknownParty(tx, { partyAcronym: "All Progressives Congress" });
    const q = sql().toLowerCase();
    expect(q).toContain("upper(acronym)");
    expect(q).toContain("lower(name)");
  });
});
