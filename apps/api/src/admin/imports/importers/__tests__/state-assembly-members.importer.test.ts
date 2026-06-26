import { test, expect } from "vitest";
import { stateAssemblyMembersImporter as imp } from "../state-assembly-members.importer";

const dataset = {
  kano: {
    coverage: "full",
    primary_source: "https://wiki",
    members: [
      {
        constituency_code: "state_kano_ajingi",
        constituency_name: "Ajingi",
        name: "Abdullahi Yusuf",
        party: "APC",
        gender: "male",
        leadership_role: null,
        returning: false,
        image_url: null,
        confidence: "high",
        sources: ["a", "b"],
        profile: null,
      },
    ],
  },
};

function prismaWith(active: any[]) {
  return { $queryRawUnsafe: async (_sql: string) => active } as any;
}

test("seat with a different active holder → 1 create + 1 correction(downgrade)", async () => {
  const diff = await imp.diff(dataset, prismaWith([
    { id: "pos-1", official_id: "off-1", name: "Wrong Person", constituency_code: "state_kano_ajingi", state_code: "kano" },
  ]));
  expect(diff.creates).toHaveLength(1);
  expect(diff.creates[0].targetTable).toBe("assembly_member");
  expect(diff.updates).toHaveLength(1);
  expect(diff.updates[0].targetField).toBe("status");
  expect(diff.updates[0].proposedValue).toBe("contested");
  expect(diff.updates[0].targetPk).toBe("pos-1");
});

test("seat already held by the same person → unchanged, no specs", async () => {
  const diff = await imp.diff(dataset, prismaWith([
    { id: "pos-1", official_id: "off-1", name: "Abdullahi Yusuf", constituency_code: "state_kano_ajingi", state_code: "kano" },
  ]));
  expect(diff.creates).toHaveLength(0);
  expect(diff.updates).toHaveLength(0);
  expect(diff.unchangedCount).toBe(1);
});

test("low-confidence member → REVIEW only (no specs)", async () => {
  const d2 = JSON.parse(JSON.stringify(dataset));
  d2.kano.members[0].confidence = "low";
  const diff = await imp.diff(d2, prismaWith([]));
  expect(diff.creates).toHaveLength(0);
  expect(diff.sample.some((s) => s.label.startsWith("REVIEW"))).toBe(true);
});
