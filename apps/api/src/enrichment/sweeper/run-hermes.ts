import { execFile } from "child_process";
import type { StructuredGap } from "../agent/find-structured-gaps";
import { CATEGORY_BY_KEY } from "../agent/categories";
import type { HermesRun } from "./sweeper";

const HERMES_BIN = process.env.HERMES_BIN || "hermes";
const HERMES_SKILL = process.env.HERMES_STRUCTURED_SKILL || "enrichment-structured";
const HERMES_TIMEOUT_MS = Number(process.env.HERMES_TIMEOUT_MS ?? 8 * 60 * 1000);
/**
 * Optional command prefix so the sweeper can drive Hermes wherever it lives:
 *  - "" (default): the `hermes` binary is on PATH (sweeper runs inside the agent).
 *  - "docker exec enrichment_agent": sweeper runs on the host / a sidecar and
 *    drives the running agent container (matches the deploy README pattern).
 */
const EXEC_PREFIX = (process.env.HERMES_EXEC_PREFIX || "").trim();

/** The single-gap task prompt handed to the Hermes brain. */
export function gapPrompt(gap: StructuredGap): string {
  const cat = CATEGORY_BY_KEY[gap.category];
  const label = cat?.label ?? gap.category;
  return [
    `Enrich exactly ONE category for ONE Nigerian official, then stop.`,
    `Official: ${gap.name} (id ${gap.officialId}${gap.slug ? `, slug ${gap.slug}` : ""}).`,
    `Category: ${label} [key: ${gap.category}, profile domain: ${gap.domain}].`,
    `Follow the ${HERMES_SKILL} skill: research with the browser, corroborate against the`,
    `'${gap.domain}' profile's source bar, and ONLY if the bar is met call`,
    `submit-structured-create for this official + category. If you cannot corroborate,`,
    `do nothing and report "nothing found". Never touch any other official or category,`,
    `never fabricate, always cite sources.`,
  ].join(" ");
}

/**
 * Invoke Hermes for one gap. Resolves { ok } — true on clean exit, false on
 * non-zero exit or timeout. The sweeper classifies the real outcome by querying
 * change_proposals, so we don't parse Hermes' stdout here.
 */
export function runHermes(gap: StructuredGap): Promise<HermesRun> {
  const hermesArgs = ["-z", gapPrompt(gap), "--skills", HERMES_SKILL, "-t", "browser,terminal,file"];
  const prefix = EXEC_PREFIX ? EXEC_PREFIX.split(/\s+/) : [];
  const argv = [...prefix, HERMES_BIN, ...hermesArgs];
  const [cmd, ...args] = argv;
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: HERMES_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 }, (err) =>
      resolve({ ok: !err }),
    );
  });
}
