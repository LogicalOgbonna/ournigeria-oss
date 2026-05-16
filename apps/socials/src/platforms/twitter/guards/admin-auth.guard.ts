import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";

const ADMIN_COOKIE = "on_admin_session";

export type AuthedRequest = Request & { adminId: string };

/**
 * Verifies the same HMAC-cookie scheme used by apps/dashboard. Token format is
 * `adminId:nonce:sig` where sig = HMAC-SHA256(`${adminId}:${nonce}`, ADMIN_SESSION_SECRET).
 * On success, attaches `request.adminId` so controllers can audit the actor
 * without trusting client-supplied bodies.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);
  private readonly secret: string;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    this.secret = config.get("ADMIN_SESSION_SECRET")!;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token =
      this.tokenFromCookies(req) ??
      this.tokenFromAuthHeader(req) ??
      null;
    if (!token) throw new UnauthorizedException("admin session required");

    const verified = this.verify(token);
    if (!verified) throw new UnauthorizedException("invalid admin session");

    (req as AuthedRequest).adminId = verified.adminId;
    return true;
  }

  private tokenFromCookies(req: Request): string | null {
    const header = req.headers.cookie;
    if (!header) return null;
    const parts = header.split(/;\s*/);
    for (const p of parts) {
      const eq = p.indexOf("=");
      if (eq < 0) continue;
      const name = p.slice(0, eq);
      if (name === ADMIN_COOKIE) {
        return decodeURIComponent(p.slice(eq + 1));
      }
    }
    return null;
  }

  private tokenFromAuthHeader(req: Request): string | null {
    // Dashboard fetches use cookies; tests/curl can use `Authorization: Bearer <token>`.
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    return auth.slice("Bearer ".length).trim();
  }

  private verify(token: string): { adminId: string; nonce: string } | null {
    const parts = token.split(":");
    if (parts.length !== 3) return null;
    const [adminId, nonce, sig] = parts;
    if (!adminId || !nonce || !sig) return null;

    const expected = createHmac("sha256", this.secret)
      .update(`${adminId}:${nonce}`)
      .digest("hex");

    let sigBuf: Buffer, expBuf: Buffer;
    try {
      sigBuf = Buffer.from(sig, "hex");
      expBuf = Buffer.from(expected, "hex");
    } catch {
      return null;
    }
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return { adminId, nonce };
  }
}
