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
import { AdminGuard } from "./admin.guard";
import { AdminAuthService } from "./admin-auth.service";


const ADMIN_COOKIE = "on_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(key: string): {
  allowed: boolean;
  retryAfterSecs?: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}

function resetLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

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
  constructor(private authService: AdminAuthService) {}

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
      const rateCheck = checkLoginRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          error: `Too many login attempts. Try again in ${rateCheck.retryAfterSecs} seconds.`,
        });
      }

      const result = await this.authService.login(
        parsed.data.email,
        parsed.data.password,
      );

      if (!result.success) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: result.error });
      }

      // Reset rate limit on successful login
      resetLoginAttempts(rateLimitKey);

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
  async logout(@Res() res: Response) {
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
      return res.json(admin);
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
