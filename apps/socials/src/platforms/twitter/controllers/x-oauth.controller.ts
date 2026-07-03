import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Res,
  UseGuards,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminAuthGuard } from "../guards/admin-auth.guard.js";
import { XOauthService, XOauthError } from "../x-oauth.service.js";
import { SocialsSettingsService } from "../../../config/socials-settings.service.js";

/**
 * Dashboard-driven "Connect X account" OAuth2 flow.
 *
 * start / status / disconnect are admin-guarded (HMAC cookie). callback is NOT
 * guarded: X redirects the browser here cross-domain, so the admin cookie is
 * absent. CSRF is covered by the OAuth `state` — only an authenticated `start`
 * can mint a state the service will accept.
 */
@ApiTags("x-oauth")
@Controller("v1/x-oauth")
export class XOauthController {
  private readonly logger = new Logger(XOauthController.name);

  constructor(
    private readonly xOauth: XOauthService,
    private readonly settings: SocialsSettingsService,
  ) {}

  @Post("start")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Begin X account authorization; returns the consent URL" })
  start(): { url: string } {
    return this.xOauth.startAuthorization();
  }

  @Get("callback")
  @ApiOperation({ summary: "X OAuth2 redirect target; exchanges code and bounces to dashboard" })
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    // X itself can redirect back with ?error (e.g. user denied consent).
    if (error) {
      return res.redirect(this.xOauth.dashboardReturn({ x_error: error }));
    }
    if (!code || !state) {
      return res.redirect(
        this.xOauth.dashboardReturn({ x_error: "missing_params" }),
      );
    }
    try {
      const { username } = await this.xOauth.completeAuthorization(code, state);
      return res.redirect(
        this.xOauth.dashboardReturn({ x_connected: username }),
      );
    } catch (err) {
      const reason = err instanceof XOauthError ? err.reason : "unknown_error";
      this.logger.warn(`callback failed: ${reason}`);
      return res.redirect(this.xOauth.dashboardReturn({ x_error: reason }));
    }
  }

  @Get("status")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Current X connection status" })
  status() {
    return this.xOauth.getStatus();
  }

  @Delete()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Disconnect the X account (clears stored tokens)" })
  async disconnect(): Promise<{ ok: true }> {
    await this.xOauth.disconnect();
    return { ok: true };
  }

  @Get("auto-publish")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: "Whether recommended drafts auto-publish without approval",
  })
  async getAutoPublish(): Promise<{ enabled: boolean }> {
    return { enabled: await this.settings.getAutoPublish() };
  }

  @Post("auto-publish")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: "Toggle auto-publish of recommended drafts (DB-backed, live)",
  })
  async setAutoPublish(
    @Body("enabled") enabled: boolean,
  ): Promise<{ enabled: boolean }> {
    return { enabled: await this.settings.setAutoPublish(enabled === true) };
  }

  @Get("auto-publish-inbound")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary:
      "Whether recommended INBOUND drafts (replies to us / mentions) auto-publish",
  })
  async getAutoPublishInbound(): Promise<{ enabled: boolean }> {
    return { enabled: await this.settings.getAutoPublishInbound() };
  }

  @Post("auto-publish-inbound")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary:
      "Toggle auto-publish of recommended inbound drafts (DB-backed, live)",
  })
  async setAutoPublishInbound(
    @Body("enabled") enabled: boolean,
  ): Promise<{ enabled: boolean }> {
    return {
      enabled: await this.settings.setAutoPublishInbound(enabled === true),
    };
  }
}
