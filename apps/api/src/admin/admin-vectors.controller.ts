import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AdminVectorsService } from "./admin-vectors.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("vectors.manage")
@ApiTags("Admin - Vectors")
@Controller("admin/vectors")
export class AdminVectorsController {
  constructor(private service: AdminVectorsService) {}

  @Get("indexes")
  @ApiOperation({ summary: "List available vector indexes" })
  async listIndexes(@Res() res: Response) {
    try {
      const data = await this.service.listIndexes();
      return res.json({ data });
    } catch (err) {
      console.error("admin vectors-indexes error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("stats")
  @ApiOperation({ summary: "Get stats for a vector index" })
  async getStats(@Query("index") index: string, @Res() res: Response) {
    try {
      if (!index) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "index query parameter is required" });
      }
      const data = await this.service.getStats(index);
      return res.json(data);
    } catch (err: any) {
      if (err?.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin vectors-stats error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("samples")
  @ApiOperation({ summary: "Get sample chunks from a vector index" })
  async getSamples(
    @Query("index") index: string,
    @Query("limit") limit = "5",
    @Res() res: Response,
  ) {
    try {
      if (!index) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "index query parameter is required" });
      }
      const data = await this.service.getSamples(
        index,
        Math.min(20, Math.max(1, parseInt(limit))),
      );
      return res.json({ data });
    } catch (err: any) {
      if (err?.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin vectors-samples error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("documents")
  @ApiOperation({ summary: "Get documents for a specific index group" })
  async getDocuments(
    @Query("index") index: string,
    @Query("groupValue") groupValue: string,
    @Res() res: Response,
  ) {
    try {
      if (!index || !groupValue) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "index and groupValue parameters are required" });
      }
      const data = await this.service.getDocuments(index, groupValue);
      return res.json({ data });
    } catch (err: any) {
      if (err?.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin vectors-documents error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("search")
  @ApiOperation({ summary: "Similarity search against a vector index" })
  async search(
    @Body() body: { index: string; query: string; topK?: number },
    @Res() res: Response,
  ) {
    try {
      if (!body.index || !body.query?.trim()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "index and query are required" });
      }
      const results = await this.service.search(
        body.index,
        body.query,
        body.topK ?? 10,
      );
      return res.json({ results });
    } catch (err: any) {
      if (err?.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin vectors-search error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
