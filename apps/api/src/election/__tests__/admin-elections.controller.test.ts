import { describe, expect, it } from "vitest";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "@ournigeria/access";
import { AdminElectionsController } from "../admin-elections.controller";

describe("AdminElectionsController permissions (D5 split)", () => {
  const reflector = new Reflector();
  const perms = (handler: string) =>
    reflector.get<string[]>(PERMISSION_KEY, (AdminElectionsController.prototype as never)[handler]);

  it("reads accept elections.write or campaigns.review", () => {
    expect(perms("list")).toEqual(["elections.write", "campaigns.review"]);
    expect(perms("get")).toEqual(["elections.write", "campaigns.review"]);
  });

  it("create/patch/delete need elections.write", () => {
    for (const h of ["create", "patch", "remove"]) {
      expect(perms(h), h).toEqual(["elections.write"]);
    }
  });

  it("review verbs and the kill switch need campaigns.review", () => {
    for (const h of ["publish", "unpublish", "conclude", "cancel", "gate"]) {
      expect(perms(h), h).toEqual(["campaigns.review"]);
    }
  });
});
