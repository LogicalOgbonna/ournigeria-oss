import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { AdminGuard } from "./admin.guard";
import { AdminUsersService } from "./admin-users.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard)
@ApiTags("Admin - Users")
@Controller("admin/users")
export class AdminUsersController {
  constructor(private service: AdminUsersService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get user statistics" })
  async getStats(@Res() res: Response) {
    try {
      const stats = await this.service.getUserStats();
      return res.json(stats);
    } catch (err) {
      console.error("admin user-stats error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get()
  @ApiOperation({ summary: "List all users (paginated)" })
  async listUsers(
    @Query("page") page = "1",
    @Query("limit") limit = "25",
    @Query("q") search?: string,
    @Res() res?: Response,
  ) {
    try {
      const p = Math.max(1, parseInt(page));
      const l = Math.min(100, Math.max(1, parseInt(limit)));
      const data = await this.service.listUsers(p, l, search || undefined);
      return res!.json(data);
    } catch (err) {
      console.error("admin list-users error:", err);
      return res!
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user details" })
  async getUser(@Param("id") id: string, @Res() res: Response) {
    try {
      const user = await this.service.getUser(id);
      if (!user) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      console.error("admin get-user error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":id/conversations")
  @ApiOperation({ summary: "Get user conversations" })
  async getUserConversations(@Param("id") id: string, @Res() res: Response) {
    try {
      const data = await this.service.getUserConversations(id);
      return res.json(data);
    } catch (err) {
      console.error("admin user-conversations error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":id/memories")
  @ApiOperation({ summary: "Get user memories" })
  async getUserMemories(@Param("id") id: string, @Res() res: Response) {
    try {
      const data = await this.service.getUserMemories(id);
      return res.json(data);
    } catch (err) {
      console.error("admin user-memories error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":id/analytics")
  @ApiOperation({ summary: "Get user analytics" })
  async getUserAnalytics(@Param("id") id: string, @Res() res: Response) {
    try {
      const data = await this.service.getUserAnalytics(id);
      return res.json(data);
    } catch (err) {
      console.error("admin user-analytics error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user preferences" })
  async updateUser(
    @Param("id") id: string,
    @Body() body: { preferences?: Record<string, unknown> },
    @Res() res: Response,
  ) {
    try {
      if (!body.preferences) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "preferences field required" });
      }
      const updated = await this.service.updateUserPreferences(
        id,
        body.preferences,
      );
      return res.json(updated);
    } catch (err) {
      console.error("admin update-user error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post(":id/ban")
  @ApiOperation({ summary: "Ban a user" })
  async banUser(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.banUser(id, body.reason);
      return res.json(result);
    } catch (err) {
      console.error("admin ban-user error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post(":id/unban")
  @ApiOperation({ summary: "Unban a user" })
  async unbanUser(@Param("id") id: string, @Res() res: Response) {
    try {
      const result = await this.service.unbanUser(id);
      return res.json(result);
    } catch (err) {
      console.error("admin unban-user error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user and all their data" })
  async deleteUser(@Param("id") id: string, @Res() res: Response) {
    try {
      await this.service.deleteUser(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("admin delete-user error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
