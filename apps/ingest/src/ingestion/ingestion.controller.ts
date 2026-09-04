import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { diskStorage } from "multer";
import * as path from "node:path";
import { Request, Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { AuditWriterService } from "../audit/audit-writer.service";
import { IngestionService } from "./ingestion.service";
import { LogEntry } from "./log-emitter.service";

@ApiTags("Ingestion")
@Controller("api/ingest")
@RequirePermission("ingestion.read")
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly audit: AuditWriterService,
  ) {}

  @Post("run")
  @RequirePermission("ingestion.run")
  @ApiOperation({ summary: "Start an ingestion pipeline (runs in background)" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["pipeline"],
      properties: {
        pipeline: { type: "string", example: "budget" },
        concurrency: { type: "number", example: 5 },
      },
    },
  })
  async run(
    @Body() body: { pipeline: string; concurrency?: number },
    @Req() req: Request & { adminId?: string },
  ) {
    const result = await this.ingestionService.runPipeline(
      body.pipeline,
      "manual",
      body.concurrency,
    );
    await this.audit.log(req.adminId as string, {
      action: "ingestion.run.started",
      targetType: "ingestion_run",
      targetId: result.runId,
      metadata: { pipeline: body.pipeline, trigger: "manual" },
    });
    return result;
  }

  @Post("upload")
  @RequirePermission("ingestion.run")
  @ApiOperation({ summary: "Upload files and run a pipeline" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["pipeline", "files"],
      properties: {
        pipeline: { type: "string", example: "budget" },
        metadata: { type: "string" },
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("files", 50, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          // Resolve at call time since the service may not be available in static context
          const uploadDir = path.resolve(__dirname, "../../../uploads");
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}-${file.originalname}`);
        },
      }),
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { pipeline: string; metadata?: string },
    @Req() req: Request & { adminId?: string },
  ) {
    const result = await this.ingestionService.runPipeline(
      body.pipeline,
      "upload",
    );
    await this.audit.log(req.adminId as string, {
      action: "ingestion.upload",
      targetType: "ingestion_run",
      targetId: result.runId,
      metadata: {
        pipeline: body.pipeline,
        files: files.map((f) => f.originalname),
        size: files.reduce((sum, f) => sum + f.size, 0),
      },
    });
    return {
      uploadedFiles: files.map((f) => f.originalname),
      ...result,
    };
  }

  @Post("stop")
  @RequirePermission("ingestion.run")
  @ApiOperation({ summary: "Stop a running ingestion pipeline" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["pipeline"],
      properties: {
        pipeline: { type: "string", example: "budget" },
      },
    },
  })
  async stop(
    @Body() body: { pipeline: string },
    @Req() req: Request & { adminId?: string },
  ) {
    const result = this.ingestionService.stopPipeline(body.pipeline);
    await this.audit.log(req.adminId as string, {
      action: "ingestion.run.stopped",
      targetType: "ingestion_run",
      targetId: result.runId,
      metadata: { pipeline: body.pipeline },
    });
    return result;
  }

  @Get("active")
  @ApiOperation({ summary: "List currently running pipelines" })
  async active() {
    const types = this.ingestionService.getAvailableTypes();
    return types.map((type) => ({
      pipeline: type,
      running: this.ingestionService.isRunning(type),
    }));
  }

  @Get("status")
  @ApiOperation({ summary: "Get ingestion status" })
  @ApiQuery({ name: "pipeline", required: false, example: "budget" })
  async status(@Query("pipeline") pipeline?: string) {
    return this.ingestionService.getStatus(pipeline);
  }

  @Get("logs/stream")
  @ApiOperation({ summary: "Stream live pipeline logs via SSE" })
  @ApiQuery({ name: "runId", required: true, example: "uuid" })
  async streamLogs(@Query("runId") runId: string, @Res() res: Response) {
    if (!runId) {
      res.status(400).json({ error: "runId is required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const emitter = this.ingestionService.getLogEmitter();

    const listener = (entry: LogEntry) => {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    };

    emitter.subscribe(runId, listener);

    // Send a heartbeat every 15s to keep the connection alive
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15_000);

    // Clean up on client disconnect
    res.on("close", () => {
      clearInterval(heartbeat);
      emitter.unsubscribe(runId, listener);
      res.end();
    });
  }
}
