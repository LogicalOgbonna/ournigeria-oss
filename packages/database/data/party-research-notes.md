# Party data research notes

_As of 2026-06-19. Covers party officers (chairman / secretary / leader), profile
verification, and primary-winner candidates for the 15 active parties
(`APC, PDP, LP, NNPP, APGA, ADC, SDP, YPP, AA, AAC, Accord, ADP, APP, PRP, ZLP`)._

Seeded by:

```bash
cd packages/database
infisical run --env dev -- npx tsx scripts/seed-party-officers.ts
infisical run --env dev -- npx tsx scripts/seed-party-candidates.ts
infisical run --env dev -- npx tsx scripts/seed-party-profiles.ts   # profile gap-fills
```

All three are idempotent — a second run inserts 0 rows and overwrites nothing.

## What was seeded

- **Officers:** 36 `party_officers` rows, all linked to a `nigerian_officials`
  record (`official_id` set). 15 chairmen + 15 secretaries + 6 party-leaders.
  (The 37th `party_officers` row — NDC's pre-existing backfilled chairman — is out
  of this task's 15-party scope and remains unlinked.)
- **Candidates:** 15 `official_elections` rows (`is_primary=true, result='won'`),
  each linked to its official: 7 presidential 2027 flagbearers + 8 governorship
  primary winners (2025 Anambra, 2026 off-cycle Ekiti/Osun).
- **Officials dedup:** sitting governors **Soludo, Adeleke, Oyebanji** were reused
  from existing `elected` rows (never duplicated); the 4 people who are both an
  officer and a 2027 flagbearer (**Adebayo, Sowore, Omoaje, Nwanyanwu**) share a
  single official record across both tables. No duplicate officials were created.

## Schema deviations from the task spec (DB CHECK constraints)

- `nigerian_officials.official_type` — there is **no `'party_officer'`** value
  allowed (`chk_official_type` permits elected/appointed/civil_servant/judicial/
  security/traditional/other or NULL). Officer-only people are created with
  `official_type = NULL`; matched governors/senators keep their `'elected'` type.
- `official_elections.source_type` — `'research'` is **not allowed**
  (`chk_official_elections_source_type` permits manual/agent/citizen/import). Used
  `'import'`. The source URL has no column on `official_elections`, so it is stored
  in `notes` (`Source: <url>`). `party_officers` has no such constraint, so officers
  use `source_type = 'research'` as specified.

## Leadership that recently changed (DB was stale — now corrected via officers)

- **AAC** — Omoyele Sowore **stepped down as National Chairman on 26 May 2026**
  after winning the 2027 presidential ticket; **Samuel Ajeigbe** (ex-Deputy
  National Chairman) is the new chairman. Sowore is recorded as `party_leader`.
- **LP** — Nenadi Usman is now the **substantive elected** chairman (28 Apr 2026
  convention), not merely caretaker. Peter Obi has left LP, so no `party_leader`.
- **APC** — Nentawe Yilwatda re-affirmed at the 28 Mar 2026 convention (current).
- **PRP / SDP** — new chairmen via 28 Mar / May 2026 conventions, INEC-recognised
  (Baba-Ahmed; Sadiq Gombe).

## Confidence flags / unresolved disputes

- **PDP (severe, unresolved):** two rival NWCs (Abdulrahman Mohammed/Wike vs
  Turaki/Makinde) plus a Board of Trustees (Wabara) claiming interim control after
  a 30 Apr 2026 Supreme Court ruling. Chairman = **medium**, secretary
  (Anyanwu, expelled/contested) = **low**, party_leader (Wabara, BoT) = **medium**.
- **AA (low):** chairmanship genuinely split — INEC's portal recognised **Omoaje**
  (Dec 2025) while a court affirmed Udeze. Chairman + secretary both **low**.
- **NNPP (low):** three-way chairmanship dispute (Bala Yunusa Mohammed installed
  Apr 2026 vs court-affirmed Agbo Major). Chairman = **low**. **Kwankwaso left
  NNPP** (→ ADC → NDC), so NNPP `party_leader` is **null** (no clear successor).
- **SDP / PRP:** chairmen resolved in the seeded person's favour but each has a
  petitioning faction. Secretaries **medium**.
- **YPP:** secretary (Vidiyeno Bamaiyi) **low** — Wikipedia-only. _Correction:_
  Senator Ireti Kingibe is **not** YPP (LP→ADC); not associated here.

## Could NOT source (left null)

- **Party leaders (null):** LP, NNPP, ADC, SDP has one (Adebayo) but AA, ADP,
  Accord, PRP, YPP, ZLP have **no distinct de-facto national leader / BoT figure**
  reliably sourced — left absent rather than invent.
- **Candidates (none seeded):** **NNPP** (publicly declared it will field no 2027
  presidential candidate, seeking an alliance), **ADP** and **APP** (no sourced
  primary winner — their Ekiti candidates are on INEC's list but the primary tally
  wasn't sourced and the election postdates today).
- **Officer portraits:** only APC officers (Yilwatda, Basiru, Tinubu, from
  apc.com.ng) and SDP's Adewole Adebayo (Wikimedia) have verified `image_url`s.
  All other officer photos left null (no verified direct URL found).
- **DOBs / social handles:** filled only where reliably sourced (full dates only).

## Name discrepancy — APP (requires a human decision)

INEC's acronym **APP** maps to **"Action Peoples Party"** (self-styled "Action
People's Party"), confirmed via inecnigeria.org + actionpeoplesparty.com. The DB
row's name **"All Progressives Party" is incorrect** and matches no INEC-registered
party. Per task §1 ("`name` is never touched"), the seed scripts did **not** change
it. Officers (Nnadi / Bossan / Ugochinyere) and profile fields were populated for
this confirmed party. Recommended correction:

```sql
UPDATE political_parties SET name = 'Action Peoples Party'
 WHERE acronym = 'APP' AND name = 'All Progressives Party';
```

## Other time-sensitive notes

- A Federal High Court ordered the deregistration of **ADC, AA, Accord, APP, ZLP**
  (~16 Jun 2026); the Court of Appeal **stayed** it on 17 Jun 2026 — all remain
  registered pending appeal. `inec_status` left as "Registered".
- Off-cycle **Ekiti governorship is 20 Jun 2026** and **Osun is 8 Aug 2026** — the
  seeded gubernatorial rows are confirmed **primary winners** (flagbearers), not
  general-election results.

## Governor defections — APC footprint fix (2026-06-19, added after review)

The party page showed APC with **21** governors; the live count is **31 of 36**
(apc.com.ng + BusinessDay/Guardian/Pulse consensus). The gap was 10 governors who
defected mid-term in 2025-2026 whose active `official_positions` row still carried
their old party. Fixed via `data/governor-defections.json` +
`scripts/seed-governor-defections.ts` (npm `seed:governor-defections`), which flips
`party_acronym` on the active governor seat (name- + from-party-guarded, idempotent).

Flipped to **APC** (10): Delta (Oborevwori), Akwa Ibom (Umo Eno), Enugu (Mbah),
Bayelsa (Diri), Rivers (Fubara), Kano (Yusuf, from NNPP), Taraba (Kefas), Plateau
(Mutfwang), Adamawa (Fintiri), Zamfara (Lawal). Also Osun (Adeleke) → **Accord**
(he left PDP for Accord, not APC).

Resulting 36-state breakdown: **APC 31, PDP 2** (Oyo/Makinde, Bauchi/Bala Mohammed),
**Accord 1** (Osun), **APGA 1** (Anambra), **LP 1** (Abia). NNPP now holds 0
governorships. The governor's 2023 election history stays in `official_elections`;
only current affiliation moved.

Left untouched: the **FCT "governor" = Nyesom Wike (PDP)** row — FCT has no
governorship (Wike is the FCT Minister, modeled as a governor here), and his party
status is ambiguous; out of scope for this fix.

## Run-1 correction (recorded for transparency)

The first officers run used a loose ">=2 shared tokens" name matcher that produced
3 false merges (NNPP "Bala Yunusa Mohammed" → Bauchi Gov "Bala Mohammed"; PRP
"Hakeem Baba-Ahmed" → "Ahmed Saidu Baba"; SDP "Sadiq Umar Abubakar Gombe" →
"Muhammad Abubakar Sadiq"). The matcher was tightened to **exact-or-subset only,
and a subset match into an existing officeholder is gated on a public-office
signal in the research** (`looksLikePublicOfficeHolder`). The wrongly-enriched bios
were reverted and the 3 officers relinked to their own new records. Final state has
zero false merges (only the legitimate "Charles Soludo" middle-name match remains).
