import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";

/**
 * Authenticates the Chrome extension that captures bot-session cookies. The
 * extension sends `X-Roamer-Key: <secret>`; we compare against
 * `ROAMER_INGEST_KEY` with constant-time equality.
 */
@Injectable()
export class RoamerIngestGuard implements CanActivate {
  private readonly key: string;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    this.key = config.get("ROAMER_INGEST_KEY")!;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided =
      typeof req.headers["x-roamer-key"] === "string"
        ? (req.headers["x-roamer-key"] as string)
        : null;
    if (!provided) throw new UnauthorizedException("missing X-Roamer-Key");

    const expected = this.key;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException("invalid X-Roamer-Key");
    }
    return true;
  }
}
