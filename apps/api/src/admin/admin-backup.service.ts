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

  async runBackup(jobId: string): Promise<void> {
    const job = await this.prisma.backupJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    const key = `${this.prefix}/${jobId}.dump`;
    await this.prisma.backupJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const databaseUrl = this.config.getOrThrow<string>("DATABASE_URL");
    const args = buildPgDumpArgs(job.type as BackupTypeInput, databaseUrl);
    const child = spawn("pg_dump", args);

    let stderrTail = "";
    child.stderr.on("data", (d: Buffer) => {
      stderrTail = (stderrTail + d.toString()).slice(-STDERR_TAIL_BYTES);
    });

    try {
      const upload = new Upload({
        client: this.s3,
        params: { Bucket: this.bucket, Key: key, Body: child.stdout },
      });

      const exitCode: number = await new Promise((resolve, reject) => {
        child.on("error", reject); // e.g. pg_dump binary missing
        child.on("close", resolve);
      });

      if (exitCode !== 0) {
        child.stdout.destroy(); // stop the upload stream
        await upload.done().catch(() => undefined);
        await this.deleteObjectQuiet(key);
        throw new Error(stderrTail.trim() || `pg_dump exited with code ${exitCode}`);
      }

      await upload.done();
      const sizeBytes = await this.headSize(key);
      await this.prisma.backupJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          finishedAt: new Date(),
          s3Bucket: this.bucket,
          s3Key: key,
          sizeBytes: BigInt(sizeBytes),
        },
      });
    } catch (err) {
      await this.deleteObjectQuiet(key);
      await this.prisma.backupJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: (err as Error).message?.slice(0, STDERR_TAIL_BYTES) ?? "Unknown error",
        },
      });
    }
  }

  /** Object size in bytes (own method so tests can stub it). */
  private async headSize(key: string): Promise<number> {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    return res.ContentLength ?? 0;
  }

  private async deleteObjectQuiet(key: string): Promise<void> {
    await this.s3
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => undefined);
  }

  async list() {
    return this.prisma.backupJob.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(id: string) {
    return this.prisma.backupJob.findUnique({ where: { id } });
  }

  async getDownloadUrl(id: string): Promise<string> {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job || job.deletedAt || job.status !== "COMPLETED" || !job.s3Key) {
      throw new Error("Backup not available for download");
    }
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: job.s3Bucket ?? this.bucket, Key: job.s3Key }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );
  }

  async deleteBackup(id: string): Promise<void> {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job || job.deletedAt) return;
    if (job.s3Key) await this.deleteObjectQuiet(job.s3Key);
    await this.prisma.backupJob.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
