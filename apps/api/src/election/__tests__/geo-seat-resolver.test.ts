import { describe, it, expect, vi } from "vitest";
import { GeoSeatResolver } from "../geo-seat-resolver";

function fakePrisma(opts: { senByLga?: Record<string, string>; fedByLga?: Record<string, string>; stateByWard?: Record<string, string> } = {}) {
  return {
    senatorialDistrictLga: {
      findFirst: vi.fn(async ({ where }: any) => (opts.senByLga?.[where.lgaCode] ? { senatorialDistrictCode: opts.senByLga[where.lgaCode], senatorialDistrict: { name: `Name(${opts.senByLga[where.lgaCode]})` } } : null)),
    },
    constituencyWard: {
      findFirst: vi.fn(async ({ where }: any) => {
        if (where.constituency?.type === "federal" && where.ward?.lgaCode) {
          const c = opts.fedByLga?.[where.ward.lgaCode]; return c ? { constituencyCode: c, constituency: { name: `Name(${c})` } } : null;
        }
        if (where.constituency?.type === "state" && where.wardCode) {
          const c = opts.stateByWard?.[where.wardCode]; return c ? { constituencyCode: c, constituency: { name: `Name(${c})` } } : null;
        }
        return null;
      }),
    },
  } as any;
}
const R = (p: any) => new GeoSeatResolver(p);

describe("GeoSeatResolver.resolveOne", () => {
  it("president/governor/chairman/councillor from location keys", async () => {
    const r = R(fakePrisma());
    expect(await r.resolveOne("president", "osun", "Osun")).toMatchObject({ column: null, code: null });
    expect(await r.resolveOne("governor", "osun", "Osun")).toMatchObject({ column: "stateCode", code: "osun", label: "Governor of Osun" });
    expect(await r.resolveOne("lga_chairman", "osun", "Osun", "osun_ife")).toMatchObject({ column: "lgaCode", code: "osun_ife" });
    expect(await r.resolveOne("lga_chairman", "osun", "Osun")).toBeNull();
    expect(await r.resolveOne("councillor", "osun", "Osun", "osun_ife", "w1")).toMatchObject({ column: "wardCode", code: "w1" });
  });
  it("senate & hor resolve from LGA; state_assembly from ward", async () => {
    const r = R(fakePrisma({ senByLga: { osun_ife: "sen_osun_central" }, fedByLga: { osun_ife: "fed_osun_x" }, stateByWard: { w1: "state_osun_y" } }));
    expect(await r.resolveOne("senate", "osun", "Osun", "osun_ife")).toMatchObject({ column: "constituencyCode", code: "sen_osun_central", label: "Name(sen_osun_central)" });
    expect(await r.resolveOne("hor", "osun", "Osun", "osun_ife")).toMatchObject({ column: "constituencyCode", code: "fed_osun_x" });
    expect(await r.resolveOne("state_assembly", "osun", "Osun", "osun_ife", "w1")).toMatchObject({ column: "constituencyCode", code: "state_osun_y" });
    expect(await r.resolveOne("senate", "osun", "Osun")).toBeNull();
    expect(await r.resolveOne("hor", "osun", "Osun")).toBeNull();
    expect(await r.resolveOne("state_assembly", "osun", "Osun", "osun_ife")).toBeNull();
  });
  it("returns null when the mapping is missing (data gap)", async () => {
    expect(await R(fakePrisma({})).resolveOne("hor", "osun", "Osun", "osun_ife")).toBeNull();
  });
});
