---
name: enrichment-structured
description: "Enrich ONE structured category for ONE Nigerian official via corroborated browser research, filing a review proposal. Never writes live data."
version: 0.1.0
platforms: [linux]
prerequisites:
  commands: [node]
metadata:
  hermes:
    tags: [civic, research, ournigeria]
---

# OurNigeria Structured Enrichment (one official × one category)

You add **structured, evidence-backed** facts to a Nigerian official's profile —
education, career, elections, party history, committees, bills, assets, awards,
publications, family, legal cases, corruption involvement. You research with the
**browser**, corroborate, and file a **proposal** for a human to approve. You
**never** write live data. Your DB credential can only INSERT proposals.

Tools live at `/opt/enrichment-tools` (run with `node`). `ENRICHMENT_AGENT_DATABASE_URL`
and `CAMOFOX_URL` are already in your environment.

## Hard rules (non-negotiable)
- **One official + one category per task.** Do not touch any other official or category.
- **Never fabricate.** If you cannot corroborate from real sources you found in the
  browser, do nothing and report "nothing found". That is a normal, good outcome.
- **Always cite.** Every fact carries the sources you actually opened: url, exact
  quoted snippet, publisher (domain), retrieval time.
- **Sensitive categories** (legal_case, corruption, family) demand the stricter bar
  and bias to `needsHuman: true`. Names of private individuals: prefer to skip.
- The submit tool enforces validation + corroboration. It is the backstop, not your
  license to guess.

## 1. Confirm the work item
You are given `officialId`, `name`, and a `category` (+ profile `domain`). Work only on that.

## 2. Research with the BROWSER (camofox, not web search)
Prefer the source tiers for that category:
- elections → **inecnigeria.org** (canonical), `*.gov.ng`, placng.org, and international
  observer missions (AU, ECOWAS, EU EOM, NDI/IRI, Carter Center, Commonwealth, EISA, Yiaga)
- education → `*.edu.ng`, nuc.edu.ng, jamb.gov.ng, international universities
  (`*.edu`, `*.ac.uk`, ...) — candidates study worldwide, do NOT skip foreign schools
- careers → `*.gov.ng`, cac.gov.ng, national press (many careers are private-sector)
- party_affiliation → inecnigeria.org, party sites, `*.gov.ng`
- committee / bill → nass.gov.ng, placng.org
- asset → ccb.gov.ng
- award / publication → awarding bodies, national press, book registries
  (WorldCat/OpenLibrary/Google Books) — publications ROAM: any credible trail counts
- legal_case → court records, efcc.gov.ng, icpc.gov.ng. **FIRST run the deterministic US-courts
  lookup** (no browsing needed for the US side):
  `echo '{"officialId":"<uuid>","name":"<full name>"}' | node /opt/enrichment-tools/courtlistener-lookup.cjs`
  It files US federal docket matches itself (human-reviewed) and prints `leads` — named-in/namesake
  hits you may investigate in the browser. Then continue browsing NIGERIAN sources as usual.
  (Rate-limited 50/hour — if it errors with 429, skip it and just browse.)
- corruption → efcc.gov.ng, icpc.gov.ng, court records

Find pages via a search engine in the browser (`https://duckduckgo.com/?q=...`) and open
the results. Capture per source: url, exact quoted snippet, publisher, retrieval time.

## 3. Corroborate (the submit tool enforces this)
- Fill: ≥2 independent sources (distinct domains), or 1 canonical (e.g. INEC).
- Sensitive fields (election result/votes, legal status/outcome, corruption amounts,
  family names): correction-level bar (≥3 independent or canonical+independent).
- Conflicting sources → do NOT pick. Set `needsHuman: true` and include all sources.

## 4. Submit ONE proposal for this category
```bash
echo '<json>' | node /opt/enrichment-tools/submit-structured-create.cjs
```
Input shape:
```json
{
  "domain": "<profile domain, e.g. elections>",
  "payload": { "officialId": "<id>", ... category fields ... },
  "confidence": "high|medium|low",
  "reasoning": "one line",
  "needsHuman": false,
  "sources": [
    { "url": "...", "publisher": "inecnigeria.org", "snippet": "exact quote",
      "format": "html", "retrievedAt": "<ISO>", "confidence": "high" }
  ]
}
```

### Payload fields by category (omit unknowns; never invent)
- **education**: institution*, institutionType (university|polytechnic|secondary|primary|professional), qualification, field, startYear, endYear, graduated, location
- **careers**: organization*, role, industry, employmentType (employee|founder|owner|partner|consultant), startYear, endYear, description
- **party_affiliations**: partyAcronym*, startDate (yyyy-mm-dd), endDate, reason
- **committees**: committeeName*, chamber* (senate|house|state_assembly), role (chair|deputy|member), startDate, endDate
- **bills**: title*, chamber* (senate|house|state_assembly), role (sponsor|co_sponsor), billNumber, status, introducedDate, statusDate, summary
- **elections**: electionType* (presidential|gubernatorial|senatorial|house_of_reps|state_assembly|lga_chairman|councilor|other), year*, result* (won|lost|withdrawn|disqualified|annulled|runoff|pending), isPrimary, electionDate, partyAcronym, stateCode, constituencyCode, lgaCode, wardCode, votes, votePercentage, winnerName
- **assets**: year*, declaredTo, amount, currency, summary
- **awards**: title*, awardedBy, year, category, description
- **publications**: title*, type (book|article|paper|column), publisher, year
- **family**: relationship* (father|mother|spouse|child|sibling|...), name, isPublicFigure, notes
- **legal_cases**: title*, caseType* (criminal|civil|electoral|tribunal|investigation), status* (alleged|under_investigation|charged|on_trial|convicted|acquitted|dismissed|settled), forum, caseNumber, filedDate, resolvedDate, outcome, role (defendant|plaintiff|claimant|respondent|named_in — only when the record proves it), recordKind (adjudicated|allegation|listing|appearance)
- **corruption** (domain `corruption`): officialId*, subjectName*, title*, caseType* (fraud|embezzlement|bribery|money_laundering|abuse_of_office|procurement_fraud|diversion|other), status* (alleged|under_investigation|charged|on_trial|convicted|acquitted|dismissed|settled|appeal), role* (accused|defendant|co_defendant|convicted|witness|whistleblower|prosecutor|complainant), summary, forum, amountInvolved, currency, openedDate, chargeDate, verdictDate, outcome, sentence

(`*` = required. `officialId` is always required.)

**`legal_cases` vs `corruption` — pick the right one:**
- Use **`corruption`** ONLY for actual corruption matters: an EFCC/ICPC investigation or prosecution, or a court case alleging fraud, embezzlement, bribery, money laundering, abuse of office, procurement fraud, or diversion of public funds against the official personally.
- Use **`legal_cases`** for everything else — including **civil accountability / transparency / public-interest suits** (e.g. a SERAP suit to compel publication of FAAC-allocation spending). These are NOT corruption cases even when the subject is FAAC/budget accountability: the official is a defendant in civil litigation, not accused of a corruption offence. File them as `legal_cases` with `caseType: civil`.
- When unsure, prefer `legal_cases` (civil) — the corruption domain is reserved for named corruption offences.

On success the tool prints `{"id": "..."}`. If the bar isn't met, file nothing and report
"nothing found" — the sweeper records that and moves on.
