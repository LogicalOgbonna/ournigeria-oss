/* eslint-disable no-console */
/**
 * Seed `socials_bot_session` rows for local dev / bootstrap.
 *
 * Reads from a JSON file (default: `apps/socials/.local/bot-sessions.json`,
 * which is gitignored). Override with BOT_SESSIONS_FILE env var.
 *
 * In production these rows are written by the Chrome extension hitting
 * `POST /v1/sessions` — this script exists so a developer can drop in
 * captured cookies without running the extension.
 *
 * Idempotent on `[userName, path]`. On update: refreshes cookie / tokens,
 * resets `status=idle`, `consecutiveErrors=0`, `cooldownUntil=null` so a
 * previously-failed session comes back online when its credentials rotate.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface SessionInput {
  user_name: string;
  path: string;
  authorization: string;
  cookie: string;
  csrf_token: string;
  x_client_transaction_id: string;
  x_client_uuid: string;
  search_timeline_op_hash?: string | null;
  last_used_at?: string | null;
}

const REQUIRED_FIELDS: (keyof SessionInput)[] = [
  "user_name",
  "path",
  "authorization",
  "cookie",
  "csrf_token",
  "x_client_transaction_id",
];

function loadSessions(): SessionInput[] {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const path =
    process.env.BOT_SESSIONS_FILE ??
    resolve(scriptDir, "../../.local/bot-sessions.json");
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (err) {
    throw new Error(
      `Could not read bot sessions file at ${path}. ` +
        `Set BOT_SESSIONS_FILE or create the file. (${(err as Error).message})`,
    );
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path} must contain a JSON array of session objects`);
  }
  for (const [i, s] of parsed.entries()) {
    for (const f of REQUIRED_FIELDS) {
      if (typeof s[f] !== "string" || s[f].length === 0) {
        throw new Error(`Session at index ${i} is missing required field '${f}'`);
      }
    }
  }
  return parsed as SessionInput[];
}

async function main() {
  const sessions = loadSessions();
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  let inserted = 0;
  let updated = 0;
  try {
    for (const s of sessions) {
      const lastUsedAt = s.last_used_at ? new Date(s.last_used_at) : new Date();
      const existing = await prisma.socialsBotSession.findUnique({
        where: {
          userName_path: { userName: s.user_name, path: s.path },
        },
      });
      const data = {
        cookie: s.cookie,
        csrfToken: s.csrf_token,
        authorization: s.authorization,
        xClientTransactionId: s.x_client_transaction_id,
        xClientUuid: s.x_client_uuid ?? "",
        searchTimelineOpHash: s.search_timeline_op_hash ?? null,
        lastUsedAt,
      };
      if (existing) {
        await prisma.socialsBotSession.update({
          where: { id: existing.id },
          data: {
            ...data,
            // Bring a stale/failed session back online — the operator
            // dropped in fresh credentials.
            status: "idle",
            consecutiveErrors: 0,
            cooldownUntil: null,
            lastError: null,
          },
        });
        updated++;
        console.log(`  updated: ${s.user_name} (${s.path})`);
      } else {
        await prisma.socialsBotSession.create({
          data: {
            userName: s.user_name,
            path: s.path,
            ...data,
          },
        });
        inserted++;
        console.log(`  created: ${s.user_name} (${s.path})`);
      }
    }
    console.log(`\nDone. inserted=${inserted} updated=${updated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
