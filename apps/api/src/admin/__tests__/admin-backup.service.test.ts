import { describe, it, expect, vi } from "vitest";
import { buildPgDumpArgs, AdminBackupService } from "../admin-backup.service";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

vi.mock("node:child_process", () => ({ spawn: vi.fn() }));
vi.mock("@aws-sdk/lib-storage", () => ({
  Upload: vi.fn().mockImplementation(function () {
    return { done: vi.fn().mockResolvedValue({}) };
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

    const p = svc.runBackup("job-1");
    // Emit after the awaited DB calls have resolved and the close listener is attached.
    setTimeout(() => child.emit("close", 0), 0);
    await p;

    const calls = prisma.backupJob.update.mock.calls.map((c) => c[0].data.status);
    expect(calls).toContain("RUNNING");
    const final = prisma.backupJob.update.mock.calls.at(-1)![0];
    expect(final.data.status).toBe("COMPLETED");
    expect(final.data.s3Key).toBe("db-backups/job-1.dump");
    expect(final.data.sizeBytes).toBe(123n);
    expect(Upload).toHaveBeenCalled();
  });

  it("marks FAILED on non-zero exit with stderr tail", async () => {
    const { svc, prisma } = makeService();
    (svc.runBackup as unknown as { mockRestore?: () => void }).mockRestore?.();
    prisma.backupJob.findUnique.mockResolvedValue({ id: "job-2", type: "FULL" });
    const child = fakeChild();
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);

    const p = svc.runBackup("job-2");
    setTimeout(() => {
      child.stderr.emit("data", Buffer.from("pg_dump: error: boom"));
      child.emit("close", 1);
    }, 0);
    await p;

    const final = prisma.backupJob.update.mock.calls.at(-1)![0];
    expect(final.data.status).toBe("FAILED");
    expect(final.data.error).toMatch(/boom/);
  });
});
