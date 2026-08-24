// Integration check for Task 4: identify() must store a humanized displayValue
// (not raw role/scope codes) in the proposal's proposedValue JSON.
//
// Run: cd apps/api && npx tsx scripts/proposal-displayvalue-check.tsx
import assert from "node:assert";

process.env.DATABASE_URL ??= "postgresql://spending:spending@localhost:5432/spending";

async function main() {
  const { PrismaService } = await import("@ournigeria/database");
  const { ProposalsService } = await import("../src/proposals/proposals.service.js");

  const prisma = new PrismaService();
  await prisma.$connect();

  // Minimal no-op stubs for constructor deps not exercised by identify()'s
  // "empty seat -> create canonical official" branch.
  const imageStorageStub: any = {};
  const officialsServiceStub: any = {};
  const notifierStub: any = { notifyNewProposal: async () => {} };

  const svc = new ProposalsService(prisma as any, imageStorageStub, officialsServiceStub, notifierStub);

  const seeded: { propId?: string } = {};
  const testPhone = `+234000${String(Date.now()).slice(-7)}`;

  try {
    // Any canonical (unreviewed) mha seat works: our fabricated name won't match
    // existing candidates, so identify() takes the "competing candidate" branch —
    // no new official/position is created, only a new dataProposal row.
    const con = await prisma.$queryRawUnsafe<any[]>(
      `SELECT op.constituency_code AS code, c.name AS cname, s.name AS sname
       FROM official_positions op
       JOIN nigerian_constituencies c ON c.code = op.constituency_code
       JOIN nigerian_states s ON s.code = c.state_code
       WHERE op.role='mha' AND op.review_status='unreviewed'
       LIMIT 1`,
    );
    assert(con.length > 0, "no unreviewed mha canonical position found to seed a test proposal");
    const { code: conCode, cname, sname } = con[0];

    const res: any = await svc.identify({
      proposerPhone: testPhone,
      proposerIp: null,
      trust: "verified",
      name: "DVTEST Ada Obi",
      role: "mha",
      partyAcronym: "APC",
      constituencyCode: conCode,
    } as any);

    seeded.propId = res.id;

    const prop = await prisma.dataProposal.findUnique({ where: { id: res.id } });
    assert(prop, "proposal not found after identify()");
    const dv = (prop!.proposedValue as any).displayValue as string;

    assert(!/\bmha\b/.test(dv), `raw role code leaked: ${dv}`);
    assert(!dv.includes(conCode), `raw scope code leaked: ${dv}`);
    assert(
      dv.includes("State Assembly Member") && dv.includes(`${cname}, ${sname}`),
      `not humanized: ${dv}`,
    );

    console.log("proposal-displayvalue-check OK ::", dv);
  } finally {
    if (seeded.propId) {
      await prisma.dataProposal.deleteMany({ where: { id: seeded.propId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
