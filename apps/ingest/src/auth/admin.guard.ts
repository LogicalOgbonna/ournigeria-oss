import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@ournigeria/database";
import * as crypto from "crypto";
import { IS_PUBLIC_KEY } from "./decorators/public";

const ADMIN_COOKIE = "on_admin_session";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Try cookie first (dashboard), then X-Admin-Key header (API)
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

    // Verify admin still exists in database
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true },
    });

    if (!admin) {
      throw new UnauthorizedException("Admin account no longer exists");
    }

    request.adminId = adminId;
    return true;
  }
}
