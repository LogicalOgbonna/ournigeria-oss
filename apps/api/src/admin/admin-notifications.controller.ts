import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { z } from "zod";
import { AdminGuard } from "./admin.guard";
import { AdminNotificationsService } from "./admin-notifications.service";
import { Public } from "../auth/decorators/public";

const createNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  broadcast: z.boolean().optional().default(false),
  type: z.enum(["incident", "announcement", "info", "warning"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  linkText: z.string().max(100).optional(),
  linkUrl: z.string().max(500).optional(),
});

const createBannerSchema = z.object({
  type: z.enum(["incident", "announcement", "warning"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  linkText: z.string().max(100).optional(),
  linkUrl: z.string().max(500).optional(),
  dismissible: z.boolean().optional().default(true),
  expiresAt: z.string().datetime().optional(),
});

const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).optional(),
  active: z.boolean().optional(),
  dismissible: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

@Public()
@UseGuards(AdminGuard)
@ApiTags("Admin - Notifications")
@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private service: AdminNotificationsService) {}

  // ── Notifications ────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "List all notifications (paginated)" })
  async listNotifications(
    @Query("page") page = "1",
    @Query("limit") limit = "50",
    @Query("userId") userId?: string,
    @Res() res?: Response,
  ) {
    try {
      const p = Math.max(1, parseInt(page));
      const l = Math.min(100, Math.max(1, parseInt(limit)));
      const data = await this.service.listNotifications(p, l, userId);
      return res!.json(data);
    } catch (err) {
      console.error("admin list-notifications error:", err);
      return res!
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post()
  @ApiOperation({ summary: "Create notification (single user or broadcast)" })
  async createNotification(@Body() body: unknown, @Res() res: Response) {
    try {
      const parsed = createNotificationSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const { broadcast, userId, ...data } = parsed.data;

      if (!broadcast && !userId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Provide userId or set broadcast: true" });
      }

      const result = broadcast
        ? await this.service.broadcastNotification(data)
        : await this.service.createNotification(userId!, data);

      return res.status(HttpStatus.CREATED).json(result);
    } catch (err) {
      console.error("admin create-notification error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  async deleteNotification(@Param("id") id: string, @Res() res: Response) {
    try {
      await this.service.deleteNotification(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("admin delete-notification error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  // ── Banners ──────────────────────────────────────────

  @Get("banners")
  @ApiOperation({ summary: "List all system banners" })
  async listBanners(@Res() res: Response) {
    try {
      const banners = await this.service.listBanners();
      return res.json({ banners });
    } catch (err) {
      console.error("admin list-banners error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("banners")
  @ApiOperation({ summary: "Create a system banner" })
  async createBanner(@Body() body: unknown, @Res() res: Response) {
    try {
      const parsed = createBannerSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const banner = await this.service.createBanner(parsed.data);
      return res.status(HttpStatus.CREATED).json(banner);
    } catch (err) {
      console.error("admin create-banner error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Patch("banners/:id")
  @ApiOperation({ summary: "Update a system banner" })
  async updateBanner(
    @Param("id") id: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    try {
      const parsed = updateBannerSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const banner = await this.service.updateBanner(id, parsed.data);
      return res.json(banner);
    } catch (err) {
      console.error("admin update-banner error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Delete("banners/:id")
  @ApiOperation({ summary: "Delete a system banner" })
  async deleteBanner(@Param("id") id: string, @Res() res: Response) {
    try {
      await this.service.deleteBanner(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("admin delete-banner error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
