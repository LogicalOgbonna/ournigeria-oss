import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { execFileSync } from "child_process";
import { readFileSync, readdirSync, statSync, cpSync, rmSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join, relative, sep } from "path";

export function contentTypeFor(key: string): string {
  if (key.endsWith(".html")) return "text/html; charset=utf-8";
  if (key.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (key.endsWith(".tar.gz")) return "application/gzip";
  return "application/octet-stream";
}

export function collectFiles(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...collectFiles(abs, base));
    else out.push(relative(base, abs).split(sep).join("/"));
  }
  return out;
}

export function commitMessageFor(date: string): string {
  return `chore: knowledge bundle ${date}`;
}

export function hasChanges(repoDir: string): boolean {
  const out = execFileSync("git", ["status", "--porcelain"], { cwd: repoDir }).toString().trim();
  return out.length > 0;
}

@Injectable()
export class OkfPublishService {
  private readonly log = new Logger(OkfPublishService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  /**
   * Upload to okf/staging/<runId>/, swap into okf/latest/, then clear staging.
   * The bundle dir (markdown + viz.html) plus the standalone tarball ship as
   * okf/latest/bundle.tar.gz.
   */
  async publishToS3(outDir: string, tarPath: string, runId: string): Promise<void> {
    const staging = `okf/staging/${runId}`;
    const files = [...collectFiles(outDir).map((rel) => ({ rel, abs: join(outDir, rel) })), { rel: "bundle.tar.gz", abs: tarPath }];
    const cacheFor = (rel: string) =>
      rel.endsWith(".md") || rel.endsWith(".html") ? "public, max-age=300" : "public, max-age=3600";

    for (const { rel, abs } of files) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `${staging}/${rel}`,
          Body: readFileSync(abs),
          ContentType: contentTypeFor(rel),
          CacheControl: cacheFor(rel),
        }),
      );
    }
    await this.clearPrefix("okf/latest/");
    for (const { rel } of files) {
      await this.s3.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `/${this.bucket}/${staging}/${rel}`,
          Key: `okf/latest/${rel}`,
          ContentType: contentTypeFor(rel),
          MetadataDirective: "REPLACE",
          CacheControl: cacheFor(rel),
        }),
      );
    }
    await this.clearPrefix(`${staging}/`);
    this.log.log(`published ${files.length} files to okf/latest/`);
  }

  private async clearPrefix(prefix: string): Promise<void> {
    let token: string | undefined;
    do {
      const list = await this.s3.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: token }),
      );
      const objs = (list.Contents ?? []).map((o) => ({ Key: o.Key as string }));
      if (objs.length) await this.s3.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objs } }));
      token = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (token);
  }

  /** Clone the mirror, replace its content with outDir, commit + push if changed. */
  async publishToGit(outDir: string, date: string): Promise<void> {
    const repo = this.config.get<string>("OKF_GIT_REPO"); // e.g. github.com/ournigeria/ournigeria-knowledge
    const token = this.config.get<string>("OKF_GIT_TOKEN");
    if (!repo || !token) {
      this.log.warn("OKF_GIT_REPO/TOKEN unset — skipping git mirror");
      return;
    }
    const work = mkdtempSync(join(tmpdir(), "okf-mirror-"));
    const url = `https://x-access-token:${token}@${repo}.git`;
    try {
      execFileSync("git", ["clone", "--depth", "1", url, work], { stdio: "inherit" });
      for (const name of readdirSync(work)) {
        if (name === ".git") continue;
        rmSync(join(work, name), { recursive: true, force: true });
      }
      cpSync(outDir, work, { recursive: true });
      execFileSync("git", ["add", "-A"], { cwd: work });
      if (!hasChanges(work)) {
        this.log.log("git mirror: no changes");
        return;
      }
      execFileSync(
        "git",
        ["-c", "user.email=bot@ournigeria.ng", "-c", "user.name=OurNigeria Bot", "commit", "-m", commitMessageFor(date)],
        { cwd: work },
      );
      execFileSync("git", ["push", "origin", "HEAD"], { cwd: work, stdio: "inherit" });
      this.log.log("git mirror: pushed");
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }
}
