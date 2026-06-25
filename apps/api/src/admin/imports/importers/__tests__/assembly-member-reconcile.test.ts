import { test, expect } from "vitest";
import { decideSeat } from "../lib/assembly-member-reconcile";

const member = (over = {}) => ({
  constituency_code: "state_kano_ajingi", name: "Abdullahi Yusuf", party: "APC",
  gender: "male", leadership_role: null, returning: false, image_url: null,
  confidence: "high", sources: ["a", "b"], profile: null, ...over,
});

test("no active holder → install (create), no downgrade", () => {
  const d = decideSeat(member(), null);
  expect(d.action).toBe("install");
  expect(d.downgradePositionId).toBeNull();
});

test("active holder is a DIFFERENT person → install + downgrade", () => {
  const d = decideSeat(member(), { id: "pos-1", official_id: "off-1", name: "Wrong Person" });
  expect(d.action).toBe("install");
  expect(d.downgradePositionId).toBe("pos-1");
});

test("active holder IS the same person (fuzzy) → unchanged", () => {
  const d = decideSeat(member({ name: "Abdullahi Yusufu" }), { id: "pos-1", official_id: "off-1", name: "Abdullahi Yusuf" });
  expect(d.action).toBe("unchanged");
});

test("low confidence → review (never auto-applied)", () => {
  const d = decideSeat(member({ confidence: "low" }), { id: "pos-1", official_id: "off-1", name: "Wrong Person" });
  expect(d.action).toBe("review");
});

test("null name (unsourced seat) → review", () => {
  const d = decideSeat(member({ name: null }), null);
  expect(d.action).toBe("review");
});

test("medium confidence with a different live holder → install + downgrade (not gated to review)", () => {
  const d = decideSeat(member({ confidence: "medium" }), { id: "pos-2", official_id: "off-2", name: "Wrong Person" });
  expect(d.action).toBe("install");
  expect(d.downgradePositionId).toBe("pos-2");
});
