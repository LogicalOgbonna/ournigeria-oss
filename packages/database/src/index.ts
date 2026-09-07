export { DatabaseModule } from './database.module';
export {
  PrismaService,
  PRISMA_POOL_OPTIONS,
  type PrismaPoolOptions,
} from './prisma.service';
export { PrismaClient, Prisma } from '@prisma/client';
export type { MessageRole } from '@prisma/client';
export { slugifyName, UUID_RE } from './slug';
export {
  COMPLETENESS_FLAT_FIELDS,
  COMPLETENESS_BASE_CATEGORIES,
  COMPLETENESS_ELECTED_CATEGORIES,
  COMPLETENESS_FLAT_COLUMNS,
  COMPLETENESS_SQL,
  completenessSql,
  computeOfficialCompleteness,
  electedApplies,
} from './completeness';
export type {
  CompletenessFlatField,
  CompletenessCategory,
  CompletenessInput,
} from './completeness';
export { ensureTicketElections, MATE_ELECTION_TYPE } from './campaigns/election-anchor';
export type { TicketAnchorInput, AnchorContext, AnchorResult } from './campaigns/election-anchor';
// NOTE: FAAC seeding (./faac) is intentionally NOT re-exported from this barrel.
// seed-faac.ts loads `xlsx` (sheetjs) at import time, and the API runtime image
// deliberately prunes node_modules/xlsx. Re-exporting it here pulled xlsx into the
// API's boot graph (the API imports this barrel for PrismaService), crashing the
// API on boot with "Cannot find module 'xlsx'". Consumers that need the seeder
// (the ingest app, whose image keeps xlsx) import it from "@ournigeria/database/dist/faac".
