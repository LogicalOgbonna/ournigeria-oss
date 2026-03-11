import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, embed } from "ai";
import * as crypto from "crypto";
import { setSetting, notifySettingsChanged } from "../config/settings-store";

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

@Injectable()
export class AdminConnectionsService {
  private readonly logger = new Logger(AdminConnectionsService.name);

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

  private mask(value: string): string {
    if (value.length <= 4)
      return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
    return "\u2022\u2022\u2022\u2022\u2022" + value.slice(-4);
  }

  /* ---- Present a connection (mask api key) ----------------------- */

  private present(row: any) {
    let maskedKey: string;
    try {
      const plain = this.decrypt(row.apiKey);
      maskedKey = this.mask(plain);
    } catch {
      maskedKey = this.mask(row.apiKey);
    }

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      provider: row.provider,
      baseUrl: row.baseUrl,
      apiKeyMasked: maskedKey,
      modelId: row.modelId,
      modelSmall: row.modelSmall,
      dimension: row.dimension,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy,
    };
  }

  /* ---- CRUD ------------------------------------------------------ */

  async list(type?: string) {
    const where = type ? { type } : {};
    const rows = await this.prisma.providerConnection.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });
    return rows.map((r) => this.present(r));
  }

  async getById(id: string) {
    const row = await this.prisma.providerConnection.findUnique({
      where: { id },
    });
    if (!row) return null;
    return this.present(row);
  }

  async create(data: {
    name: string;
    type: "llm" | "embedding";
    provider: string;
    baseUrl: string;
    apiKey: string;
    modelId: string;
    modelSmall?: string;
    dimension?: number;
    createdBy: string;
  }) {
    const encryptedKey = this.encrypt(data.apiKey);

    const row = await this.prisma.providerConnection.create({
      data: {
        name: data.name,
        type: data.type,
        provider: data.provider,
        baseUrl: data.baseUrl,
        apiKey: encryptedKey,
        modelId: data.modelId,
        modelSmall: data.modelSmall || null,
        dimension: data.dimension || null,
        isActive: false,
        createdBy: data.createdBy,
      },
    });

    this.logger.log(
      `Created ${data.type} connection: ${data.name} (${row.id})`,
    );
    return this.present(row);
  }

  async update(
    id: string,
    data: {
      name?: string;
      provider?: string;
      baseUrl?: string;
      apiKey?: string;
      modelId?: string;
      modelSmall?: string;
      dimension?: number;
    },
  ) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.apiKey !== undefined)
      updateData.apiKey = this.encrypt(data.apiKey);
    if (data.modelId !== undefined) updateData.modelId = data.modelId;
    if (data.modelSmall !== undefined)
      updateData.modelSmall = data.modelSmall || null;
    if (data.dimension !== undefined)
      updateData.dimension = data.dimension || null;

    const row = await this.prisma.providerConnection.update({
      where: { id },
      data: updateData,
    });

    // If this connection is active, push updated values to system settings
    if (row.isActive) {
      await this.pushToSettings(row);
    }

    this.logger.log(`Updated connection: ${row.name} (${id})`);
    return this.present(row);
  }

  async delete(id: string) {
    const row = await this.prisma.providerConnection.findUnique({
      where: { id },
    });
    if (!row) return false;

    if (row.isActive) {
      this.logger.warn(`Deleting active connection: ${row.name} (${id})`);
    }

    await this.prisma.providerConnection.delete({ where: { id } });
    this.logger.log(`Deleted connection: ${row.name} (${id})`);
    return true;
  }

  /* ---- Activate -------------------------------------------------- */

  async activate(id: string) {
    const target = await this.prisma.providerConnection.findUnique({
      where: { id },
    });
    if (!target) return null;

    // Deactivate all other connections of the same type
    await this.prisma.providerConnection.updateMany({
      where: { type: target.type, isActive: true },
      data: { isActive: false },
    });

    // Activate the target
    const row = await this.prisma.providerConnection.update({
      where: { id },
      data: { isActive: true },
    });

    // Push connection values to system settings
    await this.pushToSettings(row);

    this.logger.log(`Activated ${row.type} connection: ${row.name} (${id})`);
    return this.present(row);
  }

  /* ---- Push to system settings ----------------------------------- */

  private async pushToSettings(row: any) {
    let plainApiKey: string;
    try {
      plainApiKey = this.decrypt(row.apiKey);
    } catch {
      plainApiKey = row.apiKey;
    }

    if (row.type === "llm") {
      const settings = [
        { key: "llm.provider", value: row.provider },
        { key: "llm.base_url", value: row.baseUrl },
        { key: "llm.api_key", value: plainApiKey },
        { key: "llm.model", value: row.modelId },
      ];
      if (row.modelSmall) {
        settings.push({ key: "llm.model_small", value: row.modelSmall });
      }

      for (const s of settings) {
        const isSecret = s.key === "llm.api_key";
        const storedValue = isSecret ? this.encrypt(s.value) : s.value;
        await this.prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: storedValue, encrypted: isSecret },
          create: {
            key: s.key,
            value: storedValue,
            encrypted: isSecret,
            category: "llm",
            valueType: isSecret ? "secret" : "string",
          },
        });
        setSetting(s.key, s.value);
      }
    } else if (row.type === "embedding") {
      // Derive provider name from baseUrl if not explicit
      const embProvider =
        row.provider || (row.baseUrl.includes("voyage") ? "voyage" : "openai");
      const settings: { key: string; value: string }[] = [
        { key: "embedding.provider", value: embProvider },
        { key: "embedding.base_url", value: row.baseUrl },
        { key: "embedding.api_key", value: plainApiKey },
        { key: "embedding.model", value: row.modelId },
      ];
      if (row.dimension) {
        settings.push({
          key: "embedding.dimension",
          value: String(row.dimension),
        });
      }

      for (const s of settings) {
        const isSecret = s.key === "embedding.api_key";
        const storedValue = isSecret ? this.encrypt(s.value) : s.value;
        await this.prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: storedValue, encrypted: isSecret },
          create: {
            key: s.key,
            value: storedValue,
            encrypted: isSecret,
            category: "embedding",
            valueType: isSecret
              ? "secret"
              : s.key === "embedding.dimension"
                ? "number"
                : "string",
          },
        });
        setSetting(s.key, s.value);
      }
    }

    notifySettingsChanged();
  }

  /* ---- Test connection ------------------------------------------- */

  async testConnection(data: {
    type: "llm" | "embedding";
    provider: string;
    baseUrl: string;
    apiKey: string;
    modelId: string;
  }): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();

    if (!data.baseUrl || !data.modelId) {
      return { success: false, error: "Base URL and model are required" };
    }

    try {
      if (data.type === "llm") {
        const provider = createOpenAI({
          baseURL: data.baseUrl,
          apiKey: data.apiKey,
        });
        const model = provider.chat(data.modelId);
        await generateText({ model, prompt: "say hello", maxOutputTokens: 10 });
      } else {
        // Voyage AI compatibility
        const isVoyage =
          data.provider === "voyage" || data.baseUrl.includes("voyage");
        const customFetch: typeof globalThis.fetch | null = isVoyage
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
          baseURL: data.baseUrl,
          apiKey: data.apiKey,
          ...(customFetch
            ? { fetch: customFetch as typeof globalThis.fetch }
            : {}),
        });
        const model = provider.embedding(data.modelId);
        await embed({ model, value: "test" });
      }

      return { success: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  /* ---- Test an existing connection by ID ------------------------- */

  async testById(
    id: string,
  ): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const row = await this.prisma.providerConnection.findUnique({
      where: { id },
    });
    if (!row) return { success: false, error: "Connection not found" };

    let plainApiKey: string;
    try {
      plainApiKey = this.decrypt(row.apiKey);
    } catch {
      plainApiKey = row.apiKey;
    }

    return this.testConnection({
      type: row.type as "llm" | "embedding",
      provider: row.provider,
      baseUrl: row.baseUrl,
      apiKey: plainApiKey,
      modelId: row.modelId,
    });
  }

  /* ---- Seed from current settings (first-run helper) ------------- */

  async seedFromSettings() {
    // Seed each type independently — only if no connections of that type exist
    await this.seedType("llm");
    await this.seedType("embedding");
  }

  private async seedType(type: "llm" | "embedding") {
    const existing = await this.prisma.providerConnection.count({
      where: { type },
    });
    if (existing > 0) return;

    const category = type === "llm" ? "llm" : "embedding";
    const rows = await this.prisma.systemSetting.findMany({
      where: { category },
    });
    if (rows.length === 0) return;

    const get = (key: string) => {
      const row = rows.find((s) => s.key === key);
      if (!row) return "";
      try {
        return row.encrypted ? this.decrypt(row.value) : row.value;
      } catch {
        return row.value;
      }
    };

    const prefix = type === "llm" ? "llm" : "embedding";
    const provider = get(`${prefix}.provider`);
    const baseUrl = get(`${prefix}.base_url`);
    const apiKey = get(`${prefix}.api_key`);
    const modelId = get(`${prefix}.model`);

    if (!baseUrl || !apiKey || !modelId) return;

    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const modelShort = modelId.split("/").pop() || modelId;

    const data: any = {
      name: `${providerLabel} — ${modelShort}`,
      type,
      provider: provider || "custom",
      baseUrl,
      apiKey: this.encrypt(apiKey),
      modelId,
      isActive: true,
    };

    if (type === "llm") {
      data.modelSmall = get("llm.model_small") || null;
    } else {
      const dim = parseInt(get("embedding.dimension") || "0", 10);
      data.dimension = dim || null;
    }

    await this.prisma.providerConnection.create({ data });
    this.logger.log(`Seeded default ${type} connection from existing settings`);
  }
}
