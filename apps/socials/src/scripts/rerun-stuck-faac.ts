#!/usr/bin/env npx tsx
/**
 * Re-run the FAAC-domain tweets that previously got stuck (draft_status =
 * 'skipped'/'error' because the FAAC tool returned no data) through the real
 * drafter agent, now that the FAAC vector index is populated.
 *
 * MUST run with embedding env matching the index that was built
 * (faac_vectors_qwen → qwen3-embedding:4b), e.g.:
 *
 *   infisical run --env dev -- env \
 *     DATABASE_URL=postgresql://spending:spending@127.0.0.1:5432/spending \
 *     VECTOR_INDEX_FAAC=faac_vectors_qwen \
 *     EMBEDDING_PROVIDER=openai EMBEDDING_BASE_URL=http://localhost:11434/v1 \
 *     EMBEDDING_API_KEY=ollama EMBEDDING_MODEL=qwen3-embedding:4b EMBEDDING_DIMENSION=1024 \
 *     RERANK_ENABLED=false \
 *     npx tsx apps/socials/src/scripts/rerun-stuck-faac.ts [--reset]
 *
 * Infisical supplies the DeepSeek LLM creds (DEEPSEEK_*, SOCIALS_DRAFTER_*).
 * Report-only by default; pass --reset to clear draft_status so the live
 * drafter re-queues them.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { ConfigService } from "@nestjs/config";
import { AgentService } from "../intelligence/agent.service.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import type { SocialsEnvConfig } from "../config/env.validation.js";

type ValidDomain = "budget" | "corruption" | "faac" | "govspend" | "general";

const NUMERIC = new Set([
  "SOCIALS_DRAFTER_TEMPERATURE",
  "SOCIALS_DRAFTER_INPUT_USD_PER_M",
  "SOCIALS_DRAFTER_OUTPUT_USD_PER_M",
]);

// Minimal ConfigService shim over process.env with numeric coercion.
const config = {
  get(key: string) {
    const v = process.env[key];
    if (v === undefined) return undefined;
    return NUMERIC.has(key) ? Number(v) : v;
  },
} as unknown as ConfigService<SocialsEnvConfig>;

const reset = process.argv.includes("--reset");
const persist = process.argv.includes("--persist");
const limit = process.argv.includes("--limit")
  ? parseInt(process.argv[process.argv.indexOf("--limit") + 1], 10)
  : null;
const onlyId = process.argv.includes("--tweet")
  ? process.argv[process.argv.indexOf("--tweet") + 1]
  : null;

async function toolExecutor(name: string, args: Record<string, unknown>) {
  const normalized = name.replaceAll("_", "-");
  try {
    const { executeToolCall } = await import("@ournigeria/tools");
    return await executeToolCall(normalized, args);
  } catch (err) {
    return { results: [], totalResults: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const agent = new AgentService(config);

  try {
    const stuck = await prisma.socialsDiscoveredTweet.findMany({
      where: {
        draftStatus: { in: ["skipped", "error"] },
        classifications: { some: { passedThreshold: true } },
      },
      include: {
        classifications: {
          where: { passedThreshold: true },
          orderBy: { score: "desc" },
          take: 1,
          include: { topic: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let faac = stuck.filter((t) => t.classifications[0]?.topic.domain === "faac");
    if (onlyId) faac = faac.filter((t) => t.id === onlyId);
    if (limit && limit > 0) faac = faac.slice(0, limit);
    console.log(`Found ${faac.length} stuck FAAC tweets (of ${stuck.length} total stuck).\n`);

    let drafted = 0;
    let skipped = 0;
    for (const t of faac) {
      const c = t.classifications[0];
      const topic = c.topic;
      console.log(`── tweet ${t.id} | topic="${topic.name}" | prev status=${t.draftStatus}`);
      console.log(`   "${t.text.slice(0, 140).replace(/\n/g, " ")}"`);

      const result = await agent.generate(
        {
          discoveredTweet: {
            id: t.id,
            text: t.text,
            authorScreenName: t.authorScreenName,
            authorName: t.authorName,
            authorBio: t.authorBio,
            authorFollowers: t.authorFollowers,
            replyCount: t.replyCount,
            retweetCount: t.retweetCount,
            likeCount: t.likeCount,
            quoteCount: t.quoteCount,
            isReply: t.isReply,
            isQuote: t.isQuote,
            tweetCreatedAt: t.tweetCreatedAt,
          },
          topic: { name: topic.name, domain: topic.domain as ValidDomain, description: topic.description },
          classification: { score: c.score, intent: c.intent, reason: c.reason },
        },
        toolExecutor,
      );

      if (!result) {
        console.log(`   → agent returned null (LLM error)\n`);
        continue;
      }
      if (result.action === "skip") {
        skipped++;
        console.log(`   → SKIP: ${result.reasoning}\n`);
      } else {
        drafted++;
        console.log(`   → ${result.action.toUpperCase()} (confidence ${result.confidence}, dataQuery="${result.dataQuery}")`);
        console.log(`     DRAFT: ${result.text}\n`);

        if (persist) {
          const safety = new SafetyFilter().check(result.text, result.toolResults);
          const snapshot = {
            id: t.id,
            text: t.text,
            authorScreenName: t.authorScreenName,
            authorName: t.authorName,
            authorBio: t.authorBio,
            authorFollowers: t.authorFollowers,
            authorProfileImageUrl: t.authorProfileImageUrl,
            replyCount: t.replyCount,
            retweetCount: t.retweetCount,
            likeCount: t.likeCount,
            quoteCount: t.quoteCount,
            isReply: t.isReply,
            isQuote: t.isQuote,
            tweetCreatedAt: t.tweetCreatedAt.toISOString(),
          };
          const post = await prisma.socialPost.create({
            data: {
              platform: "twitter",
              postType: result.action,
              content: result.text,
              inReplyToId: result.action === "reply" ? t.id : null,
              inReplyToText: t.text.slice(0, 500),
              inReplyToUser: t.authorScreenName,
              quotedTweetId: result.action === "quote" ? t.id : null,
              originalTweetSnapshot: snapshot as object,
              safetyWarnings: safety.warnings as object,
              agentConfidence: result.confidence,
              agentReasoning: result.reasoning,
              classifierScore: c.score,
              classifierIntent: c.intent,
              discoveredTweetId: t.id,
              confidence: result.confidence,
              reviewStatus:
                safety.warnings.length === 0 && result.confidence >= 0.8
                  ? "recommended"
                  : "pending",
              dataDomain: topic.domain,
              dataQuery: result.dataQuery,
              triggerTopic: topic.name,
              status: "drafted",
            },
          });
          await prisma.socialsDiscoveredTweet.update({
            where: { id: t.id },
            data: { draftStatus: "drafted" },
          });
          console.log(
            `     ✓ persisted draft id=${post.id} reviewStatus=${post.reviewStatus} safetyWarnings=${safety.warnings.length} — review in dashboard reply queue\n`,
          );
        }
      }

      if (reset) {
        await prisma.socialsDiscoveredTweet.update({
          where: { id: t.id },
          data: { draftStatus: null, draftAttempts: 0, draftError: null },
        });
      }
    }

    console.log(`\nSummary: ${drafted} drafted, ${skipped} skipped, ${faac.length - drafted - skipped} errored.`);
    if (reset) console.log("draft_status reset to NULL for all — live drafter will re-queue.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
