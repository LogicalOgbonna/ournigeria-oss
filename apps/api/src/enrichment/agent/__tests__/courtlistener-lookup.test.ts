import { describe, it, expect, vi } from "vitest";
import type { ClientBase } from "pg";
import {
  lookupCourtRecords,
  partyMatchesOfficial,
  isDistinctiveName,
  classifyCaseType,
  roleFromCaption,
} from "../courtlistener-lookup";

const UUID = "11111111-1111-1111-1111-111111111111";
const now = () => new Date("2026-08-20T10:00:00.000Z");

/** A CourtListener v4 RECAP search result (matches the live API shape). */
function crimResult(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    caseName: "United States v. ODUNZEH",
    party: ["UCHE BEN ODUNZEH"],
    court: "District Court, District of Columbia",
    court_id: "dcd",
    docketNumber: "1:12-cr-00195",
    dateFiled: "2012-09-05",
    dateTerminated: "2013-01-31",
    docket_absolute_url: "/docket/4211676/united-states-v-odunzeh/",
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
interface RecordedAttempt {
  officialId: string;
  status: string;
  proposalCount: number;
  note: Record<string, unknown>;
}

function makeClient(
  opts: {
    existing?: Set<string>;
    pending?: Set<string>;
    throwOnTitle?: string;
    failAttempts?: boolean;
    failDedup?: boolean;
    prevNote?: string;
  } = {},
) {
  const existing = opts.existing ?? new Set<string>();
  const pending = opts.pending ?? new Set<string>();
  let idc = 0;
  const proposals: RecordedProposal[] = [];
  const sources: RecordedSource[] = [];
  const attempts: RecordedAttempt[] = [];
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    const s = String(sql).trim();
    if (s.startsWith("SELECT 1 FROM official_legal_cases")) {
      if (opts.failDedup) throw new Error("permission denied for table official_legal_cases");
      const caseNumber = (params as unknown[])[1] as string;
      return { rows: existing.has(caseNumber) ? [{ n: 1 }] : [] };
    }
    if (s.startsWith("SELECT 1 FROM change_proposals")) {
      const caseNumber = (params as unknown[])[1] as string;
      return { rows: pending.has(caseNumber) ? [{ n: 1 }] : [] };
    }
    if (s.startsWith("SELECT note FROM enrichment_attempts")) {
      return { rows: opts.prevNote ? [{ note: opts.prevNote }] : [] };
    }
    if (s.startsWith("INSERT INTO change_proposals")) {
      const p = params as unknown[];
      const payload = JSON.parse(p[1] as string) as Record<string, unknown>;
      if (opts.throwOnTitle && String(payload.title).includes(opts.throwOnTitle)) {
        throw new Error("boom");
      }
      proposals.push({
        targetTable: p[0] as string,
        payload,
        status: p[2] as string,
        confidence: p[3] as string,
        reasoning: p[4] as string | null,
        agentRunId: p[5] as string | null,
      });
      return { rows: [{ id: `prop-${++idc}` }] };
    }
    if (s.startsWith("INSERT INTO proposal_sources")) {
      const p = params as unknown[];
      sources.push({
        url: p[1] as string, publisher: p[3] as string, snippet: p[4] as string,
        format: p[5] as string, locator: p[6] as string | null, tier: p[7] as string,
        retrievedAt: p[9] as string,
      });
      return { rows: [] };
    }
    if (s.startsWith("INSERT INTO enrichment_attempts")) {
      if (opts.failAttempts) throw new Error("permission denied for table enrichment_attempts");
      const p = params as unknown[];
      attempts.push({
        officialId: p[0] as string,
        status: p[1] as string,
        proposalCount: p[2] as number,
        note: JSON.parse(p[3] as string) as Record<string, unknown>,
      });
      return { rows: [] };
    }
    if (s === "BEGIN" || s === "COMMIT" || s === "ROLLBACK") return { rows: [] };
    return { rows: [] };
  });
  return { query, proposals, sources, attempts } as unknown as ClientBase & {
    proposals: RecordedProposal[];
    sources: RecordedSource[];
    attempts: RecordedAttempt[];
  };
}

const OFFICIAL = { id: UUID, name: "Uche Ben Odunzeh" };

/** fetchJson mock returning one page with the given results. */
function onePage(results: unknown[], count?: number) {
  return vi.fn(async () => ({ results, count: count ?? results.length, next: null }));
}

describe("partyMatchesOfficial", () => {
  it("matches when every official token is a party token", () => {
    expect(partyMatchesOfficial("Uche Ben Odunzeh", "UCHE BEN ODUNZEH")).toBe(true);
  });
  it("does not match a different party or the United States plaintiff", () => {
    expect(partyMatchesOfficial("Uche Ben Odunzeh", "John Smith")).toBe(false);
    expect(partyMatchesOfficial("Uche Ben Odunzeh", "United States")).toBe(false);
  });
});

describe("isDistinctiveName", () => {
  it("rare surname = distinctive", () => {
    expect(isDistinctiveName("Uche Ben Odunzeh")).toBe(true);
  });
  it("all-common tokens = NOT distinctive (namesake bait)", () => {
    expect(isDistinctiveName("Mohammed Ahmed")).toBe(false);
    expect(isDistinctiveName("Donald Duke")).toBe(false);
    expect(isDistinctiveName("Peter Obi")).toBe(false);
  });
  it("single-token names are never distinctive enough to auto-file", () => {
    expect(isDistinctiveName("Sowore")).toBe(false);
  });
  it("data-validated additions catch the scan's real false-positive names", () => {
    expect(isDistinctiveName("Adeleke Olanrewaju")).toBe(false); // matched a CA debarment namesake
    expect(isDistinctiveName("Yahaya Bello")).toBe(false);
  });
  it("keeps a leading honorific token when it may be the given name", () => {
    // "Prince Nnamdi": stripping would leave 1 token — keep it
    expect(partyMatchesOfficial("Prince Nnamdi", "PRINCE NNAMDI")).toBe(true);
    // "Chief Uche Odunzeh" strips to the name proper
    expect(partyMatchesOfficial("Chief Uche Odunzeh", "UCHE ODUNZEH")).toBe(true);
  });
});

describe("classifyCaseType", () => {
  it("US v. <person> = criminal (all caption variants)", () => {
    expect(classifyCaseType("United States v. ODUNZEH", "dcd")).toBe("criminal");
    expect(classifyCaseType("United States of America v. ODUNZEH", "dcd")).toBe("criminal");
    expect(classifyCaseType("USA v. Odunzeh", "dcd")).toBe("criminal");
    expect(classifyCaseType("U.S. v. Odunzeh", "dcd")).toBe("criminal");
  });
  it("US v. <property> = civil (forfeiture)", () => {
    expect(classifyCaseType("United States v. The M/Y Galactica Star", "txsd")).toBe("civil");
    expect(classifyCaseType("United States of America v. Real Property Located in Los Angeles", "txsd")).toBe("civil");
  });
  it("bankruptcy court = civil", () => {
    expect(classifyCaseType("Donald Duke", "areb")).toBe("civil");
  });
  it("X v. Y = civil", () => {
    expect(classifyCaseType("Abubakar v. Chicago State University", "ilnd")).toBe("civil");
  });
});

describe("roleFromCaption", () => {
  it("criminal US v. X = defendant", () => {
    expect(roleFromCaption("United States v. ODUNZEH", "criminal", "UCHE BEN ODUNZEH")).toBe("defendant");
  });
  it("civil: caption side carrying the matched party decides plaintiff vs defendant", () => {
    expect(roleFromCaption("Oyenuga v. Sowore", "civil", "Sowore")).toBe("defendant");
    // captions abbreviate to surnames — the full party name must still resolve
    expect(roleFromCaption("Oyenuga v. Sowore", "civil", "Omoyele Sowore")).toBe("defendant");
    expect(roleFromCaption("Abubakar v. Chicago State University", "civil", "Atiku Abubakar")).toBe("plaintiff");
  });
  it("returns null when the caption proves nothing", () => {
    expect(roleFromCaption("In re Emerald Medical", "civil", "Odunzeh")).toBe(null);
  });
});

describe("lookupCourtRecords", () => {
  it("files a criminal party-match into an official_legal_cases proposal (conservative status, needsHuman)", async () => {
    const client = makeClient();
    const fetchJson = onePage([crimResult()]);
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });

    expect(res.filed).toBe(1);
    expect(res.leads).toEqual([]);
    expect(res.totalCount).toBe(1);
    expect(res.truncated).toBe(false);
    // phrase is the CLEANED (lowercased, honorific-stripped) name
    expect(fetchJson).toHaveBeenCalledWith(
      'https://www.courtlistener.com/api/rest/v4/search/?type=r&q=%22uche%20ben%20odunzeh%22',
      undefined,
    );
    const p = client.proposals[0];
    expect(p.targetTable).toBe("official_legal_cases");
    expect(p.status).toBe("needs_human"); // needsHuman:true
    expect(p.payload.officialId).toBe(UUID);
    expect(p.payload.title).toBe("United States v. ODUNZEH");
    expect(p.payload.caseType).toBe("criminal");
    // Docket IS terminated (dateTerminated present) → concluded, disposition
    // unknown. Must NOT claim the case is still live ("charged"/"on_trial"),
    // and NEVER 'convicted' from metadata.
    expect(p.payload.status).toBe("closed");
    expect(p.payload.forum).toBe("District Court, District of Columbia");
    expect(p.payload.caseNumber).toBe("1:12-cr-00195");
    expect(p.payload.filedDate).toBe("2012-09-05");
    expect(p.payload.resolvedDate).toBe("2013-01-31");
    expect(p.payload.role).toBe("defendant"); // US v. <person> party = defendant
    expect(p.payload.recordKind).toBe("appearance"); // never "adjudicated" from metadata
    // terminated docket + no disposition in metadata → honesty marker in outcome
    expect(String(p.payload.outcome)).toMatch(/terminated 2013-01-31.*verify/i);
  });

  it("marks an open docket (no dateTerminated) as charged/on_trial, not closed", async () => {
    const client = makeClient();
    // Open criminal docket
    let res = await lookupCourtRecords(
      client, { id: UUID, name: "Uche Ben Odunzeh" },
      { fetchJson: onePage([crimResult({ dateTerminated: undefined })]), now },
    );
    expect(res.filed).toBe(1);
    expect(client.proposals[0].payload.status).toBe("charged");
    expect(client.proposals[0].payload.outcome ?? null).toBeNull();

    // Open civil docket
    const client2 = makeClient();
    res = await lookupCourtRecords(
      client2, { id: UUID, name: "Uche Ben Odunzeh" },
      { fetchJson: onePage([crimResult({
        caseName: "Odunzeh v. Acme Corp", docketNumber: "1:20-cv-00001", dateTerminated: undefined,
      })]), now },
    );
    expect(res.filed).toBe(1);
    expect(client2.proposals[0].payload.caseType).toBe("civil");
    expect(client2.proposals[0].payload.status).toBe("on_trial");
  });

  it("marks a terminated civil docket as closed (the on-trial-after-resolution bug)", async () => {
    const client = makeClient();
    const res = await lookupCourtRecords(
      client, { id: UUID, name: "Uche Ben Odunzeh" },
      { fetchJson: onePage([crimResult({
        caseName: "Olukoya v. Odunzeh", docketNumber: "8:18-cv-02922",
        dateFiled: "2018-09-20", dateTerminated: "2022-05-04",
      })]), now },
    );
    expect(res.filed).toBe(1);
    const p = client.proposals[0];
    expect(p.payload.caseType).toBe("civil");
    expect(p.payload.status).toBe("closed"); // NOT "on_trial" — docket terminated 2022
    expect(p.payload.resolvedDate).toBe("2022-05-04");
    expect(String(p.payload.outcome)).toMatch(/terminated 2022-05-04/i);
  });

  it("strips honorifics from both the query phrase and the party guard", async () => {
    const client = makeClient();
    const fetchJson = onePage([crimResult()]);
    const res = await lookupCourtRecords(
      client, { id: UUID, name: "Chief Uche Ben Odunzeh" }, { fetchJson, now },
    );
    expect(String((fetchJson.mock.calls[0] as unknown[])[0])).toContain(encodeURIComponent('"uche ben odunzeh"'));
    expect(res.filed).toBe(1); // "chief" must not break the party match
  });

  it("cites exactly one official-tier courtlistener docket backlink", async () => {
    const client = makeClient();
    await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    expect(client.sources).toHaveLength(1);
    const src = client.sources[0];
    expect(src.url).toBe("https://www.courtlistener.com/docket/4211676/united-states-v-odunzeh/");
    expect(src.publisher).toBe("courtlistener.com");
    expect(src.format).toBe("html");
    expect(src.locator).toBe("1:12-cr-00195");
    expect(src.tier).toBe("official"); // guards the profiles.ts trustedDomains edit
    expect(src.retrievedAt).toBe("2026-08-20T10:00:00.000Z");
  });

  it("sends the Authorization: Token header when a token is provided", async () => {
    const client = makeClient();
    const fetchJson = onePage([crimResult()]);
    await lookupCourtRecords(client, OFFICIAL, { fetchJson, now, token: "abc123" });
    expect(fetchJson).toHaveBeenCalledWith(expect.any(String), { Authorization: "Token abc123" });
  });

  it("routes a named-in / non-party hit to leads, does NOT file it", async () => {
    const client = makeClient();
    const fetchJson = onePage([{
      caseName: "Abubakar v. Chicago State University",
      party: ["Atiku Abubakar", "Chicago State University"],
      court: "District Court, N.D. Illinois", court_id: "ilnd",
      docketNumber: "1:23-cv-05099", dateFiled: "2023-08-02",
      docket_absolute_url: "/docket/67662680/abubakar-v-chicago-state-university/",
    }]);
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(res.filed).toBe(0);
    expect(client.proposals).toHaveLength(0);
    expect(res.leads).toHaveLength(1);
    expect(res.leads[0].caseType).toBe("civil");
    expect(res.leads[0].reason).toMatch(/named-in/i);
  });

  it("routes a party match on an ALL-COMMON name to leads (namesake guard), not a proposal", async () => {
    const client = makeClient();
    const fetchJson = onePage([{
      caseName: "Mohammed Ahmed Abdullah",
      party: ["Mohammed Ahmed Abdullah"],
      court: "Bankruptcy Court, D. Minnesota", court_id: "mnb",
      docketNumber: "17-41220", dateFiled: "2017-04-01",
      docket_absolute_url: "/docket/1/mohammed-ahmed-abdullah/",
    }]);
    const res = await lookupCourtRecords(client, { id: UUID, name: "Mohammed Ahmed" }, { fetchJson, now });
    expect(res.filed).toBe(0);
    expect(client.proposals).toHaveLength(0);
    expect(res.leads).toHaveLength(1);
    expect(res.leads[0].reason).toMatch(/common name/i);
  });

  it("follows the next cursor and merges pages; flags truncation beyond the page cap", async () => {
    const client = makeClient();
    const page2 = crimResult({ caseName: "United States v. ODUNZEH II", docketNumber: "1:13-cr-00001" });
    const fetchJson = vi.fn()
      .mockResolvedValueOnce({ results: [crimResult()], count: 90, next: "https://www.courtlistener.com/api/rest/v4/search/?cursor=p2" })
      .mockResolvedValueOnce({ results: [page2], count: 90, next: "https://www.courtlistener.com/api/rest/v4/search/?cursor=p3" })
      .mockResolvedValueOnce({ results: [], count: 90, next: "https://www.courtlistener.com/api/rest/v4/search/?cursor=p4" });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    // 3 search pages (MAX_PAGES) + 2 party-role fetches (one per filed hit)
    expect(fetchJson).toHaveBeenCalledTimes(5);
    expect(fetchJson.mock.calls[1][0]).toContain("cursor=p2");
    expect(res.filed).toBe(2);
    expect(res.totalCount).toBe(90);
    expect(res.truncated).toBe(true); // a next cursor remained after the cap
    expect(res.apiRequests).toBe(5);
  });

  it("dedups duplicate dockets within one result set (CL returns the same matter twice)", async () => {
    const client = makeClient();
    const fetchJson = onePage([crimResult(), crimResult()]); // same docketNumber twice
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(res.filed).toBe(1);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0].reason).toMatch(/duplicate docket/i);
  });

  it("skips a docket the official already has (dedup by case_number)", async () => {
    const client = makeClient({ existing: new Set(["1:12-cr-00195"]) });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    expect(res.filed).toBe(0);
    expect(res.skipped[0].reason).toMatch(/already exists/i);
  });

  it("skips a docket with a still-pending proposal (re-runs must not spam the queue)", async () => {
    const client = makeClient({ pending: new Set(["1:12-cr-00195"]) });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    expect(res.filed).toBe(0);
    expect(client.proposals).toHaveLength(0);
    expect(res.skipped[0].reason).toMatch(/pending proposal/i);
  });

  it("degrades a party match with no docket URL to a lead (backlink is required to file)", async () => {
    const client = makeClient();
    const res = await lookupCourtRecords(client, OFFICIAL, {
      fetchJson: onePage([crimResult({ docket_absolute_url: "" })]), now,
    });
    expect(res.filed).toBe(0);
    expect(res.leads).toHaveLength(1);
    expect(res.leads[0].reason).toMatch(/no docket URL/i);
  });

  it("falls back to a first+last variant query when the full name finds nothing", async () => {
    const client = makeClient();
    const fetchJson = vi.fn()
      .mockResolvedValueOnce({ results: [], count: 0, next: null }) // "Uche Ben Odunzeh"
      .mockResolvedValueOnce({ results: [crimResult({ party: ["UCHE ODUNZEH"] })], count: 1, next: null }); // "Uche Odunzeh"
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(fetchJson).toHaveBeenCalledTimes(2);
    expect(String(fetchJson.mock.calls[1][0])).toContain(encodeURIComponent('"uche odunzeh"'));
    // party "UCHE ODUNZEH" lacks "ben" → still a valid party-match for the official? No:
    // the guard requires every official token in the party — "ben" is missing, so this
    // surfaces as a LEAD (correct: a human confirms the shortened-name identity).
    expect(res.filed).toBe(0);
    expect(res.leads).toHaveLength(1);
  });

  it("records the attempt + persists leads to enrichment_attempts", async () => {
    const client = makeClient();
    const fetchJson = onePage([
      crimResult(),
      { caseName: "Greenspan v. MasMarques", party: ["Greenspan"], court: "D. Mass", court_id: "mad",
        docketNumber: "1:23-cv-10134", docket_absolute_url: "/docket/2/x/" },
    ]);
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(res.attemptRecorded).toBe(true);
    expect(client.attempts).toHaveLength(1);
    const a = client.attempts[0];
    expect(a.officialId).toBe(UUID);
    expect(a.status).toBe("filled");
    expect(a.proposalCount).toBe(1);
    expect(a.note.source).toBe("courtlistener");
    expect((a.note.leads as unknown[]).length).toBe(1); // the named-in lead persisted
    expect(a.note.filed).toBe(1);
  });

  it("MERGES previously stored leads instead of overwriting (sparse rerun loses nothing)", async () => {
    const oldLead = {
      caseName: "United States v. Jefferson", court: "E.D. Va", docketNumber: "1:07-cr-00209",
      url: "https://www.courtlistener.com/docket/4749587/united-states-v-jefferson/",
      caseType: "criminal", reason: "named-in only (not a party name-match)",
    };
    const client = makeClient({
      prevNote: JSON.stringify({ source: "courtlistener", leads: [oldLead] }),
    });
    // this run finds nothing at all
    const fetchJson = vi.fn(async () => ({ results: [], count: 0, next: null }));
    await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    const a = client.attempts[0];
    const kept = (a.note.leads as Array<{ docketNumber: string }>);
    expect(kept.some((l) => l.docketNumber === "1:07-cr-00209")).toBe(true); // survived
  });

  it("sets next_eligible_at in the attempts upsert (no infinite re-check loop)", async () => {
    const client = makeClient();
    await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    const upsert = (client.query as ReturnType<typeof vi.fn>).mock.calls
      .find((c: unknown[]) => String(c[0]).includes("INSERT INTO enrichment_attempts"));
    expect(String(upsert?.[0])).toMatch(/next_eligible_at = now\(\) \+ interval '90 days'/);
  });

  it("also dedups against APPROVED (not-yet-applied) proposals", async () => {
    const client = makeClient({ pending: new Set(["1:12-cr-00195"]) });
    await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    const dedupSql = (client.query as ReturnType<typeof vi.fn>).mock.calls
      .find((c: unknown[]) => String(c[0]).includes("FROM change_proposals"));
    expect(String(dedupSql?.[0])).toContain("'approved'");
  });

  it("refuses to follow a next cursor pointing off courtlistener.com (token-leak guard)", async () => {
    const client = makeClient();
    const fetchJson = vi.fn()
      .mockResolvedValueOnce({ results: [crimResult()], count: 40, next: "https://evil.example.com/steal?x=1" });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now, token: "abc" });
    // 1 search (foreign cursor NOT followed) + 1 parties fetch for the filed hit
    expect(fetchJson).toHaveBeenCalledTimes(2);
    for (const call of fetchJson.mock.calls) {
      expect(String(call[0])).toMatch(/^https:\/\/www\.courtlistener\.com\//);
    }
    expect(res.filed).toBe(1);
  });

  it("uses the authoritative party-type from the /parties/ API when available", async () => {
    const client = makeClient();
    const fetchJson = vi.fn()
      .mockResolvedValueOnce({ results: [crimResult()], count: 1, next: null })
      .mockResolvedValueOnce({ results: [
        { name: "UCHE BEN ODUNZEH", party_types: [{ name: "Claimant" }] },
        { name: "United States", party_types: [{ name: "Plaintiff" }] },
      ] });
    await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(String(fetchJson.mock.calls[1][0])).toContain("/api/rest/v4/parties/?docket=4211676");
    expect(client.proposals[0].payload.role).toBe("claimant"); // API beats caption inference
  });

  it("degrades gracefully when the dedup SELECT grant is missing: warns and still files", async () => {
    const client = makeClient({ failDedup: true });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    expect(res.filed).toBe(1); // a duplicate a human can reject beats a silent no-op
    expect(res.warnings.some((w) => w.includes("dedup unavailable"))).toBe(true);
  });

  it("deepLeads opt-in fetches a document hint for leads", async () => {
    const client = makeClient();
    const fetchJson = vi.fn()
      .mockResolvedValueOnce({ results: [{
        caseName: "Abubakar v. Chicago State University",
        party: ["Atiku Abubakar", "Chicago State University"],
        court: "N.D. Ill.", court_id: "ilnd", docketNumber: "1:23-cv-05099",
        docket_absolute_url: "/docket/67662680/abubakar-v-csu/",
      }], count: 1, next: null })
      .mockResolvedValueOnce({ results: [{ description: "Exhibit 3 — deposition", absolute_url: "/doc/1/x/" }] });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now, deepLeads: true });
    expect(String(fetchJson.mock.calls[1][0])).toContain("type=rd");
    expect(String(fetchJson.mock.calls[1][0])).toContain("docket_id=67662680");
    expect(res.leads[0].documentHint).toContain("Exhibit 3");
  });

  it("captures judge/cause/suitNature into leads and the proposal snippet", async () => {
    const client = makeClient();
    const fetchJson = onePage([
      crimResult({ assignedTo: "Ellen Segal Huvelle", suitNature: "890 RICO", cause: "18:1349" }),
      { caseName: "Someone v. Other", party: ["Someone"], court: "S.D.N.Y.", court_id: "nysd",
        docketNumber: "1:20-cv-00001", assignedTo: "Judge X", suitNature: "190 Contract",
        docket_absolute_url: "/docket/9/x/" },
    ]);
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(client.sources[0].snippet).toContain("Judge Ellen Segal Huvelle");
    expect(client.sources[0].snippet).toContain("890 RICO");
    expect(res.leads[0].judge).toBe("Judge X");
    expect(res.leads[0].suitNature).toBe("190 Contract");
  });

  it("survives an enrichment_attempts permission failure (leads still returned)", async () => {
    const client = makeClient({ failAttempts: true });
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson: onePage([crimResult()]), now });
    expect(res.filed).toBe(1); // filing unaffected
    expect(res.attemptRecorded).toBe(false);
  });

  it("isolates a failing hit and still files the others", async () => {
    const client = makeClient({ throwOnTitle: "BAD" });
    const fetchJson = onePage([
      crimResult({ caseName: "United States v. BAD", docketNumber: "1:99-cr-00001" }),
      crimResult(),
    ]);
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(res.filed).toBe(1);
    expect(res.skipped.some((s) => s.reason === "boom")).toBe(true);
    expect(client.proposals[0].payload.title).toBe("United States v. ODUNZEH");
  });

  it("returns zero for an empty / malformed search response (after the variant fallback)", async () => {
    const client = makeClient();
    const fetchJson = vi.fn(async () => ({}));
    const res = await lookupCourtRecords(client, OFFICIAL, { fetchJson, now });
    expect(fetchJson).toHaveBeenCalledTimes(2); // full name + variant fallback
    expect(res.filed).toBe(0);
    expect(res.leads).toEqual([]);
    expect(res.skipped).toEqual([]);
    expect(client.proposals).toHaveLength(0);
  });
});
