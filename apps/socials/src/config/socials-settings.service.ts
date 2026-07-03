import { Global, Injectable, Module } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

/** Runtime, DB-backed socials settings (toggleable from the dashboard, no
 * redeploy). Stored in the shared `system_settings` table under the `socials`
 * category so they live next to the rest of the platform's settings. */
@Injectable()
export class SocialsSettingsService {
  static readonly AUTO_PUBLISH_KEY = "socials.auto_publish";
  static readonly IDENTIFY_AUTO_POST_KEY = "identify.auto_post";

  constructor(private readonly prisma: PrismaService) {}

  /** Whether the drafter should publish "recommended" drafts automatically
   * (no dashboard approval). Defaults to false — human review stays on. */
  async getAutoPublish(): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SocialsSettingsService.AUTO_PUBLISH_KEY },
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
}

@Global()
@Module({
  providers: [SocialsSettingsService],
  exports: [SocialsSettingsService],
})
export class SocialsSettingsModule {}
