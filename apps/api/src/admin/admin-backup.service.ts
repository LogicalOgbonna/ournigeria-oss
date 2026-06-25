import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { spawn } from "node:child_process";
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaService } from "@ournigeria/database";

const DOWNLOAD_URL_TTL_SECONDS = 6 * 60 * 60;
const STDERR_TAIL_BYTES = 4096;

export type BackupTypeInput = "FULL" | "RELATIONAL";

/** Build pg_dump CLI args. Pure — unit tested. */
export function buildPgDumpArgs(type: BackupTypeInput, databaseUrl: string): string[] {
  const args = [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    `--dbname=${databaseUrl}`,
  ];
  if (type === "RELATIONAL") {
    // Exclude DATA of vector tables (schema is still dumped so restores into a complete schema).
    args.push("--exclude-table-data=*_chunks", "--exclude-table-data=*_vectors");
  }
  return args;
}

@Injectable()
export class AdminBackupService implements OnModuleInit {
  private readonly logger = new Logger(AdminBackupService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly prefix = "db-backups";

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  async onModuleInit() {
    await this.reapOrphaned();
  }

  /** Any job left RUNNING/PENDING was killed by a restart/deploy — fail it. */
  async reapOrphaned() {
    const { count } = await this.prisma.backupJob.updateMany({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      data: {
        status: "FAILED",
        error: "Interrupted by API restart",
        finishedAt: new Date(),
      },
    });
    if (count > 0) this.logger.warn(`Reaped ${count} orphaned backup job(s)`);
  }

  async createBackup(type: BackupTypeInput, adminId: string | undefined) {
    const active = await this.prisma.backupJob.findFirst({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      select: { id: true },
    });
    if (active) {
      throw new Error("A backup is already running");
    }
    const job = await this.prisma.backupJob.create({
      data: { type, status: "PENDING", createdByAdminId: adminId },
    });
    // Fire-and-forget; do not await. Errors are captured inside runBackup.
    void this.runBackup(job.id).catch((e) =>
      this.logger.error(`runBackup ${job.id} crashed: ${String(e)}`),
    );
    return job;
  }

  async runBackup(_jobId: string): Promise<void> {
    // Implemented in Task 4.
  }
}
