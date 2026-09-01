import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { z } from "zod";
import { Public } from "../auth/decorators/public";
import { cache } from "@ournigeria/cache";
import { PrismaService } from "@ournigeria/database";
import { resolvePermissions } from "@ournigeria/access";
import { AdminGuard } from "./admin.guard";
import { AdminAuthService } from "./admin-auth.service";
import { loadActiveRoles } from "./roles.util";
import { AuditService, auditActorFromRequest } from "../audit/audit.service";


const ADMIN_COOKIE = "on_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1).max(100),
});

@Public()
@ApiTags("Admin - Auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    private authService: AdminAuthService,
    private audit: AuditService,
    private prisma: PrismaService,
  ) {}

  @Post("login")
  @ApiOperation({ summary: "Admin login" })
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      // Rate limit by IP + email
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rateLimitKey = `${ip}:${parsed.data.email}`;
      const adminCache = cache.namespace("admin:login");
      const current = (await adminCache.get<number>(rateLimitKey)) ?? 0;
      if (current >= MAX_LOGIN_ATTEMPTS) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          error: `Too many login attempts. Try again in 15 minutes.`,
        });
      }
      await adminCache.set(rateLimitKey, current + 1, LOGIN_WINDOW_MS);

      const result = await this.authService.login(
        parsed.data.email,
        parsed.data.password,
        {
          userAgent: req.headers["user-agent"] ?? null,
          ip: req.ip || req.socket?.remoteAddress || null,
        },
      );

      if (!result.success) {
        await this.audit.logBestEffort(
          { actorType: "staff", ip, userAgent: req.headers["user-agent"] ?? null },
          {
            action: "auth.login.failed",
            metadata: { email: parsed.data.email },
          },
        );
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: result.error });
      }

      // Reset rate limit on successful login
      await adminCache.del(rateLimitKey);

      await this.audit.logBestEffort(
        {
          actorType: "staff",
          actorId: result.admin?.id ?? null,
          ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
        { action: "auth.login", metadata: { email: parsed.data.email } },
      );

      res.cookie(ADMIN_COOKIE, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE * 1000,
      });

      return res.json({ success: true, admin: result.admin });
    } catch (err) {
      console.error("admin login error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("logout")
  @ApiOperation({ summary: "Admin logout" })
  async logout(@Req() req: Request, @Res() res: Response) {
    // Revoke the presented session server-side so the token cannot be replayed.
    const token = req.cookies?.[ADMIN_COOKIE] || req.headers["x-admin-key"];
    if (typeof token === "string") {
      await this.authService.revokeSession(token).catch(() => {});
      await this.audit.logBestEffort(
        {
          actorType: "staff",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
        },
        { action: "auth.logout" },
      );
    }
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    return res.json({ success: true });
  }

  @UseGuards(AdminGuard)
  @Get("me")
  @ApiOperation({ summary: "Get current admin profile" })
  async me(@Req() req: Request, @Res() res: Response) {
    try {
      const adminId = (req as any).adminId as string;
      const admin = await this.authService.getAdmin(adminId);
      if (!admin) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Admin not found" });
      }
      const roles = await loadActiveRoles(this.prisma, "staff", adminId);
      return res.json({
        ...admin,
        roles,
        permissions: [...resolvePermissions(roles)],
      });
    } catch (err) {
      console.error("admin me error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @UseGuards(AdminGuard)
  @Get("admins")
  @ApiOperation({ summary: "List all admin users" })
  async listAdmins(@Res() res: Response) {
    try {
      const admins = await this.authService.listAdmins();
      return res.json({ admins });
    } catch (err) {
      console.error("admin list error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @UseGuards(AdminGuard)
  @Post("admins")
  @ApiOperation({ summary: "Create a new admin user" })
  async createAdmin(
    @Req() req: Request,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    try {
      const parsed = createAdminSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const createdById = (req as any).adminId as string;
      const admin = await this.authService.createAdmin(
        createdById,
        parsed.data,
      );
      return res.status(HttpStatus.CREATED).json(admin);
    } catch (err: any) {
      if (err?.code === "P2002") {
        return res
          .status(HttpStatus.CONFLICT)
          .json({ error: "An admin with this email already exists" });
      }
      console.error("admin create error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @UseGuards(AdminGuard)
  @Delete("admins/:id")
  @ApiOperation({ summary: "Delete an admin user" })
  async deleteAdmin(
    @Req() req: Request,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    try {
      const adminId = (req as any).adminId as string;
      if (adminId === id) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Cannot delete yourself" });
      }

      await this.authService.deleteAdmin(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("admin delete error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
