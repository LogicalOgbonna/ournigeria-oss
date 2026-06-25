import { describe, it, expect, vi } from "vitest";
import { buildPgDumpArgs, AdminBackupService } from "../admin-backup.service";

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
