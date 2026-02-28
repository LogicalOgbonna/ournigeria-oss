import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { CurrentUser } from "../auth/decorators/current-user";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  async getNotifications(
    @CurrentUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      const [notifications, unreadCount] = await Promise.all([
        this.notificationsService.getNotifications(userId),
        this.notificationsService.getUnreadCount(userId),
      ]);

      return res.json({
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
          link: n.linkText && n.linkUrl
            ? { text: n.linkText, url: n.linkUrl }
            : undefined,
        })),
        unreadCount,
      });
    } catch (err) {
      console.error("get-notifications error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  async markAsRead(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    try {
      await this.notificationsService.markAsRead(userId, id);
      return res.json({ success: true });
    } catch (err) {
      console.error("mark-read error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllAsRead(
    @CurrentUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.notificationsService.markAllAsRead(userId);
      return res.json({ success: true });
    } catch (err) {
      console.error("mark-all-read error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("banners")
  @ApiOperation({ summary: "Get active system banners" })
  async getBanners(
    @CurrentUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      const banners = await this.notificationsService.getActiveBanners(userId);

      return res.json({
        banners: banners.map((b) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          message: b.message,
          dismissible: b.dismissible,
          expiresAt: b.expiresAt?.toISOString(),
          link: b.linkText && b.linkUrl
            ? { text: b.linkText, url: b.linkUrl }
            : undefined,
        })),
      });
    } catch (err) {
      console.error("get-banners error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("banners/:id/dismiss")
  @ApiOperation({ summary: "Dismiss a system banner" })
  async dismissBanner(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    try {
      await this.notificationsService.dismissBanner(userId, id);
      return res.json({ success: true });
    } catch (err) {
      console.error("dismiss-banner error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
