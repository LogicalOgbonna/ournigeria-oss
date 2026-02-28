import { Langfuse } from "langfuse";
import { LangfuseExporter } from "@mastra/langfuse";
import { Observability } from "@mastra/observability";

let langfuseInstance: Langfuse | null = null;

function isConfigured(): boolean {
  const configured = !!(
    process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY
  );
  return configured;
}

/**
 * Singleton Langfuse SDK instance for scores, prompts, etc.
 * Returns null when env vars are missing (graceful degradation).
 */
export function getLangfuse(): Langfuse | null {
  if (!isConfigured()) return null;
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    });
  }
  return langfuseInstance;
}

/**
 * Create Mastra observability config with LangfuseExporter.
 * Returns undefined when env vars are missing so Mastra runs without tracing.
 */
export function createObservability(): Observability | undefined {
  if (!isConfigured()) {
    console.log("[Langfuse] Not configured — observability disabled");
    return undefined;
  }

  console.log("[Langfuse] Observability enabled — creating LangfuseExporter");
  return new Observability({
    configs: {
      langfuse: {
        serviceName: "ournigeria-api",
        exporters: [
          new LangfuseExporter({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl:
              process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
            realtime: true,
          }),
        ],
      },
    },
  });
}

/**
 * Build experimental_telemetry object for standalone AI SDK calls
 * (generateText, embed) that aren't auto-traced by Mastra.
 */
export function tracingMetadata(opts: {
  functionId: string;
  sessionId?: string;
  userId?: string;
}):
  | {
      experimental_telemetry: {
        isEnabled: true;
        functionId: string;
        metadata: Record<string, string>;
      };
    }
  | {} {
  if (!isConfigured()) return {};
  const metadata: Record<string, string> = {};
  if (opts.sessionId) metadata["langfuse.session.id"] = opts.sessionId;
  if (opts.userId) metadata["langfuse.user.id"] = opts.userId;
  return {
    experimental_telemetry: {
      isEnabled: true as const,
      functionId: opts.functionId,
      metadata,
    },
  };
}

/**
 * Fetch a prompt from Langfuse by name, falling back to the hardcoded string.
 * The Langfuse SDK caches prompts internally.
 */
export async function getPrompt(
  name: string,
  fallback: string,
): Promise<string> {
  const lf = getLangfuse();
  if (!lf) return fallback;
  try {
    const prompt = await lf.getPrompt(name);
    return prompt.prompt as string;
  } catch {
    return fallback;
  }
}
