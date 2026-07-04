import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

import { IDENTIFY_TEMPLATES, IdentifyCategory } from "../identify/identify-content.js";
import { VERIFY_TEMPLATES, VerifyKind } from "../verify/verify-content.js";

/**
 * DB-backed campaign template provider. Reads identify/verify tweet templates
 * from `system_settings` JSON rows (editable from the dashboard) and FALLS BACK
 * to the code constants (IDENTIFY_TEMPLATES / VERIFY_TEMPLATES) whenever a row
 * is missing, malformed, or partial. A partial edit (some categories set) fills
 * the rest from the constants, so a category never resolves to an empty array.
 */
@Injectable()
export class CampaignTemplateProvider {
  private readonly logger = new Logger(CampaignTemplateProvider.name);

  static readonly IDENTIFY_KEY = "campaign.identify_templates";
  static readonly VERIFY_KEY = "campaign.verify_templates";

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read a `Record<category, string[]>` from a system_settings JSON row, falling
   * back to `fallback` (the code constant) on any missing row / parse error /
   * shape error. For each expected category key that is missing or empty in the
   * parsed record, fill from the fallback so no category yields an empty array.
   */
  private async readRecord<K extends string>(
    key: string,
    fallback: Record<K, string[]>,
  ): Promise<Record<K, string[]>> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!row) return fallback;

    let parsed: unknown;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      this.logger.warn(`${key}: value is not valid JSON — falling back to code constants`);
      return fallback;
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      this.logger.warn(`${key}: value is not a JSON object — falling back to code constants`);
      return fallback;
    }

    const record = parsed as Record<string, unknown>;
    // Validate every present value is a non-empty array of strings.
    for (const [cat, val] of Object.entries(record)) {
      if (
        !Array.isArray(val) ||
        val.length === 0 ||
        !val.every((t) => typeof t === "string" && t.length > 0)
      ) {
        this.logger.warn(
          `${key}: category "${cat}" is not a non-empty string array — falling back to code constants`,
        );
        return fallback;
      }
    }

    // Fill any missing/empty expected category from the fallback.
    const result = {} as Record<K, string[]>;
    for (const cat of Object.keys(fallback) as K[]) {
      const val = record[cat];
      result[cat] = Array.isArray(val) && val.length > 0 ? (val as string[]) : fallback[cat];
    }
    return result;
  }

  async getIdentifyTemplates(): Promise<Record<IdentifyCategory, string[]>> {
    return this.readRecord<IdentifyCategory>(
      CampaignTemplateProvider.IDENTIFY_KEY,
      IDENTIFY_TEMPLATES,
    );
  }

  async getVerifyTemplates(): Promise<Record<VerifyKind, string[]>> {
    return this.readRecord<VerifyKind>(CampaignTemplateProvider.VERIFY_KEY, VERIFY_TEMPLATES);
  }

  async setIdentifyCategory(
    cat: IdentifyCategory,
    templates: string[],
  ): Promise<Record<IdentifyCategory, string[]>> {
    const record = await this.getIdentifyTemplates();
    record[cat] = templates;
    const value = JSON.stringify(record);
    await this.prisma.systemSetting.upsert({
      where: { key: CampaignTemplateProvider.IDENTIFY_KEY },
      create: {
        key: CampaignTemplateProvider.IDENTIFY_KEY,
        value,
        category: "socials",
        valueType: "json",
        description: "Identify-campaign tweet templates (per category), editable from the dashboard",
      },
      update: { value },
    });
    return record;
  }

  async setVerifyKind(
    kind: VerifyKind,
    templates: string[],
  ): Promise<Record<VerifyKind, string[]>> {
    const record = await this.getVerifyTemplates();
    record[kind] = templates;
    const value = JSON.stringify(record);
    await this.prisma.systemSetting.upsert({
      where: { key: CampaignTemplateProvider.VERIFY_KEY },
      create: {
        key: CampaignTemplateProvider.VERIFY_KEY,
        value,
        category: "socials",
        valueType: "json",
        description: "Verify-tweet templates (per kind), editable from the dashboard",
      },
      update: { value },
    });
    return record;
  }

  /** Deterministic variant per (category, windowSlot). Mirrors pickTemplate. */
  async pickIdentify(cat: IdentifyCategory, windowSlot: number): Promise<string> {
    const arr = (await this.getIdentifyTemplates())[cat];
    return arr[((windowSlot % arr.length) + arr.length) % arr.length];
  }

  /** Deterministic variant per (kind, seed). Mirrors pickVerifyTemplate. */
  async pickVerify(kind: VerifyKind, seed: number): Promise<string> {
    const arr = (await this.getVerifyTemplates())[kind];
    return arr[((seed % arr.length) + arr.length) % arr.length];
  }
}
