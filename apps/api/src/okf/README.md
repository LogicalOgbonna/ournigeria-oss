# OKF Knowledge Bundle (`apps/api/src/okf`)

Exports OurNigeria's evidence-backed knowledge as an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) bundle: a directory of cross-linked markdown files with YAML frontmatter, plus a self-contained graph visualizer (`viz.html`). Spec: `docs/superpowers/specs/2026-06-19-okf-knowledge-bundle-design.md`.

## What's in the bundle

Five node types (one markdown file per concept, `type` = directory):

| Type | Source | Notes |
|---|---|---|
| `officials/` | `NigerianOfficial` (with slug) | full profile: bio, career, elections, education, assets, family, legal — each fact footnoted with its source |
| `cases/` | `CorruptionCase` | parties (linked to officials), timeline, amounts |
| `parties/` | `PoliticalParty` | one per party; officials show under *Cited by* |
| `states/` | `NigerianState` | geographic hub; officials + cases backlink here |
| `lgas/` | `NigerianLga` | **emitted only when an official/case links to it** (not all 774) |

**Wards are not nodes** — `ward` is a frontmatter tag on the officials that have one.

**Edges** (markdown links): official→party/state/lga/official(family), case↔official, lga→state, case→state (via `CorruptionCase.stateCode`). Backlinks are computed by the visualizer.

**Provenance** is first-class: every cited fact renders `[publisher — "snippet"](url) · <tier> tier · [archived copy](<snapshot>) · retrieved <date>`. The archived-copy link appears only when a snapshot was captured **and** `OKF_SNAPSHOT_BASE_URL` (or `CDN_BASE_URL`) is set; `originalAccessible=false` renders "(original removed)".

## Architecture

- `render/*` — **pure** functions (frontmatter, citations, official/case/geo, index, viz). Fixture-unit-tested, no I/O.
- `okf-export.service.ts` — `OkfExportService.buildBundle(timestamp)` does all I/O: reuses `OfficialsService.getByIdOrSlug` + `EvidenceService`, queries Prisma for cases/parties/states/lgas, maps rows → plain node objects, runs renderers, returns a `Map<path, contents>`.
- `okf-bundle.ts` — `writeBundle` (to disk) + `tarBundle` (portable, sorted `-T` list).
- `okf-publish.service.ts` — `publishToS3` (staging-then-swap into `okf/latest/`) + `publishToGit` (clone mirror, replace, commit-if-changed, push).
- `okf-bootstrap.ts` — hand-wires the services for the CLIs (no `NestFactory`, so tsx/esbuild need no decorator metadata).
- `okf-export.cli.ts` / `okf-publish.cli.ts` — entrypoints.

## Running

```bash
# Build the bundle locally from the dev DB (writes ./okf-out + ./okf-out.tar.gz):
pnpm okf:export                     # = infisical run --env dev -- tsx … okf-export.cli.ts
pnpm okf:export -- .context/okf-out # custom output dir
open .context/okf-out/viz.html      # explore the graph

# Build AND publish (S3 swap + git mirror) — gated on OKF_PUBLISH_ENABLED=1:
OKF_PUBLISH_ENABLED=1 pnpm okf:publish
```

The export is deterministic (stable ordering; the only wall-clock value is the run `timestamp`). The tarball ships to S3 only — gzip embeds a timestamp, which would defeat the git mirror's no-op-diff detection, so the mirror holds only the markdown + `viz.html`.

## Config (all optional)

| Env | Purpose | Default |
|---|---|---|
| `OKF_WEB_BASE_URL` | canonical site base for `resource:` links | `https://app.ournigeria.ng` |
| `OKF_SNAPSHOT_BASE_URL` | public base for archived snapshots | falls back to `CDN_BASE_URL` |
| `OKF_GIT_REPO` | mirror repo, e.g. `github.com/ournigeria/ournigeria-knowledge` | (skips git if unset) |
| `OKF_GIT_TOKEN` | fine-grained PAT scoped to the mirror repo | (skips git if unset) |
| `OKF_PUBLISH_ENABLED` | must be `"1"` to publish | off |

Publishing also needs `S3_BUCKET` + `AWS_*` (already in API env) and a public-read path for `evidence-snapshots/*` if archived-copy links are to resolve.

## Web

`/okf` (`apps/web/src/app/okf/page.tsx`) embeds `viz.html` from `NEXT_PUBLIC_OKF_BASE_URL` (default `https://cdn.ournigeria.ng/okf/latest`) + download/GitHub links.

## Prerequisites before enabling prod publishing

1. Create the public `ournigeria/ournigeria-knowledge` repo + a fine-grained PAT scoped to it → `OKF_GIT_TOKEN`.
2. Make `evidence-snapshots/*` (or a CDN alias) publicly readable, set `OKF_SNAPSHOT_BASE_URL`.
3. Decide the scheduler. The CLIs run from the API image's compiled `dist` (all deps present) — e.g. a nightly host cron `docker exec <api> node dist/.../okf/okf-publish.cli.js`, or a dedicated compose service using the API image. (Not bundled into the Hermes enrichment tools image — it lacks the Nest/Prisma/aws-sdk deps.)
