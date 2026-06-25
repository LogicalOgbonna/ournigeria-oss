import { describe, it, expect, vi } from "vitest";
import { buildPgDumpArgs, AdminBackupService } from "../admin-backup.service";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

vi.mock("node:child_process", () => ({ spawn: vi.fn() }));
// Realistic Upload mock: done() ACTUALLY DRAINS the Body stream to completion
// before resolving — modeling pg_dump backpressure. abort() is exposed for the
// failure path. Without draining, the OS pipe would fill and pg_dump would stall;
// this mock lets the test catch the deadlock if the close-before-done ordering
// ever returns.
// When set, the NEXT Upload instance's done() will REJECT once the body stream
// emits "error" — models an S3 network/throttle failure mid-upload. Reset after
// each consuming test.
let nextUploadDoneRejects = false;
vi.mock("@aws-sdk/lib-storage", () => ({
  Upload: vi.fn().mockImplementation(function (opts: { params: { Body: NodeJS.ReadableStream } }) {
    const body = opts.params.Body;
    const rejectThis = nextUploadDoneRejects;
    nextUploadDoneRejects = false;
    return {
      done: () =>
        new Promise((resolve, reject) => {
          body.on("data", () => {});
          if (rejectThis) {
            // Reject when the body stream errors (real-ish ordering: the source
            // stream fails → the in-flight upload fails).
            body.on("error", () => reject(new Error("S3 upload failed: throttled")));
          } else {
            body.on("end", () => resolve({}));
          }
        }),
      abort: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

import { spawn } from "node:child_process";
import { Upload } from "@aws-sdk/lib-storage";

/** Fake child process: stdout stream, stderr emitter, controllable exit. */
function fakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: Readable;
    stderr: EventEmitter;
    kill: () => void;
  };
  child.stdout = Readable.from(Buffer.from("PGDMP-bytes"));
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  // Real ChildProcess exposes these; the service reads them in finally to decide
  // whether to reap. null means "still running" until the child exits.
  (child as unknown as { exitCode: number | null }).exitCode = null;
  (child as unknown as { signalCode: string | null }).signalCode = null;
  return child;
}

function makeService(overrides: Partial<Record<string, unknown>> = {}) {
  const prisma = {
    backupJob: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    ...overrides,
  };
  const config = {
    getOrThrow: (k: string) =>
      ({
        DATABASE_URL: "postgresql://u:p@host:5432/spending",
        AWS_REGION: "us-east-1",
        AWS_ACCESS_KEY_ID: "x",
        AWS_SECRET_ACCESS_KEY: "y",
        S3_BUCKET: "test-bucket",
      })[k],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = new AdminBackupService(prisma as any, config as any);
  // Prevent the real dump from firing in createBackup tests.
  vi.spyOn(svc, "runBackup").mockResolvedValue(undefined);
  return { svc, prisma };
}

const URL = "postgresql://u:p@host:5432/spending";

describe("buildPgDumpArgs", () => {
  it("FULL dumps everything (no data exclusions)", () => {
    const args = buildPgDumpArgs("FULL", URL);
    expect(args).toContain("--format=custom");
    expect(args).toContain("--no-owner");
    expect(args).toContain("--no-privileges");
    expect(args).toContain(`--dbname=${URL}`);
    expect(args.some((a) => a.startsWith("--exclude-table-data"))).toBe(false);
  });

  it("RELATIONAL excludes chunk + vector table data", () => {
    const args = buildPgDumpArgs("RELATIONAL", URL);
    expect(args).toContain("--exclude-table-data=*_chunks");
    expect(args).toContain("--exclude-table-data=*_vectors");
    expect(args).toContain("--format=custom");
  });
});

describe("AdminBackupService.createBackup", () => {
  it("rejects when an active job already exists", async () => {
    const { svc, prisma } = makeService();
    prisma.backupJob.findFirst.mockResolvedValue({ id: "active" });
    await expect(svc.createBackup("FULL", "admin-1")).rejects.toThrow(/already running/i);
    expect(prisma.backupJob.create).not.toHaveBeenCalled();
  });

  it("creates a PENDING row and fires the dump when idle", async () => {
    const { svc, prisma } = makeService();
    prisma.backupJob.findFirst.mockResolvedValue(null);
    prisma.backupJob.create.mockResolvedValue({ id: "job-1", status: "PENDING", type: "FULL" });
    const job = await svc.createBackup("FULL", "admin-1");
    expect(prisma.backupJob.create).toHaveBeenCalledWith({
      data: { type: "FULL", status: "PENDING", createdByAdminId: "admin-1" },
    });
    expect(svc.runBackup).toHaveBeenCalledWith("job-1");
    expect(job.id).toBe("job-1");
  });
});

describe("AdminBackupService.reapOrphaned", () => {
  it("marks PENDING/RUNNING jobs FAILED", async () => {
    const { svc, prisma } = makeService();
    prisma.backupJob.updateMany.mockResolvedValue({ count: 2 });
    await svc.reapOrphaned();
    expect(prisma.backupJob.updateMany).toHaveBeenCalledWith({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      data: { status: "FAILED", error: "Interrupted by API restart", finishedAt: expect.any(Date) },
    });
  });
});

describe("AdminBackupService.runBackup", () => {
  it("marks COMPLETED on exit code 0 and records s3 key + size", async () => {
    const { svc, prisma } = makeService();
    (svc.runBackup as unknown as { mockRestore?: () => void }).mockRestore?.(); // un-stub
    prisma.backupJob.findUnique.mockResolvedValue({ id: "job-1", type: "FULL" });
    const child = fakeChild();
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);
    // Upload.done resolves; HeadObject size comes from the head mock below.
    vi.spyOn(svc as unknown as { headSize: () => Promise<number> }, "headSize").mockResolvedValue(123);

    // Emit "close" only AFTER stdout is fully drained (modeling real ordering:
    // pg_dump finishes writing → pipe drains → process exits). With the OLD buggy
    // ordering (await close BEFORE upload.done), nothing drains the stream, "end"
    // never fires, and this test would hang/timeout — proving the fix.
    child.stdout.on("end", () => {
      (child as unknown as { exitCode: number }).exitCode = 0;
      child.emit("close", 0);
    });

    const p = svc.runBackup("job-1");
    await p;

    const calls = prisma.backupJob.update.mock.calls.map((c) => c[0].data.status);
    expect(calls).toContain("RUNNING");
    const final = prisma.backupJob.update.mock.calls.at(-1)![0];
    expect(final.data.status).toBe("COMPLETED");
    expect(final.data.s3Key).toBe("db-backups/job-1.dump");
    expect(final.data.sizeBytes).toBe(123n);
    expect(Upload).toHaveBeenCalled();
  });

  it("marks FAILED on non-zero exit with stderr tail and aborts the multipart upload", async () => {
    const { svc, prisma } = makeService();
    (svc.runBackup as unknown as { mockRestore?: () => void }).mockRestore?.();
    prisma.backupJob.findUnique.mockResolvedValue({ id: "job-2", type: "FULL" });
    const child = fakeChild();
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);

    const p = svc.runBackup("job-2");
    setTimeout(() => {
      child.stderr.emit("data", Buffer.from("pg_dump: error: boom"));
      (child as unknown as { exitCode: number }).exitCode = 1;
      child.emit("close", 1);
    }, 0);
    await p;

    const final = prisma.backupJob.update.mock.calls.at(-1)![0];
    expect(final.data.status).toBe("FAILED");
    expect(final.data.error).toMatch(/boom/);
    // The in-progress multipart upload must be aborted (orphaned parts otherwise linger + cost money).
    const uploadInstance = (Upload as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)!
      .value as { abort: ReturnType<typeof vi.fn> };
    expect(uploadInstance.abort).toHaveBeenCalled();
  });

  it("marks FAILED when the child emits 'error' (e.g. pg_dump binary missing)", async () => {
    const { svc, prisma } = makeService();
    (svc.runBackup as unknown as { mockRestore?: () => void }).mockRestore?.();
    prisma.backupJob.findUnique.mockResolvedValue({ id: "job-3", type: "FULL" });
    const child = fakeChild();
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);

    const p = svc.runBackup("job-3");
    setTimeout(() => child.emit("error", new Error("spawn pg_dump ENOENT")), 0);
    await p;

    const final = prisma.backupJob.update.mock.calls.at(-1)![0];
    expect(final.data.status).toBe("FAILED");
    expect(final.data.error).toMatch(/ENOENT/);
    // Still-running child must be reaped in finally.
    expect(child.kill).toHaveBeenCalled();
  });

  it("does NOT crash with an unhandled rejection when the child errors AND upload.done() rejects late", async () => {
    const { svc, prisma } = makeService();
    (svc.runBackup as unknown as { mockRestore?: () => void }).mockRestore?.();
    prisma.backupJob.findUnique.mockResolvedValue({ id: "job-4", type: "FULL" });
    const child = fakeChild();
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);
    // This Upload instance's done() will reject when the body stream errors —
    // modeling an S3 failure mid-stream. With the old code (no `void
    // uploadPromise.catch()`), the child "error" sends control to catch, no one
    // awaits uploadPromise, and its late rejection floats → process crash.
    nextUploadDoneRejects = true;

    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const p = svc.runBackup("job-4");
      // The child errors (closed rejects → jump to catch), and the body stream
      // errors so upload.done() rejects AFTER no one is awaiting it.
      setTimeout(() => {
        child.emit("error", new Error("spawn pg_dump ENOENT"));
        child.stdout.emit("error", new Error("stream broke"));
      }, 0);
      await p;

      // Let any floating rejection surface (it would be reported on a later tick).
      await new Promise((r) => setTimeout(r, 10));
      await Promise.resolve();

      const final = prisma.backupJob.update.mock.calls.at(-1)![0];
      expect(final.data.status).toBe("FAILED");
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
      nextUploadDoneRejects = false;
    }
  });
});

describe("AdminBackupService.deleteBackup", () => {
  it("removes the S3 object, then soft-deletes the row", async () => {
    const { svc, prisma } = makeService();
    prisma.backupJob.findUnique.mockResolvedValue({
      id: "j1",
      deletedAt: null,
      s3Key: "db-backups/j1.dump",
      s3Bucket: "test-bucket",
    });
    const send = vi.fn().mockResolvedValue({});
    (svc as unknown as { s3: { send: typeof send } }).s3.send = send;

    await svc.deleteBackup("j1");

    expect(send).toHaveBeenCalledTimes(1); // DeleteObjectCommand
    expect(prisma.backupJob.update).toHaveBeenCalledWith({
      where: { id: "j1" },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("propagates an S3 delete failure and does NOT soft-delete the row", async () => {
    const { svc, prisma } = makeService();
    prisma.backupJob.findUnique.mockResolvedValue({
      id: "j2",
      deletedAt: null,
      s3Key: "db-backups/j2.dump",
      s3Bucket: "test-bucket",
    });
    (svc as unknown as { s3: { send: ReturnType<typeof vi.fn> } }).s3.send = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error("Access Denied"), { name: "AccessDenied" }),
      );

    await expect(svc.deleteBackup("j2")).rejects.toThrow(/Access Denied/i);
    expect(prisma.backupJob.update).not.toHaveBeenCalled();
  });

  it("is idempotent: an already-deleted row is a no-op (no S3 call, no update)", async () => {
    const { svc, prisma } = makeService();
    prisma.backupJob.findUnique.mockResolvedValue({
      id: "j3",
      deletedAt: new Date(),
      s3Key: "db-backups/j3.dump",
      s3Bucket: "test-bucket",
    });
    const send = vi.fn();
    (svc as unknown as { s3: { send: typeof send } }).s3.send = send;

    await svc.deleteBackup("j3");

    expect(send).not.toHaveBeenCalled();
    expect(prisma.backupJob.update).not.toHaveBeenCalled();
  });
});
