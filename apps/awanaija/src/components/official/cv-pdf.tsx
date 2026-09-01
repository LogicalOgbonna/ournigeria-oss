/**
 * Branded "Download CV" PDF for an official's profile (ProfileV10).
 *
 * Renders an A4, print-safe OurNigeria document with @react-pdf/renderer:
 * light ground, emerald accents, Instrument Serif display, Instrument Sans
 * body, IBM Plex Mono data labels, the green-white-green flag accent
 * (DESIGN.md: static images only), and a "Because na your money." footer.
 * Sections mirror ProfileV10 and render only when they have data. Family is
 * deliberately excluded (not CV material); Legal & Integrity is included in
 * the red register — this is a transparency platform, the CV tells the whole
 * public record.
 *
 * `OfficialCvDocument` is pure so it can also be rendered from Node (used by
 * the design-iteration script). Browser entry point: `downloadOfficialCv`,
 * dynamic-imported by ProfileV10 so react-pdf stays out of the page bundle.
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Official, Position, ElectionRecord } from "@/lib/api";
import { roleLabel } from "@/lib/roles";

/* ---------- palette (light/print rendition of the brand) ---------- */

const INK = "#1a2421";
const MUTED = "#5c6b63";
const FAINT = "#96a39b";
const HAIRLINE = "#dbe4de";
const EMERALD = "#059669";
const EMERALD_DEEP = "#065f46";
const AMBER = "#b45309";
const RED = "#b91c1c";
const RED_FAINT = "#fdf1f1";
const PAPER = "#ffffff";
const CARD = "#f5f8f6";

/* ---------- fonts ---------- */

let fontsRegistered = false;

/** Register the brand fonts. `base` is the URL/path prefix for /fonts —
 *  `window.location.origin` in the browser, an absolute directory in Node. */
export function registerCvFonts(base: string) {
  if (fontsRegistered) return;
  fontsRegistered = true;
  const f = (file: string) => `${base}/fonts/${file}`;
  Font.register({
    family: "Instrument Sans",
    fonts: [
      { src: f("InstrumentSans-Regular.ttf"), fontWeight: 400 },
      { src: f("InstrumentSans-Medium.ttf"), fontWeight: 500 },
      { src: f("InstrumentSans-SemiBold.ttf"), fontWeight: 600 },
      { src: f("InstrumentSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Instrument Serif",
    fonts: [
      { src: f("InstrumentSerif-Regular.ttf"), fontStyle: "normal" },
      { src: f("InstrumentSerif-Italic.ttf"), fontStyle: "italic" },
    ],
  });
  Font.register({
    family: "IBM Plex Mono",
    fonts: [
      { src: f("IBMPlexMono-Regular.ttf"), fontWeight: 400 },
      { src: f("IBMPlexMono-Medium.ttf"), fontWeight: 500 },
      { src: f("IBMPlexMono-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  // CVs read better without hyphenation at these sizes.
  Font.registerHyphenationCallback((word) => [word]);
}

/* ---------- labels + formatters (same semantics as ProfileV10) ---------- */

const TYPE_LABELS: Record<string, string> = {
  elected: "Elected Official",
  appointed: "Appointed Official",
  civil_servant: "Civil Servant",
  judicial: "Judicial Officer",
  security: "Security Official",
  traditional: "Traditional Ruler",
  other: "Public Official",
};


function yearOf(iso: string | null): string | null {
  return iso ? iso.split("-")[0] : null;
}

function yearRange(start: number | null, end: number | null): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end) return `${end}`;
  return "";
}

function dateRange(start: string | null, end: string | null, current?: boolean): string {
  const s = yearOf(start);
  if (current || (!end && s)) return s ? `${s} – Present` : "Present";
  const e = yearOf(end);
  if (s && e) return `${s} – ${e}`;
  return s ?? e ?? "";
}

function positionScope(p: Position): string | null {
  return p.constituency || p.ward || p.lga || p.state || null;
}

function formatNaira(amount: number | null): string | null {
  if (amount == null) return null;
  const abs = Math.abs(amount);
  if (abs >= 1e12) return `₦${(amount / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `₦${(amount / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `₦${(amount / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `₦${(amount / 1e3).toFixed(0)}K`;
  return `₦${amount}`;
}

/* ---------- styles ---------- */

const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    fontFamily: "Instrument Sans",
    fontSize: 9.5,
    paddingTop: 44,
    paddingHorizontal: 52,
    paddingBottom: 64,
  },
  /* header */
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  wordmark: { fontFamily: "Instrument Serif", fontSize: 17, color: EMERALD_DEEP },
  brandTag: { fontFamily: "IBM Plex Mono", fontSize: 6.5, color: FAINT, letterSpacing: 1.2, marginTop: 2, textTransform: "uppercase" },
  flagRow: { flexDirection: "row" },
  flagBar: { width: 14, height: 7 },
  brandRule: { height: 2.5, backgroundColor: EMERALD, marginTop: 10, marginBottom: 22 },
  /* identity */
  idRow: { flexDirection: "row", justifyContent: "space-between" },
  overline: { fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 7.5, color: EMERALD, letterSpacing: 1.6, textTransform: "uppercase" },
  name: { fontFamily: "Instrument Serif", fontSize: 30, color: INK, marginTop: 4, letterSpacing: -0.3 },
  jurisdiction: { fontSize: 11, color: MUTED, marginTop: 3 },
  contactLine: { fontFamily: "IBM Plex Mono", fontSize: 7, color: MUTED, marginTop: 8 },
  photo: { width: 78, height: 84, borderRadius: 6, objectFit: "cover", borderWidth: 1, borderColor: HAIRLINE },
  bio: { fontSize: 9.5, lineHeight: 1.55, color: INK, marginTop: 14, maxWidth: 460 },
  /* stats strip */
  stats: { flexDirection: "row", marginTop: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: HAIRLINE },
  statCell: { flex: 1, paddingVertical: 10, alignItems: "center" },
  statCellDivider: { borderLeftWidth: 1, borderColor: HAIRLINE },
  statNum: { fontFamily: "IBM Plex Mono", fontWeight: 600, fontSize: 13 },
  statLabel: { fontFamily: "IBM Plex Mono", fontSize: 6, color: FAINT, letterSpacing: 1.1, textTransform: "uppercase", marginTop: 3 },
  /* sections */
  section: { marginTop: 20 },
  secTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  secTitle: { fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 14, color: EMERALD_DEEP },
  secRule: { flex: 1, height: 0.75, backgroundColor: HAIRLINE, marginLeft: 10 },
  row: { paddingVertical: 5.5, borderBottomWidth: 0.75, borderColor: HAIRLINE },
  rowLast: { borderBottomWidth: 0 },
  rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  rowTitle: { fontSize: 9.5, fontWeight: 600, color: INK, flexShrink: 1, paddingRight: 8 },
  rowDate: { fontFamily: "IBM Plex Mono", fontSize: 7, color: MUTED },
  rowSub: { fontSize: 8, color: MUTED, marginTop: 1.5 },
  /* timeline (political career) */
  tlItem: { borderLeftWidth: 2, borderColor: HAIRLINE, paddingLeft: 10, paddingVertical: 4, marginBottom: 4 },
  tlItemCurrent: { borderColor: EMERALD },
  tlDate: { fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 7, letterSpacing: 0.8, textTransform: "uppercase" },
  /* elections table */
  th: { fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 6.5, color: FAINT, letterSpacing: 1, textTransform: "uppercase" },
  td: { fontSize: 8.5, color: INK },
  tdMuted: { fontSize: 8.5, color: MUTED },
  colYear: { width: 40 },
  colOffice: { flex: 1 },
  colParty: { width: 58 },
  colVotes: { width: 88 },
  colResult: { width: 48, textAlign: "right" },
  /* legal */
  legalItem: { backgroundColor: RED_FAINT, borderLeftWidth: 2, borderColor: RED, borderRadius: 3, padding: 9, marginBottom: 6 },
  legalType: { fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 6.5, color: RED, letterSpacing: 1, textTransform: "uppercase" },
  legalTitle: { fontSize: 9.5, fontWeight: 600, color: INK, marginTop: 2.5 },
  legalMeta: { fontSize: 8, color: MUTED, marginTop: 1.5 },
  /* footer */
  footer: {
    position: "absolute",
    left: 52,
    right: 52,
    bottom: 26,
    borderTopWidth: 0.75,
    borderColor: HAIRLINE,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footText: { fontFamily: "IBM Plex Mono", fontSize: 6, color: FAINT, letterSpacing: 0.4, flex: 1, paddingRight: 24 },
  footPage: { fontFamily: "IBM Plex Mono", fontSize: 6, color: FAINT, letterSpacing: 0.4, width: 60, textAlign: "right" },
  footAccent: { color: EMERALD },
});

/* ---------- small pieces ---------- */

function FlagBars() {
  return (
    <View style={s.flagRow}>
      <View style={[s.flagBar, { backgroundColor: EMERALD }]} />
      <View style={[s.flagBar, { backgroundColor: PAPER, borderWidth: 0.75, borderColor: HAIRLINE }]} />
      <View style={[s.flagBar, { backgroundColor: EMERALD }]} />
    </View>
  );
}

function SecTitle({ children }: { children: string }) {
  return (
    <View style={s.secTitleRow}>
      <Text style={s.secTitle}>{children}</Text>
      <View style={s.secRule} />
    </View>
  );
}

function Rows<T>({ items, render }: { items: T[]; render: (item: T, last: boolean) => React.ReactNode }) {
  return <View>{items.map((it, i) => render(it, i === items.length - 1))}</View>;
}

/* ---------- document ---------- */

export function OfficialCvDocument({
  official,
  photoSrc,
  generatedOn,
}: {
  official: Official;
  /** Resolved photo source (data URL in the browser, file path in Node) or null. */
  photoSrc: string | null;
  /** Pre-formatted generation date, e.g. "26 Aug 2026". */
  generatedOn: string;
}) {
  const positions = official.positions ?? [];
  const current = positions.find((p) => p.isCurrent) ?? positions[0];
  const education = official.educationRecords ?? [];
  const careers = official.careerRecords ?? [];
  const parties = official.partyHistory ?? [];
  const committees = official.committees ?? [];
  const bills = official.sponsoredBills ?? [];
  const elections = official.elections ?? [];
  const assets = official.assetDeclarations ?? [];
  const awards = official.awards ?? [];
  const pubs = official.publications ?? [];
  const legal = official.legalCases ?? [];
  const corruption = official.corruptionCases ?? [];

  const overline = current
    ? [roleLabel(current.role), current.party].filter(Boolean).join(" · ")
    : official.officialType
      ? (TYPE_LABELS[official.officialType] ?? "Public Official")
      : "Official";
  const jurisdiction = current ? positionScope(current) : null;
  const electionsWon = elections.filter((e) => e.result?.toLowerCase() === "won").length;
  const latestAsset = assets.map((a) => a.amount).find((a) => a != null) ?? null;
  const legalCount = legal.length + corruption.length;
  const profileUrl = official.slug ? `ournigeria.ng/officials/${official.slug}` : "ournigeria.ng/officials";

  const tw = official.twitterHandle?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
  const contact = [
    official.email,
    official.phoneNumber,
    tw ? `x.com/${tw}` : null,
    official.officeAddress,
  ].filter(Boolean).join("   ·   ");

  const stats: { n: string; l: string; color?: string }[] = [
    { n: elections.length ? `${electionsWon} / ${elections.length}` : "—", l: "Elections Won", color: EMERALD },
    { n: positions.length ? String(positions.length) : "—", l: "Public Offices", color: EMERALD },
    { n: latestAsset != null ? formatNaira(latestAsset)! : "—", l: "Assets Declared", color: AMBER },
    { n: legalCount ? String(legalCount) : "—", l: "Legal Records", color: legalCount ? RED : undefined },
  ];

  return (
    <Document
      title={`${official.name} — Official CV · OurNigeria`}
      author="OurNigeria"
      subject="Public-record CV generated from ournigeria.ng"
    >
      <Page size="A4" style={s.page}>
        {/* brand header */}
        <View style={s.brandRow}>
          <View>
            <Text style={s.wordmark}>Our Nigeria</Text>
            <Text style={s.brandTag}>Civic transparency · backed by public records</Text>
          </View>
          <FlagBars />
        </View>
        <View style={s.brandRule} />

        {/* identity */}
        <View style={s.idRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={s.overline}>Official Profile · {overline}</Text>
            <Text style={s.name}>{official.name}</Text>
            {jurisdiction ? (
              <Text style={s.jurisdiction}>
                {jurisdiction === current?.state && !/state$/i.test(jurisdiction)
                  ? `${jurisdiction} State`
                  : `${jurisdiction}${current?.state && jurisdiction !== current.state ? `, ${current.state}` : ""}`}
              </Text>
            ) : null}
            {contact ? <Text style={s.contactLine}>{contact}</Text> : null}
          </View>
          {photoSrc ? <Image src={photoSrc} style={s.photo} /> : null}
        </View>

        {official.biography ? <Text style={s.bio}>{official.biography}</Text> : null}

        {/* stats strip */}
        <View style={s.stats}>
          {stats.map((st, i) => (
            <View key={st.l} style={[s.statCell, ...(i ? [s.statCellDivider] : [])]}>
              <Text style={[s.statNum, { color: st.n === "—" ? FAINT : st.color ?? INK }]}>{st.n}</Text>
              <Text style={s.statLabel}>{st.l}</Text>
            </View>
          ))}
        </View>

        {/* sparse record — keep the document honest instead of blank */}
        {positions.length + elections.length + education.length + careers.length + parties.length +
          committees.length + bills.length + assets.length + awards.length + pubs.length + legalCount === 0 && (
          <View style={[s.section, { backgroundColor: CARD, borderRadius: 4, padding: 14 }]}>
            <Text style={{ fontSize: 9, color: MUTED, lineHeight: 1.5 }}>
              This public record is still being completed. No structured records have been
              verified for this official yet — you can help by submitting a record at{" "}
              <Text style={{ color: EMERALD }}>{profileUrl}</Text>.
            </Text>
          </View>
        )}

        {/* political career */}
        {positions.length > 0 && (
          <View style={s.section}>
            <SecTitle>Political Career</SecTitle>
            {positions.map((p) => (
              <View key={p.id} style={[s.tlItem, ...(p.isCurrent ? [s.tlItemCurrent] : [])]} wrap={false}>
                <Text style={[s.tlDate, { color: p.isCurrent ? EMERALD : MUTED }]}>{dateRange(p.startDate, p.endDate, p.isCurrent)}</Text>
                <Text style={[s.rowTitle, { marginTop: 1.5 }]}>{roleLabel(p.role)}</Text>
                <Text style={s.rowSub}>
                  {[positionScope(p), p.partyName ?? p.party].filter(Boolean).join(" · ")}{p.endReason ? ` · ${p.endReason}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* elections table */}
        {elections.length > 0 && (
          <View style={s.section}>
            <SecTitle>Elections Contested</SecTitle>
            <View style={[s.row, { flexDirection: "row", paddingVertical: 3 }]}>
              <Text style={[s.th, s.colYear]}>Year</Text>
              <Text style={[s.th, s.colOffice]}>Office</Text>
              <Text style={[s.th, s.colParty]}>Party</Text>
              <Text style={[s.th, s.colVotes]}>Votes</Text>
              <Text style={[s.th, s.colResult]}>Result</Text>
            </View>
            <Rows
              items={elections}
              render={(e: ElectionRecord, last) => {
                const won = e.result?.toLowerCase() === "won";
                return (
                  <View key={e.id} style={[s.row, { flexDirection: "row" }, ...(last ? [s.rowLast] : [])]} wrap={false}>
                    <Text style={[s.td, s.colYear]}>{e.year}</Text>
                    <Text style={[s.td, s.colOffice]}>
                      {(e.electionType ?? "").replace(/_/g, " ")}{e.isPrimary ? " (primary)" : ""}
                      {e.state || e.constituency || e.lga ? `, ${e.state || e.constituency || e.lga}` : ""}
                    </Text>
                    <Text style={[s.tdMuted, s.colParty]}>{e.party ?? "—"}</Text>
                    <Text style={[s.tdMuted, s.colVotes]}>
                      {e.votes != null ? e.votes.toLocaleString() : "—"}{e.votePercentage != null ? ` (${e.votePercentage}%)` : ""}
                    </Text>
                    <Text style={[s.td, s.colResult, { color: won ? EMERALD : MUTED, fontWeight: 600 }]}>
                      {(e.result ?? "—").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* education */}
        {education.length > 0 && (
          <View style={s.section}>
            <SecTitle>Education</SecTitle>
            <Rows
              items={education}
              render={(e, last) => (
                <View key={e.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={s.rowTitle}>{[e.qualification, e.field].filter(Boolean).join(" ") || e.institution}</Text>
                    <Text style={s.rowDate}>{yearRange(e.startYear, e.endYear)}</Text>
                  </View>
                  {(e.qualification || e.field) && (
                    <Text style={s.rowSub}>
                      {e.institution}
                      {e.location && !e.institution.toLowerCase().includes(e.location.toLowerCase()) ? ` · ${e.location}` : ""}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        )}

        {/* career before politics */}
        {careers.length > 0 && (
          <View style={s.section}>
            <SecTitle>Career Before Politics</SecTitle>
            <Rows
              items={careers}
              render={(c, last) => (
                <View key={c.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={s.rowTitle}>{c.role ?? c.organization}</Text>
                    <Text style={s.rowDate}>{yearRange(c.startYear, c.endYear)}</Text>
                  </View>
                  <Text style={s.rowSub}>{[c.role ? c.organization : null, c.industry].filter(Boolean).join(" · ")}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* party affiliations */}
        {parties.length > 0 && (
          <View style={s.section}>
            <SecTitle>Party Affiliations</SecTitle>
            <Rows
              items={parties}
              render={(p, last) => (
                <View key={p.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={s.rowTitle}>{p.partyName ? `${p.partyName} (${p.party})` : p.party}</Text>
                    <Text style={[s.rowDate, ...(!p.endDate ? [{ color: EMERALD }] : [])]}>
                      {!p.endDate ? `${yearOf(p.startDate) ?? "Current"} – Present` : [yearOf(p.startDate), yearOf(p.endDate)].filter(Boolean).join(" – ")}
                    </Text>
                  </View>
                  {p.reason && <Text style={s.rowSub}>{p.reason}</Text>}
                </View>
              )}
            />
          </View>
        )}

        {/* committees */}
        {committees.length > 0 && (
          <View style={s.section}>
            <SecTitle>Committees</SecTitle>
            <Rows
              items={committees}
              render={(c, last) => (
                <View key={c.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={s.rowTitle}>{c.committeeName}</Text>
                    <Text style={s.rowDate}>{c.role}</Text>
                  </View>
                  {c.chamber && <Text style={s.rowSub}>{c.chamber.replace(/_/g, " ")}</Text>}
                </View>
              )}
            />
          </View>
        )}

        {/* sponsored bills */}
        {bills.length > 0 && (
          <View style={s.section}>
            <SecTitle>Sponsored Bills</SecTitle>
            <Rows
              items={bills}
              render={(b, last) => (
                <View key={b.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={s.rowTitle}>{b.title}</Text>
                    <Text style={s.rowDate}>{yearOf(b.introducedDate) ?? b.status ?? ""}</Text>
                  </View>
                  <Text style={s.rowSub}>{[b.role, b.billNumber, b.status].filter(Boolean).join(" · ")}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* asset declarations */}
        {assets.length > 0 && (
          <View style={s.section}>
            <SecTitle>Asset Declarations</SecTitle>
            <Rows
              items={assets}
              render={(a, last) => (
                <View key={a.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={[s.rowTitle, { fontFamily: "IBM Plex Mono", color: AMBER }]}>{formatNaira(a.amount) ?? "Value not public"}</Text>
                    <Text style={s.rowDate}>{[a.year, a.declaredTo].filter(Boolean).join(" · ")}</Text>
                  </View>
                  {a.summary && <Text style={s.rowSub}>{a.summary}</Text>}
                </View>
              )}
            />
          </View>
        )}

        {/* awards */}
        {awards.length > 0 && (
          <View style={s.section}>
            <SecTitle>Awards &amp; Honours</SecTitle>
            <Rows
              items={awards}
              render={(a, last) => (
                <View key={a.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={s.rowTitle}>{a.title}</Text>
                    <Text style={s.rowDate}>{a.year ?? ""}</Text>
                  </View>
                  {a.awardedBy && <Text style={s.rowSub}>{a.awardedBy}</Text>}
                </View>
              )}
            />
          </View>
        )}

        {/* publications */}
        {pubs.length > 0 && (
          <View style={s.section}>
            <SecTitle>Publications</SecTitle>
            <Rows
              items={pubs}
              render={(p, last) => (
                <View key={p.id} style={[s.row, ...(last ? [s.rowLast] : [])]} wrap={false}>
                  <View style={s.rowHead}>
                    <Text style={[s.rowTitle, { fontFamily: "Instrument Serif", fontStyle: "italic", fontWeight: 400 }]}>&ldquo;{p.title}&rdquo;</Text>
                    <Text style={s.rowDate}>{p.year ?? ""}</Text>
                  </View>
                  <Text style={s.rowSub}>{[p.type, p.publisher].filter(Boolean).join(" · ")}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* legal & integrity */}
        {legalCount > 0 && (
          <View style={s.section}>
            <View style={s.secTitleRow}>
              <Text style={[s.secTitle, { color: RED }]}>Legal &amp; Integrity</Text>
              <View style={[s.secRule, { backgroundColor: "#f3d1d1" }]} />
            </View>
            {legal.map((l) => (
              <View key={l.id} style={s.legalItem} wrap={false}>
                <Text style={s.legalType}>{(l.caseType ?? "").replace(/_/g, " ")} · {(l.status ?? "").replace(/_/g, " ")}</Text>
                <Text style={s.legalTitle}>{l.title}</Text>
                <Text style={s.legalMeta}>
                  {[l.forum, l.outcome, l.caseNumber, [yearOf(l.filedDate), yearOf(l.resolvedDate)].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ))}
            {corruption.map((c) => (
              <View key={c.id} style={s.legalItem} wrap={false}>
                <Text style={s.legalType}>{(c.case.caseType ?? "").replace(/_/g, " ")} · {(c.roleInCase ?? "").replace(/_/g, " ")} · {(c.case.status ?? "").replace(/_/g, " ")}</Text>
                <Text style={s.legalTitle}>{c.case.title}</Text>
                <Text style={s.legalMeta}>
                  {c.case.forum ?? ""}
                  {c.case.forum && c.case.amountInvolved != null ? " · " : ""}
                  {c.case.amountInvolved != null ? (
                    // ₦ only exists in IBM Plex Mono — currency is mono per DESIGN.md.
                    <Text style={{ fontFamily: "IBM Plex Mono", color: RED }}>Amount involved: {formatNaira(c.case.amountInvolved)}</Text>
                  ) : null}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* footer (every page) */}
        <View style={s.footer} fixed>
          <Text style={s.footText}>
            Generated {generatedOn} from <Text style={s.footAccent}>{profileUrl}</Text> · public government records · Because na your money.
          </Text>
          <Text
            style={s.footPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/* ---------- browser entry point ---------- */

async function fetchPhotoDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const abs = /^https?:\/\//.test(imageUrl) ? imageUrl : `${window.location.origin}${imageUrl}`;
    const res = await fetch(abs);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Generate the branded CV PDF and trigger a download. */
export async function downloadOfficialCv(official: Official): Promise<void> {
  registerCvFonts(window.location.origin);
  const photoSrc = official.imageUrl ? await fetchPhotoDataUrl(official.imageUrl) : null;
  const generatedOn = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const blob = await pdf(
    <OfficialCvDocument official={official} photoSrc={photoSrc} generatedOn={generatedOn} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${official.slug ?? official.name.toLowerCase().replace(/\s+/g, "-")}-cv-ournigeria.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
