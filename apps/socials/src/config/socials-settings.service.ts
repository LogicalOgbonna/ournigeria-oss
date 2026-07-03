import { Global, Injectable, Module } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

/** Runtime, DB-backed socials settings (toggleable from the dashboard, no
 * redeploy). Stored in the shared `system_settings` table under the `socials`
 * category so they live next to the rest of the platform's settings. */
@Injectable()
export class SocialsSettingsService {
  static readonly AUTO_PUBLISH_KEY = "socials.auto_publish";
  static readonly AUTO_PUBLISH_INBOUND_KEY = "socials.auto_publish_inbound";

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
}

@Global()
@Module({
  providers: [SocialsSettingsService],
  exports: [SocialsSettingsService],
})
export class SocialsSettingsModule {}
