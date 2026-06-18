/**
 * Mock Official for the design experiment — mirrors the live API shape so the
 * experiment renders the exact same <MagazineProfile/> as the real route, just
 * with offline sample data (Babajide Sanwo-Olu).
 */
import type { Official, Evidence, ProvFields } from "@/lib/api";

let _id = 0;
const id = () => `mock-${++_id}`;

const SOURCES: Omit<Evidence, "id">[] = [
  { url: "https://inecnigeria.org/results", archiveUrl: null, locator: null, publisher: "INEC", snippet: "…declared winner of the Lagos State gubernatorial election having scored the highest number of votes…", format: "html", sourceTier: "canonical", confidence: "high", retrievedAt: "2026-01-12", hasSnapshot: true, originalAccessible: true },
  { url: "https://premiumtimesng.com/profile", archiveUrl: null, locator: null, publisher: "Premium Times", snippet: "…the governor, who studied surveying at the University of Lagos before a banking career…", format: "html", sourceTier: "web", confidence: "medium", retrievedAt: "2026-02-03", hasSnapshot: true, originalAccessible: true },
  { url: "https://lagosstate.gov.ng/about", archiveUrl: null, locator: null, publisher: "Lagos State Govt", snippet: "…served as Commissioner for Establishments, Training and Pensions between 2005 and 2007…", format: "html", sourceTier: "official", confidence: "high", retrievedAt: "2025-12-21", hasSnapshot: true, originalAccessible: true },
  { url: "https://guardian.ng/asset", archiveUrl: "https://s3/snap", locator: null, publisher: "The Guardian NG", snippet: "…filed his asset declaration with the Code of Conduct Bureau upon assumption of office…", format: "html", sourceTier: "web", confidence: "medium", retrievedAt: "2025-11-30", hasSnapshot: true, originalAccessible: false },
];

const ev = (n: number): Evidence[] => Array.from({ length: n }, (_, i) => ({ id: id(), ...SOURCES[i % SOURCES.length] }));

const prov = (
  confidence: ProvFields["confidence"],
  reviewStatus: ProvFields["reviewStatus"],
  n: number,
): ProvFields => ({ id: id(), confidence, sourceType: "agent", reviewStatus, lastVerifiedAt: "2026-03-01", evidence: ev(n) });

export const MOCK_OFFICIAL: Official = {
  id: "mock-official",
  slug: "babajide-sanwo-olu",
  name: "Babajide Sanwo-Olu",
  officialType: "elected",
  imageUrl: null,
  dateOfBirth: "1965-06-25",
  email: "governor@lagosstate.gov.ng",
  phoneNumber: "+234 700 000 0000",
  officeAddress: "Lagos House, Alausa, Ikeja",
  twitterHandle: "@jidesanwoolu",
  facebookUrl: "fb.com/BabajideSanwoOlu",
  gender: "male",
  education: null,
  biography:
    "Babajide Olusola Sanwo-Olu is a Nigerian politician and the 15th Governor of Lagos State. A surveyor by training and banker by profession, he held three commissioner portfolios and ran the state's property corporation before winning the governorship in 2019 and re-election in 2023.",
  completenessScore: 0.78,
  proposalCount: 0,
  proposals: [],
  positions: [
    { ...prov("high", "reviewed", 0), role: "governor", party: "APC", partyName: "All Progressives Congress", state: "Lagos State", stateCode: "lagos", lga: null, lgaCode: null, constituency: null, constituencyCode: null, ward: null, wardCode: null, startDate: "2019-05-29", endDate: null, endReason: null, status: "active", isCurrent: true, termName: "2nd term", termNumber: 2 } as never,
    { id: id(), role: "deputy_governor", party: "APC", partyName: "APC", state: "Lagos State", stateCode: "lagos", lga: null, lgaCode: null, constituency: null, constituencyCode: null, ward: null, wardCode: null, startDate: "2016-01-01", endDate: "2019-05-01", endReason: "Resigned to contest", status: "ended", isCurrent: false, termName: null, termNumber: null } as never,
    { id: id(), role: "commissioner", party: "ACN", partyName: "ACN", state: "Lagos State", stateCode: "lagos", lga: null, lgaCode: null, constituency: null, constituencyCode: null, ward: null, wardCode: null, startDate: "2007-01-01", endDate: "2009-01-01", endReason: "Cabinet reshuffle", status: "ended", isCurrent: false, termName: null, termNumber: null } as never,
  ],
  educationRecords: [
    { ...prov("high", "reviewed", 3), institution: "University of Lagos", institutionType: "university", qualification: "B.Sc Surveying & Geoinformatics", field: "Surveying", startYear: 1984, endYear: 1988, graduated: true, location: "Lagos" },
    { ...prov("high", "reviewed", 2), institution: "University of Lagos", institutionType: "university", qualification: "MBA", field: null, startYear: 1992, endYear: 1994, graduated: true, location: "Lagos" },
    { ...prov("low", "unreviewed", 1), institution: "St. Gregory's College", institutionType: "secondary", qualification: "WASC", field: null, startYear: 1977, endYear: 1983, graduated: true, location: "Obalende, Lagos" },
  ],
  careerRecords: [
    { ...prov("high", "reviewed", 2), organization: "First Inland Bank (now FCMB)", role: "Deputy General Manager", industry: "Banking", employmentType: "employee", startYear: 1997, endYear: 2003, description: null },
    { ...prov("medium", "unreviewed", 1), organization: "Lead Merchant Bank", role: "Treasurer", industry: "Banking", employmentType: "employee", startYear: 1994, endYear: 1997, description: null },
  ],
  partyHistory: [
    { ...prov("high", "reviewed", 2), party: "APC", partyName: "All Progressives Congress", startDate: "2014-01-01", endDate: null, reason: "ACN merged into APC" },
    { ...prov("high", "reviewed", 1), party: "ACN", partyName: "Action Congress of Nigeria", startDate: "2006-01-01", endDate: "2014-01-01", reason: "Followed AD leadership into ACN" },
  ],
  committees: [],
  sponsoredBills: [],
  elections: [
    { ...prov("high", "reviewed", 3), electionType: "gubernatorial", isPrimary: false, year: 2023, electionDate: "2023-03-18", party: "APC", partyName: "APC", state: "Lagos State", constituency: null, lga: null, ward: null, result: "won", votes: 762134, votePercentage: 45.6, winnerName: null, resultedInPositionId: null, notes: null },
    { ...prov("high", "reviewed", 3), electionType: "gubernatorial", isPrimary: false, year: 2019, electionDate: "2019-03-09", party: "APC", partyName: "APC", state: "Lagos State", constituency: null, lga: null, ward: null, result: "won", votes: 739445, votePercentage: 73.6, winnerName: null, resultedInPositionId: null, notes: null },
    { ...prov("high", "reviewed", 2), electionType: "gubernatorial", isPrimary: true, year: 2018, electionDate: "2018-10-02", party: "APC", partyName: "APC", state: "Lagos State", constituency: null, lga: null, ward: null, result: "won", votes: 970851, votePercentage: null, winnerName: null, resultedInPositionId: null, notes: null },
    { ...prov("low", "unreviewed", 1), electionType: "senatorial", isPrimary: true, year: 2003, electionDate: null, party: "AD", partyName: "AD", state: null, constituency: "Lagos West", lga: null, ward: null, result: "lost", votes: null, votePercentage: null, winnerName: "Musiliu Obanikoro", resultedInPositionId: null, notes: null },
  ],
  assetDeclarations: [
    { ...prov("medium", "reviewed", 2), year: 2019, declaredTo: "Code of Conduct Bureau", amount: 2400000000, currency: "NGN", summary: "Real estate in Lagos & Abuja, equities portfolio, two private vehicles." },
    { ...prov("low", "unreviewed", 1), year: 2023, declaredTo: "Code of Conduct Bureau", amount: null, currency: "NGN", summary: "Filed; not yet publicly released." },
  ],
  awards: [
    { ...prov("high", "reviewed", 2), title: "Commander of the Order of the Niger (CON)", awardedBy: "Federal Republic of Nigeria", year: 2022, category: "National honour", description: null },
    { ...prov("medium", "unreviewed", 1), title: "Governor of the Year", awardedBy: "Leadership Newspaper", year: 2021, category: "Media award", description: null },
  ],
  publications: [
    { ...prov("medium", "unreviewed", 1), title: "Lagos and the next pandemic", type: "article", publisher: "Financial Times", year: 2021 },
  ],
  familyMembers: [
    { ...prov("high", "reviewed", 2), relationship: "spouse", name: "Ibijoke Sanwo-Olu", isPublicFigure: true, notes: null, relatedOfficial: null },
    { ...prov("medium", "reviewed", 1), relationship: "child", name: "3 children — names withheld", isPublicFigure: false, notes: null, relatedOfficial: null },
  ],
  legalCases: [
    { ...prov("high", "reviewed", 3), title: "Lekki Toll Gate Inquiry (EndSARS Panel)", caseType: "tribunal", status: "dismissed", forum: "Lagos Judicial Panel of Inquiry", caseNumber: "LJP/2020/014", filedDate: "2020-10-01", resolvedDate: "2021-11-01", outcome: "Panel report submitted; state white paper issued.", relatedCorruptionCase: null },
  ],
  corruptionCases: [
    { ...prov("medium", "disputed", 2), roleInCase: "complainant", outcome: "Petition dismissed for lack of merit.", case: { slug: "covid19-palliatives-procurement", title: "COVID-19 palliatives procurement petition", status: "dismissed", caseType: "procurement_fraud", forum: "EFCC", amountInvolved: 1200000000, currency: "NGN" } },
  ],
};
