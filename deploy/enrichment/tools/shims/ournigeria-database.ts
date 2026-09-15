/**
 * esbuild alias target for `@ournigeria/database` in the bundled enrichment
 * CLIs.
 *
 * The agent container never installs the workspace package (npm can't resolve
 * it outside the monorepo), so a runtime `require("@ournigeria/database")`
 * crashes on boot. The bundled graph only uses `slugifyName` — re-export it
 * from its dependency-free source module so esbuild inlines the pure function
 * instead of leaving a bare require.
 *
 * If a future import needs more from the package, esbuild fails the build with
 * a missing-export error — extend this re-export list deliberately (and keep
 * it to pure, dependency-free modules; never the package barrel, which drags
 * in the Prisma client).
 */
export { slugifyName } from "../../../../packages/database/src/slug";
// election-anchor is runtime-dependency-free: its only imports are a type-only
// `@prisma/client` import (erased at build) and the mate-type constant map.
export {
  ensureTicketElections,
  MATE_ELECTION_TYPE,
} from "../../../../packages/database/src/campaigns/election-anchor";
