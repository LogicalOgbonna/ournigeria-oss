import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, embed } from "ai";
import * as crypto from "crypto";
import {
  loadSettings,
  setSetting,
  notifySettingsChanged,
} from "../config/settings-store";

/* ------------------------------------------------------------------ */
/*  Definitions                                                        */
/* ------------------------------------------------------------------ */

const SETTING_DEFINITIONS = [
  {
    key: "llm.provider",
    envKey: "LLM_PROVIDER",
    category: "llm",
    valueType: "string",
    description:
      "LLM provider (openai, openrouter, together, groq, deepseek, fireworks, custom)",
  },
  {
    key: "llm.model",
    envKey: "LLM_MODEL",
    category: "llm",
    valueType: "string",
    description: "Primary LLM model ID",
  },
  {
    key: "llm.model_small",
    envKey: "LLM_MODEL_SMALL",
    category: "llm",
    valueType: "string",
    description: "Small/fast LLM model ID",
  },
  {
    key: "llm.base_url",
    envKey: "LLM_BASE_URL",
    category: "llm",
    valueType: "string",
    description: "LLM API base URL",
  },
  {
    key: "llm.api_key",
    envKey: "LLM_API_KEY",
    category: "llm",
    valueType: "secret",
    description: "LLM API key",
  },
  {
    key: "embedding.provider",
    envKey: "EMBEDDING_PROVIDER",
    category: "embedding",
    valueType: "string",
    description: "Embedding provider name (e.g. voyage, openai)",
  },
  {
    key: "embedding.model",
    envKey: "EMBEDDING_MODEL",
    category: "embedding",
    valueType: "string",
    description: "Embedding model ID",
  },
  {
    key: "embedding.base_url",
    envKey: "EMBEDDING_BASE_URL",
    category: "embedding",
    valueType: "string",
    description: "Embedding API base URL",
  },
  {
    key: "embedding.api_key",
    envKey: "EMBEDDING_API_KEY",
    category: "embedding",
    valueType: "secret",
    description: "Embedding API key",
  },
  {
    key: "embedding.dimension",
    envKey: "EMBEDDING_DIMENSION",
    category: "embedding",
    valueType: "number",
    description: "Embedding vector dimension",
  },
  {
    key: "rag.top_k",
    envKey: "RAG_TOP_K",
    category: "rag",
    valueType: "number",
    description: "Number of results to retrieve",
  },
  {
    key: "rag.search_ef",
    envKey: "RAG_SEARCH_EF",
    category: "rag",
    valueType: "number",
    description: "HNSW search ef parameter",
  },
  {
    key: "rerank.enabled",
    envKey: "RERANK_ENABLED",
    category: "rerank",
    valueType: "boolean",
    description: "Enable/disable reranking",
  },
  {
    key: "rerank.api_key",
    envKey: "RERANK_API_KEY",
    category: "rerank",
    valueType: "secret",
    description: "Reranker API key",
  },
  {
    key: "rerank.model",
    envKey: "RERANK_MODEL",
    category: "rerank",
    valueType: "string",
    description: "Reranker model ID",
  },
  {
    key: "rerank.top_n",
    envKey: "RERANK_TOP_N",
    category: "rerank",
    valueType: "number",
    description: "Reranker top N results (0 = use top_k)",
  },
  {
    key: "search.hybrid_enabled",
    envKey: "HYBRID_SEARCH_ENABLED",
    category: "search",
    valueType: "boolean",
    description: "Enable hybrid BM25+vector search",
  },
  {
    key: "integrations.tavily_api_key",
    envKey: "TAVILY_API_KEY",
    category: "integrations",
    valueType: "secret",
    description: "Tavily web search API key",
  },
  {
    key: "observability.langfuse_public_key",
    envKey: "LANGFUSE_PUBLIC_KEY",
    category: "observability",
    valueType: "string",
    description: "Langfuse public key",
  },
  {
    key: "observability.langfuse_secret_key",
    envKey: "LANGFUSE_SECRET_KEY",
    category: "observability",
    valueType: "secret",
    description: "Langfuse secret key",
  },
  {
    key: "observability.langfuse_base_url",
    envKey: "LANGFUSE_BASE_URL",
    category: "observability",
    valueType: "string",
    description: "Langfuse base URL",
  },
];

const READ_ONLY_VARS = [
  {
    key: "DATABASE_URL",
    category: "infrastructure",
    description: "PostgreSQL connection string",
    secret: true,
  },
  {
    key: "VECTOR_INDEX_BUDGET",
    category: "infrastructure",
    description: "Budget vector table name",
    secret: false,
  },
  {
    key: "VECTOR_INDEX_CORRUPTION",
    category: "infrastructure",
    description: "Corruption vector table name",
    secret: false,
  },
  {
    key: "VECTOR_INDEX_GOVSPEND",
    category: "infrastructure",
    description: "GovSpend vector table name",
    secret: false,
  },
  {
    key: "VECTOR_INDEX_FAAC",
    category: "infrastructure",
    description: "FAAC vector table name",
    secret: false,
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    category: "infrastructure",
    description: "Telegram bot token",
    secret: true,
  },
  {
    key: "AWS_REGION",
    category: "infrastructure",
    description: "AWS region",
    secret: false,
  },
  {
    key: "S3_BUCKET",
    category: "infrastructure",
    description: "S3 bucket name",
    secret: false,
  },
  {
    key: "APP_URL",
    category: "infrastructure",
    description: "Public app URL",
    secret: false,
  },
  {
    key: "CORS_ORIGINS",
    category: "infrastructure",
    description: "Allowed CORS origins",
    secret: false,
  },
  {
    key: "ADMIN_SESSION_SECRET",
    category: "infrastructure",
    description: "Admin session signing secret",
    secret: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);

  constructor(private prisma: PrismaService) {}

  /* ---- Encryption helpers ---------------------------------------- */

  private deriveKey(): Buffer {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
    return crypto.createHash("sha256").update(secret).digest();
  }

  private encrypt(plaintext: string): string {
    const key = this.deriveKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  }

  private decrypt(ciphertext: string): string {
    const key = this.deriveKey();
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  /* ---- Masking --------------------------------------------------- */

  private mask(value: string): string {
    if (value.length <= 4)
      return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
    return "\u2022\u2022\u2022\u2022" + value.slice(-4);
  }

  /* ---- Decrypt + optionally mask a DB row ------------------------ */

  private presentSetting(row: {
    key: string;
    value: string;
    encrypted: boolean;
    description: string | null;
    category: string;
    valueType: string;
    updatedAt: Date;
    updatedBy: string | null;
  }) {
    let plainValue: string;
    try {
      plainValue = row.encrypted ? this.decrypt(row.value) : row.value;
    } catch {
      plainValue = row.value;
    }

    return {
      key: row.key,
      value: row.valueType === "secret" ? this.mask(plainValue) : plainValue,
      description: row.description,
      category: row.category,
      valueType: row.valueType,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }

  /* ---- Public methods -------------------------------------------- */

  async getAll(): Promise<
    Record<string, ReturnType<typeof this.presentSetting>[]>
  > {
    const rows = await this.prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });

    const rowMap = new Map(rows.map((r) => [r.key, r]));
    const grouped: Record<string, ReturnType<typeof this.presentSetting>[]> =
      {};

    // Include all defined settings, using DB values where available
    for (const def of SETTING_DEFINITIONS) {
      const row = rowMap.get(def.key);
      const presented = row
        ? this.presentSetting(row)
        : {
            key: def.key,
            value:
              def.valueType === "secret" ? "" : (process.env[def.envKey] ?? ""),
            description: def.description,
            category: def.category,
            valueType: def.valueType,
            updatedAt: new Date().toISOString(),
            updatedBy: null,
          };
      if (!grouped[def.category]) grouped[def.category] = [];
      grouped[def.category].push(
        presented as ReturnType<typeof this.presentSetting>,
      );
      rowMap.delete(def.key);
    }

    // Include any extra settings in the DB not in definitions
    for (const row of rows) {
      if (rowMap.has(row.key)) {
        const presented = this.presentSetting(row);
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push(presented);
      }
    }

    return grouped;
  }

  async getByKey(key: string) {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!row) return null;
    return this.presentSetting(row);
  }

  async upsert(key: string, value: string, updatedBy: string) {
    // Look up existing row or definition to determine valueType
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    const definition = SETTING_DEFINITIONS.find((d) => d.key === key);
    const valueType = existing?.valueType ?? definition?.valueType ?? "string";
    const category = existing?.category ?? definition?.category ?? "general";
    const description =
      existing?.description ?? definition?.description ?? null;

    const isSecret = valueType === "secret";
    const storedValue = isSecret ? this.encrypt(value) : value;

    const row = await this.prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: storedValue,
        encrypted: isSecret,
        updatedBy,
      },
      create: {
        key,
        value: storedValue,
        encrypted: isSecret,
        description,
        category,
        valueType,
        updatedBy,
      },
    });

    // Update in-memory store with the plain value
    setSetting(key, value);
    notifySettingsChanged();

    return this.presentSetting(row);
  }

  async bulkUpsert(
    settings: { key: string; value: string }[],
    updatedBy: string,
  ) {
    // Gather metadata for all keys
    const existingRows = await this.prisma.systemSetting.findMany({
      where: { key: { in: settings.map((s) => s.key) } },
    });
    const existingMap = new Map(existingRows.map((r) => [r.key, r]));

    const operations = settings.map((s) => {
      const existing = existingMap.get(s.key);
      const definition = SETTING_DEFINITIONS.find((d) => d.key === s.key);
      const valueType =
        existing?.valueType ?? definition?.valueType ?? "string";
      const category = existing?.category ?? definition?.category ?? "general";
      const description =
        existing?.description ?? definition?.description ?? null;

      const isSecret = valueType === "secret";
      const storedValue = isSecret ? this.encrypt(s.value) : s.value;

      return this.prisma.systemSetting.upsert({
        where: { key: s.key },
        update: {
          value: storedValue,
          encrypted: isSecret,
          updatedBy,
        },
        create: {
          key: s.key,
          value: storedValue,
          encrypted: isSecret,
          description,
          category,
          valueType,
          updatedBy,
        },
      });
    });

    await this.prisma.$transaction(operations);

    // Update in-memory store with plain values
    for (const s of settings) {
      setSetting(s.key, s.value);
    }
    notifySettingsChanged();
  }

  async seedDefaults() {
    const count = await this.prisma.systemSetting.count();

    if (count === 0) {
      this.logger.log("No settings found — seeding defaults from env vars");

      // Derive LLM_PROVIDER from base URL if not explicitly set
      if (!process.env.LLM_PROVIDER && process.env.LLM_BASE_URL) {
        const url = process.env.LLM_BASE_URL.toLowerCase();
        if (url.includes("openrouter")) process.env.LLM_PROVIDER = "openrouter";
        else if (url.includes("together"))
          process.env.LLM_PROVIDER = "together";
        else if (url.includes("groq.com")) process.env.LLM_PROVIDER = "groq";
        else if (url.includes("deepseek"))
          process.env.LLM_PROVIDER = "deepseek";
        else if (url.includes("fireworks"))
          process.env.LLM_PROVIDER = "fireworks";
        else if (url.includes("openai.com"))
          process.env.LLM_PROVIDER = "openai";
        else process.env.LLM_PROVIDER = "custom";
      }

      const creates = SETTING_DEFINITIONS.filter(
        (def) => process.env[def.envKey],
      ).map((def) => {
        const rawValue = process.env[def.envKey]!;
        const isSecret = def.valueType === "secret";
        const storedValue = isSecret ? this.encrypt(rawValue) : rawValue;

        return this.prisma.systemSetting.create({
          data: {
            key: def.key,
            value: storedValue,
            encrypted: isSecret,
            description: def.description,
            category: def.category,
            valueType: def.valueType,
          },
        });
      });

      if (creates.length > 0) {
        await this.prisma.$transaction(creates);
        this.logger.log(`Seeded ${creates.length} settings from env`);
      }
    }

    // Ensure llm.provider exists even if it wasn't in the original seed
    const hasProvider = await this.prisma.systemSetting.findUnique({
      where: { key: "llm.provider" },
    });
    if (!hasProvider) {
      let provider = process.env.LLM_PROVIDER || "";
      if (!provider && process.env.LLM_BASE_URL) {
        const url = process.env.LLM_BASE_URL.toLowerCase();
        if (url.includes("openrouter")) provider = "openrouter";
        else if (url.includes("together")) provider = "together";
        else if (url.includes("groq.com")) provider = "groq";
        else if (url.includes("deepseek")) provider = "deepseek";
        else if (url.includes("fireworks")) provider = "fireworks";
        else if (url.includes("openai.com")) provider = "openai";
        else provider = "custom";
      }
      if (provider) {
        await this.prisma.systemSetting.create({
          data: {
            key: "llm.provider",
            value: provider,
            encrypted: false,
            description:
              "LLM provider (openai, openrouter, together, groq, deepseek, fireworks, custom)",
            category: "llm",
            valueType: "string",
          },
        });
        this.logger.log(`Seeded missing llm.provider = ${provider}`);
      }
    }

    // Always load all DB values into the in-memory store
    const allRows = await this.prisma.systemSetting.findMany();
    const entries: [string, string][] = allRows.map((row) => {
      let plainValue: string;
      try {
        plainValue = row.encrypted ? this.decrypt(row.value) : row.value;
      } catch {
        plainValue = row.value;
      }
      return [row.key, plainValue];
    });
    loadSettings(entries);
    this.logger.log(`Loaded ${entries.length} settings into in-memory store`);
  }

  getReadOnlyEnvVars() {
    return READ_ONLY_VARS.map((v) => {
      const rawValue = process.env[v.key] ?? "";
      return {
        key: v.key,
        value: v.secret ? this.mask(rawValue) : rawValue,
        category: v.category,
        description: v.description,
        readonly: true,
      };
    });
  }

  async testConnection(
    type: "llm" | "embedding",
    config: Record<string, string>,
  ): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();

    // The dashboard sends form values keyed by setting key (e.g. "llm.base_url")
    // Normalize to simple keys for convenience
    const get = (shortKey: string): string => {
      const prefix = type === "llm" ? "llm." : "embedding.";
      return config[`${prefix}${shortKey}`] ?? config[shortKey] ?? "";
    };

    const baseUrl = get("base_url");
    const modelId = get("model");

    // For API key: use provided value, or fall back to stored/encrypted DB value
    let apiKey = get("api_key");
    if (!apiKey) {
      const keySettingKey =
        type === "llm" ? "llm.api_key" : "embedding.api_key";
      const row = await this.prisma.systemSetting.findUnique({
        where: { key: keySettingKey },
      });
      if (row) {
        try {
          apiKey = row.encrypted ? this.decrypt(row.value) : row.value;
        } catch {
          apiKey = row.value;
        }
      }
    }

    if (!baseUrl || !modelId) {
      return { success: false, error: "Base URL and model are required" };
    }

    try {
      if (type === "llm") {
        const provider = createOpenAI({ baseURL: baseUrl, apiKey });
        const model = provider.chat(modelId);
        await generateText({
          model,
          prompt: "say hello",
          maxOutputTokens: 10,
        });
      } else {
        // Voyage AI rejects the encoding_format param that the OpenAI SDK sends
        const embeddingProviderName =
          get("provider") || (baseUrl.includes("voyage") ? "voyage" : "");
        const customFetch: typeof globalThis.fetch | null =
          embeddingProviderName === "voyage"
            ? async (input, init) => {
                if (init?.body && typeof init.body === "string") {
                  try {
                    const parsed = JSON.parse(init.body);
                    if (parsed.encoding_format) {
                      delete parsed.encoding_format;
                      init = { ...init, body: JSON.stringify(parsed) };
                    }
                  } catch {}
                }
                const resp = await globalThis.fetch(input, init);
                if (resp.ok && String(input).includes("/embeddings")) {
                  const body = await resp.json();
                  if (body.usage && body.usage.prompt_tokens === undefined) {
                    body.usage.prompt_tokens = body.usage.total_tokens ?? 0;
                  }
                  return new Response(JSON.stringify(body), {
                    status: resp.status,
                    headers: resp.headers,
                  });
                }
                return resp;
              }
            : null;

        const provider = createOpenAI({
          baseURL: baseUrl,
          apiKey,
          ...(customFetch
            ? { fetch: customFetch as typeof globalThis.fetch }
            : {}),
        });
        const model = provider.embedding(modelId);
        await embed({
          model,
          value: "test",
        });
      }

      return { success: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message ?? String(err),
      };
    }
  }

  async testReranker(): Promise<{
    success: boolean;
    latencyMs?: number;
    model?: string;
    error?: string;
  }> {
    const start = Date.now();

    // Resolve API key: prefer rerank-specific, fall back to embedding key
    let apiKey = "";
    for (const settingKey of ["rerank.api_key", "embedding.api_key"]) {
      const row = await this.prisma.systemSetting.findUnique({
        where: { key: settingKey },
      });
      if (row) {
        try {
          apiKey = row.encrypted ? this.decrypt(row.value) : row.value;
        } catch {
          apiKey = row.value;
        }
        if (apiKey) break;
      }
    }
    if (!apiKey) {
      apiKey =
        process.env.RERANK_API_KEY || process.env.EMBEDDING_API_KEY || "";
    }

    // Resolve model
    const modelRow = await this.prisma.systemSetting.findUnique({
      where: { key: "rerank.model" },
    });
    const model = modelRow?.value || process.env.RERANK_MODEL || "rerank-2";

    if (!apiKey) {
      return { success: false, error: "No reranker API key configured" };
    }

    try {
      const response = await fetch("https://api.voyageai.com/v1/rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: "test query",
          documents: ["document one", "document two"],
          model,
          top_k: 2,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return {
          success: false,
          error: `Voyage API returned ${response.status}: ${text}`.slice(
            0,
            200,
          ),
        };
      }

      return { success: true, latencyMs: Date.now() - start, model };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message ?? String(err),
      };
    }
  }
}
