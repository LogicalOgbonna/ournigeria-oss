# State Independent Electoral Commissions (SIECs) — website research

Every Nigerian state has a **State Independent Electoral Commission (SIEC)** — the
body that runs Local Government (council) elections, constitutionally distinct from
the federal **INEC**. This is the research backing the `state_electoral_commission_url`
column on `state_profiles` (migration `20260708233840_add_state_electoral_commission_url`).

**Guiding rule:** a wrong/dead/hijacked link is worse than a missing one. Only states
with a **currently-live, genuine, verified** official page are stored in the DB. Every
other state is `null`. Many former SIEC domains have lapsed and are now hijacked into
Indonesian gambling/"togel/slot" spam — those are explicitly excluded.

Researched 2026-07-08 via web search + live fetch verification.

## Stored in DB (7 verified-live)

| State | Commission | URL | Note |
|-------|-----------|-----|------|
| Akwa Ibom | AKISIEC | https://www.iec.ak.gov.ng/ | Dedicated official site; content confirmed live. |
| Benue | BSIEC | https://bsiec.benuestate.gov.ng/ | Dedicated official site; content confirmed live. |
| Edo | EDSIEC | https://edsiec.edostate.gov.ng/ | Official `edostate.gov.ng` subdomain, live (TLS cert was expired at research time). |
| Ekiti | EKSIEC | https://www.ekitistate.gov.ng/executive-council/mdas/ekiti-state-independent-electoral-commission-siec | Official state-government MDA page (no standalone domain). |
| Lagos | LASIEC | https://lasiec.gov.ng/ | Clean dedicated `gov.ng` site; content confirmed live. |
| Oyo | OYSIEC | https://oyostate.gov.ng/oyo-state-independent-electoral-commission/ | Official state-government page; genuine content (host carries hidden SEO-spam injection — the government's problem, page itself is authentic). |
| Plateau | PLASIEC | https://plasiec.ng/ | Live SPA, identity-confident (HQ + notices match); plain `.ng`. |

## Not stored — no live/safe official site (30)

Genuine official domain exists but was **not resolving / unreachable** at research time
(candidates for a later backfill once live): **Delta** `dsiec.gov.ng`, **Nasarawa**
`nasiec.na.gov.ng`, **Ogun** `ogsiec.ogunstate.gov.ng`, **Kaduna** `kadsiec.kd.gov.ng`.

**Hijacked / squatted domain — do NOT use:** **Rivers** `rsiec.rv.gov.ng` (gambling
spam), **Osun** `ossiec.org` (redirects to gambling site).

**Stub only (empty page):** **Kebbi** — SIEC department page on `kebbistate.gov.ng`
has no real content.

**No dedicated website found** (commission is real and active, but communicates only via
the main state portal, news, or Facebook): Abia (ABSIEC), Adamawa (ADSIEC), Anambra
(ANSIEC), Bauchi (BASIEC), Bayelsa (BYSIEC), Borno (BOSIEC), Cross River (CROSIEC),
Ebonyi (EBSIEC), Enugu (ENSIEC), Gombe (GOSIEC), Imo (ISIEC), Jigawa (JISIEC), Kano
(KANSIEC), Katsina (KTSIEC), Kogi (KOSIEC), Kwara (KWASIEC), Niger (NSIEC), Ondo (ODIEC),
Sokoto (SOSIEC), Taraba (TSIEC), Yobe (YBSIEC), Zamfara (ZASIEC).

**FCT** — Area Council elections are run by the federal INEC, not a SIEC; `null` by design.

## To enable a state later

1. Verify the site is live and genuine (not hijacked).
2. Set `stateElectoralCommissionUrl` for that state in `data/state-profiles.json`
   (+ a `sources` entry).
3. Add an idempotent `UPDATE` in a new migration (or regenerate the seed via
   `scripts/generate-state-profiles-seed.ts`).
