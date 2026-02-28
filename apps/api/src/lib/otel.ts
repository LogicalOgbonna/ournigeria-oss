import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseExporter } from "langfuse-vercel";

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry with Langfuse exporter.
 * This captures all AI SDK `experimental_telemetry` spans
 * (generateText, embed, etc.) and sends them to Langfuse
 * with full token usage and cost data.
 *
 * Must be called before any AI SDK calls are made.
 */
export function initOtel() {
  if (sdk) return;

  const hasKeys =
    process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY;
  if (!hasKeys) {
    console.log("[OTel] Langfuse keys not set — skipping OTel registration");
    return;
  }

  sdk = new NodeSDK({
    traceExporter: new LangfuseExporter({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl:
        process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    }),
  });

  sdk.start();
  console.log("[OTel] Langfuse trace exporter registered");
}
