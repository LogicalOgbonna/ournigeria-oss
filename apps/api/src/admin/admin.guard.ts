import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as crypto from "crypto";

const ADMIN_COOKIE = "on_admin_session";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Try cookie first (dashboard), then X-Admin-Key header (legacy/API)
    const token =
      request.cookies?.[ADMIN_COOKIE] || request.headers["x-admin-key"];

    if (!token) {
      throw new UnauthorizedException("Admin authentication required");
    }

    // Verify HMAC-signed session token: adminId:nonce:signature
    const parts = token.split(":");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid admin token");
    }

    const [adminId, nonce, sig] = parts;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
      throw new UnauthorizedException("Server misconfiguration");
    }
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${adminId}:${nonce}`)
      .digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      throw new UnauthorizedException("Invalid admin token");
    }

    request.adminId = adminId;
    return true;
  }
}
