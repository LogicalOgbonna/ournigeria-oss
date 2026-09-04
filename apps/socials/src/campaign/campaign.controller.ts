import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { RequirePermission } from "@ournigeria/access";
import { AdminAuthGuard } from "../platforms/twitter/guards/admin-auth.guard.js";
import { PermissionsGuard } from "../platforms/twitter/guards/permissions.guard.js";
import { SocialsSettingsService } from "../config/socials-settings.service.js";
import { CampaignTemplateProvider } from "./campaign-template.provider.js";
import type { IdentifyCategory } from "../identify/identify-content.js";
import { type VerifyKind, VERIFY_PLACEHOLDERS } from "../verify/verify-content.js";

/** Allowed placeholders per campaign kind. Every template MUST contain {url}
 * and may ONLY reference names from this set. VERIFY_PLACEHOLDERS is the DI-free
 * source of truth in verify-content.ts (shared with the drafter). */
const IDENTIFY_PLACEHOLDERS = new Set([
  "ward",
  "lga",
  "constituency",
  "state",
  "url",
]);

const IDENTIFY_CATEGORIES: IdentifyCategory[] = [
  "councilor",
  "lga_chairman",
  "mha",
];
const VERIFY_KINDS: VerifyKind[] = ["identify", "change"];

interface UpdateSettingsBody {
  identify_auto_post?: boolean;
  verify_auto_post?: boolean;
}

interface UpdateTemplatesBody {
  kind?: string;
  category?: string;
  templates?: unknown;
}

@ApiTags("Campaign Admin")
@Controller("v1/campaign")
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission("socials.topics")
export class CampaignController {
  constructor(
    private readonly settings: SocialsSettingsService,
    private readonly templates: CampaignTemplateProvider,
  ) {}

  @Get("settings")
  @ApiOperation({ summary: "Read the identify/verify auto-post toggles" })
  async getSettings() {
    return {
      identify_auto_post: await this.settings.getIdentifyAutoPost(),
      verify_auto_post: await this.settings.getVerifyAutoPost(),
    };
  }

  @Put("settings")
  @ApiOperation({ summary: "Flip the identify/verify auto-post toggles" })
  async updateSettings(@Body() body: UpdateSettingsBody) {
    if (typeof body?.identify_auto_post === "boolean") {
      await this.settings.setIdentifyAutoPost(body.identify_auto_post);
    }
    if (typeof body?.verify_auto_post === "boolean") {
      await this.settings.setVerifyAutoPost(body.verify_auto_post);
    }
    return {
      identify_auto_post: await this.settings.getIdentifyAutoPost(),
      verify_auto_post: await this.settings.getVerifyAutoPost(),
    };
  }

  @Get("templates")
  @ApiOperation({ summary: "Read the identify + verify tweet templates" })
  async getTemplates() {
    return {
      identify: await this.templates.getIdentifyTemplates(),
      verify: await this.templates.getVerifyTemplates(),
    };
  }

  @Put("templates")
  @ApiOperation({
    summary:
      "Replace the templates for one (kind, category) after placeholder validation",
  })
  async updateTemplates(@Body() body: UpdateTemplatesBody) {
    const kind = body?.kind;
    if (kind !== "identify" && kind !== "verify") {
      throw new BadRequestException(
        `kind must be "identify" or "verify" (got ${JSON.stringify(kind)})`,
      );
    }

    const category = body?.category;
    if (typeof category !== "string") {
      throw new BadRequestException("category is required");
    }

    if (kind === "identify") {
      if (!IDENTIFY_CATEGORIES.includes(category as IdentifyCategory)) {
        throw new BadRequestException(
          `identify category must be one of ${IDENTIFY_CATEGORIES.join(", ")} (got ${category})`,
        );
      }
    } else if (!VERIFY_KINDS.includes(category as VerifyKind)) {
      throw new BadRequestException(
        `verify category must be one of ${VERIFY_KINDS.join(", ")} (got ${category})`,
      );
    }

    const templates = this.validateTemplates(kind, body?.templates);

    if (kind === "identify") {
      await this.templates.setIdentifyCategory(
        category as IdentifyCategory,
        templates,
      );
    } else {
      await this.templates.setVerifyKind(category as VerifyKind, templates);
    }

    return {
      identify: await this.templates.getIdentifyTemplates(),
      verify: await this.templates.getVerifyTemplates(),
    };
  }

  /**
   * Validate an incoming templates array for a given kind: non-empty array of
   * non-empty strings, each containing {url} and only known placeholders.
   * Returns the validated string[] or throws BadRequestException.
   */
  private validateTemplates(
    kind: "identify" | "verify",
    raw: unknown,
  ): string[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new BadRequestException("templates must be a non-empty array");
    }

    const allowed =
      kind === "identify" ? IDENTIFY_PLACEHOLDERS : VERIFY_PLACEHOLDERS;

    for (const tpl of raw) {
      if (typeof tpl !== "string" || tpl.trim().length === 0) {
        throw new BadRequestException(
          "each template must be a non-empty string",
        );
      }

      const found = new Set<string>();
      // camelCase-aware: placeholders like {sourceNote}/{fieldLabel} must be
      // seen so a camelCase typo is rejected, not silently passed through.
      for (const match of tpl.matchAll(/\{([a-zA-Z]+)\}/g)) {
        found.add(match[1]);
      }

      for (const ph of found) {
        if (!allowed.has(ph)) {
          throw new BadRequestException(
            `template contains unknown placeholder {${ph}} (allowed: ${[...allowed]
              .map((p) => `{${p}}`)
              .join(", ")})`,
          );
        }
      }

      if (!found.has("url")) {
        throw new BadRequestException("each template must contain {url}");
      }
    }

    return raw as string[];
  }
}
