import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AdminS3Service } from "./admin-s3.service";
import { AuditService, auditActorFromRequest } from "../audit/audit.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("documents.write")
@Controller("admin/s3")
export class AdminS3Controller {
  constructor(
    private service: AdminS3Service,
    private audit: AuditService,
  ) {}

  @Get("browse")
  async browse(@Query("prefix") prefix = "", @Res() res: Response) {
    try {
      const data = await this.service.browse(prefix);
      return res.json(data);
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin s3-browse error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("folder")
  async createFolder(
    @Body() body: { prefix: string; folderName: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      if (!body.folderName?.trim()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Folder name is required" });
      }
      const result = await this.service.createFolder(
        body.prefix || "",
        body.folderName.trim(),
      );
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "s3.folder_created",
        targetType: "s3",
        targetId: result.prefix,
      });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin s3-create-folder error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body("prefix") prefix: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "No file provided" });
      }
      if (!prefix) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Prefix is required" });
      }

      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const s3Key = `${prefix.replace(/\/$/, "")}/${safeName}`;

      const result = await this.service.upload(
        s3Key,
        file.buffer,
        file.mimetype,
      );
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "s3.uploaded",
        targetType: "s3",
        targetId: s3Key,
        metadata: { size: file.size },
      });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin s3-upload error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
