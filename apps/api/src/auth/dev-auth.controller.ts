import { Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { Public } from "./decorators/public";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

@ApiTags("Auth")
@Controller("auth")
export class DevAuthController {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  @Public()
  @Post("dev-login")
  @ApiOperation({ summary: "Dev-only: login as test user (not available in production)" })
  async devLogin(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.upsertTestUser();

    const sessionToken = await this.sessionService.issue(user.id, {
      userAgent: req.headers["user-agent"] ?? null,
      ip: req.ip || req.socket?.remoteAddress || null,
    });

    // Must match production cookie settings: secure + sameSite=none
    // because the web app (spending.arinze.online) makes cross-origin
    // fetch calls directly to the API (spending-api.arinze.online)
    res.cookie(USER_COOKIE, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: COOKIE_MAX_AGE * 1000,
    });

    return res.json({
      success: true,
      userId: user.id,
      authToken: await this.sessionService.createHandoff(user.id),
      message: "Dev login successful. Cookie set. POST authToken to the web app's /auth/handoff.",
    });
  }
}
