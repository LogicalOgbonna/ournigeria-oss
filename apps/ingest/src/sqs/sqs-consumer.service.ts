import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from "@aws-sdk/client-sqs";
import { PipelineRegistry } from "../pipeline/pipeline.registry";
import { PipelineResult } from "../pipeline/pipeline.types";

const PREFIX_MAP: Record<string, string> = {
  "budgets/": "budget",
  "corruption/": "corruption",
  "govspend/": "govspend",
};

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private running = false;
  private readonly logger = new Logger(SqsConsumerService.name);
  private client!: SQSClient;
  private queueUrl!: string;

  constructor(
    private readonly config: ConfigService,
    private readonly registry: PipelineRegistry,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const queueUrl = this.config.get<string>("SQS_QUEUE_URL");
    if (!queueUrl) {
      this.logger.warn("SQS_QUEUE_URL not set — SQS consumer disabled");
      return;
    }
    this.queueUrl = queueUrl;
    this.client = new SQSClient({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>(
          "AWS_SECRET_ACCESS_KEY",
        ),
      },
    });
    this.running = true;
    this.logger.log("SQS consumer started, polling...");
    this.poll();
  }

  onModuleDestroy() {
    this.running = false;
    this.logger.log("SQS consumer shutting down");
  }

  private async poll() {
    while (this.running) {
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
          }),
        );

        if (!response.Messages?.length) continue;

        await Promise.allSettled(
          response.Messages.map((msg) => this.handleMessage(msg)),
        );
      } catch (err) {
        this.logger.error("SQS poll error:", err);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  private async handleMessage(msg: Message) {
    const body = JSON.parse(msg.Body!);
    const records = body.Records ?? [];

    for (const record of records) {
      const s3Key = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " "),
      );
      const etag = record.s3.object.eTag;

      const pipelineType = this.resolvePipelineType(s3Key);
      if (!pipelineType) continue;

      const pipeline = this.registry.get(pipelineType);
      if (!pipeline) continue;

      const file = pipeline.buildFileFromS3Key(s3Key, etag);
      if (!file) continue;

      const run = await this.prisma.ingestionRun.create({
        data: { pipeline: pipelineType, trigger: "sqs" },
      });

      try {
        const result = await pipeline.processSingleFile(file);
        await this.prisma.ingestionRun.update({
          where: { id: run.id },
          data: {
            ...this.resultFields(result),
            status: "completed",
            completedAt: new Date(),
          },
        });
        this.logger.log(
          `SQS processed: ${s3Key} (${result.processedFiles} processed, ${result.skippedFiles} skipped)`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`SQS processing failed: ${s3Key}`, errMsg);
        await this.prisma.ingestionRun.update({
          where: { id: run.id },
          data: { status: "failed", completedAt: new Date(), errorMsg: errMsg },
        });
        throw err; // Let message retry via SQS visibility timeout
      }
    }

    // All records in the message processed — delete from queue
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: msg.ReceiptHandle!,
      }),
    );
  }

  private resolvePipelineType(key: string): string | null {
    for (const [prefix, type] of Object.entries(PREFIX_MAP)) {
      if (key.startsWith(prefix)) return type;
    }
    return null;
  }

  private resultFields(result: PipelineResult) {
    return {
      totalFiles: result.totalFiles,
      processedFiles: result.processedFiles,
      skippedFiles: result.skippedFiles,
      errorFiles: result.errorFiles,
      totalChunks: result.totalChunks,
      durationMs: result.durationMs,
    };
  }
}
