import { Global, Injectable, Module } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

/** Runtime, DB-backed socials settings (toggleable from the dashboard, no
 * redeploy). Stored in the shared `system_settings` table under the `socials`
 * category so they live next to the rest of the platform's settings. */
@Injectable()
export class SocialsSettingsService {
  static readonly AUTO_PUBLISH_KEY = "socials.auto_publish";
  static readonly AUTO_PUBLISH_INBOUND_KEY = "socials.auto_publish_inbound";
  static readonly IDENTIFY_AUTO_POST_KEY = "identify.auto_post";
  static readonly VERIFY_AUTO_POST_KEY = "verify.auto_post";
  static readonly SCOUT_ENABLED_KEY = "socials.scout_enabled";
  static readonly TAG_HANDLES_KEY = "socials.tag_handles";

  constructor(private readonly prisma: PrismaService) {}

  /** Whether the drafter should publish "recommended" drafts automatically
   * (no dashboard approval). Defaults to false — human review stays on. */
  async getAutoPublish(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.AUTO_PUBLISH_KEY },
    });
    return row?.value === "true";
  }

  /**
   * Whether INBOUND drafts (replies to us / mentions) may auto-publish. Kept
   * SEPARATE from getAutoPublish and defaulting false: inbound engagement is
   * lower-trust (trolls, bait, adversarial prompts), so it stays human-gated
   * even when general roamed-draft auto-publish is on, until an operator
   * explicitly opts in. */
  async getAutoPublishInbound(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.AUTO_PUBLISH_INBOUND_KEY },
    });
    return row?.value === "true";
  }

  async setAutoPublishInbound(enabled: boolean): Promise<boolean> {
    const value = enabled ? "true" : "false";
    await this.prisma.systemSetting.upsert({
      where: { key: SocialsSettingsService.AUTO_PUBLISH_INBOUND_KEY },
      create: {
        key: SocialsSettingsService.AUTO_PUBLISH_INBOUND_KEY,
        value,
        category: "socials",
        valueType: "boolean",
        description:
          "Auto-publish recommended INBOUND drafts (replies to us / mentions) without dashboard approval",
      },
      update: { value },
    });
    return enabled;
  }

  async setAutoPublish(enabled: boolean): Promise<boolean> {
    const value = enabled ? "true" : "false";
    await this.prisma.systemSetting.upsert({
      where: { key: SocialsSettingsService.AUTO_PUBLISH_KEY },
      create: {
        key: SocialsSettingsService.AUTO_PUBLISH_KEY,
        value,
        category: "socials",
        valueType: "boolean",
        description:
          "Auto-publish recommended reply/quote/retweet drafts without dashboard approval",
      },
      update: { value },
    });
    return enabled;
  }

  /** Whether the identify campaign auto-posts (true) or parks drafts for
   * dashboard review (false). Defaults to false — human review stays on. */
  async getIdentifyAutoPost(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.IDENTIFY_AUTO_POST_KEY },
    });
    return row?.value === "true";
  }

  async setIdentifyAutoPost(enabled: boolean): Promise<boolean> {
    const value = enabled ? "true" : "false";
    await this.prisma.systemSetting.upsert({
      where: { key: SocialsSettingsService.IDENTIFY_AUTO_POST_KEY },
      create: {
        key: SocialsSettingsService.IDENTIFY_AUTO_POST_KEY,
        value,
        category: "socials",
        valueType: "boolean",
        description:
          "Auto-post identify-campaign tweets; when false, drafts park in the review queue",
      },
      update: { value },
    });
    return enabled;
  }

  /** Whether verify tweets auto-post (true) or park drafts for dashboard
   *  review (false). Independent of identify.auto_post. Defaults to false. */
  async getVerifyAutoPost(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.VERIFY_AUTO_POST_KEY },
    });
    return row?.value === "true";
  }

  async setVerifyAutoPost(enabled: boolean): Promise<boolean> {
    const value = enabled ? "true" : "false";
    await this.prisma.systemSetting.upsert({
      where: { key: SocialsSettingsService.VERIFY_AUTO_POST_KEY },
      create: {
        key: SocialsSettingsService.VERIFY_AUTO_POST_KEY,
        value,
        category: "socials",
        valueType: "boolean",
        description:
          "Auto-post verify tweets; when false, drafts park in the review queue",
      },
      update: { value },
    });
    return enabled;
  }

  /** Whether the location scout roams X for taggable Nigerian accounts.
   * Defaults to false — no scouting until an operator opts in. */
  async getScoutEnabled(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.SCOUT_ENABLED_KEY },
    });
    return row?.value === "true";
  }

  async setScoutEnabled(enabled: boolean): Promise<boolean> {
    const value = enabled ? "true" : "false";
    await this.prisma.systemSetting.upsert({
      where: { key: SocialsSettingsService.SCOUT_ENABLED_KEY },
      create: {
        key: SocialsSettingsService.SCOUT_ENABLED_KEY,
        value,
        category: "socials",
        valueType: "boolean",
        description:
          "Roam X for Nigerian accounts attributable to a state/LGA/ward (location scout)",
      },
      update: { value },
    });
    return enabled;
  }

  /** Whether campaign tweets append scouted location handles as tags
   * (`cc @handle`). Defaults to false — tweets go out untagged until an
   * operator opts in. Independent of scout_enabled so scouting can build the
   * pool before any tweet tags anyone. */
  async getTagHandles(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.TAG_HANDLES_KEY },
    });
    return row?.value === "true";
  }

  async setTagHandles(enabled: boolean): Promise<boolean> {
    const value = enabled ? "true" : "false";
    await this.prisma.systemSetting.upsert({
      where: { key: SocialsSettingsService.TAG_HANDLES_KEY },
      create: {
        key: SocialsSettingsService.TAG_HANDLES_KEY,
        value,
        category: "socials",
        valueType: "boolean",
        description:
          "Tag scouted location handles on campaign tweets (\"@a @b — you're from {place}, do you know who this is?\")",
      },
      update: { value },
    });
    return enabled;
  }
}

@Global()
@Module({
  providers: [SocialsSettingsService],
  exports: [SocialsSettingsService],
})
export class SocialsSettingsModule {}
