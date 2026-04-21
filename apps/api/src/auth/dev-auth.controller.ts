import { Controller, Post, Res } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import * as crypto from "node:crypto";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Sign a user ID so the web proxy can verify it and set its own cookie. */
function signAuthToken(userId: string): string {
  const ts = Date.now().toString(36);
  const secret = process.env.AUTH_SIGNING_SECRET || "";
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${ts}`)
    .digest("hex");
  return `${userId}.${ts}.${sig}`;
}

@ApiTags("Auth")
@Controller("auth")
export class DevAuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("dev-login")
  @ApiOperation({ summary: "Dev-only: login as test user (not available in production)" })
  async devLogin(@Res() res: Response) {
    const user = await this.authService.upsertTestUser();

    // Must match production cookie settings: secure + sameSite=none
    // because the web app (spending.arinze.online) makes cross-origin
    // fetch calls directly to the API (spending-api.arinze.online)
    res.cookie(USER_COOKIE, user.id, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: COOKIE_MAX_AGE * 1000,
    });

    return res.json({
      success: true,
      userId: user.id,
      authToken: signAuthToken(user.id),
      message: "Dev login successful. Cookie set. Use authToken with web app: ?nb_auth=<authToken>",
    });
  }
}
