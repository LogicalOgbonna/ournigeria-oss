import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { FeedbackService } from "./feedback.service";

@Controller("feedback")
export class FeedbackController {
  constructor(private service: FeedbackService) {}

  @Get("mine")
  async listMine(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await this.service.listUserFeedback(userId);
      return res.json(data);
    } catch (err) {
      console.error("feedback list-mine error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post()
  async create(
    @Body() body: { category?: string; subject: string; message: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const userId = (req as any).userId;
      const result = await this.service.createFeedback(userId, body);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("feedback create error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post(":id/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "No file provided" });
      }
      const userId = (req as any).userId;
      const result = await this.service.uploadAttachment(userId, id, file);
      return res.json(result);
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("feedback upload error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
