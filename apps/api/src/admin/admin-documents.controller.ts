import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { AdminGuard } from "./admin.guard";
import { AdminDocumentsService } from "./admin-documents.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard)
@ApiTags("Admin - Documents")
@Controller("admin/documents")
export class AdminDocumentsController {
  constructor(private service: AdminDocumentsService) {}

  @Get("coverage")
  @ApiOperation({ summary: "Get document coverage matrix for a pipeline" })
  async getCoverage(
    @Query("pipeline") pipeline = "budget",
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.getCoverage(pipeline);
      return res.json(data);
    } catch (err: any) {
      if (err?.status === 400) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: err.message });
      }
      console.error("admin documents-coverage error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
