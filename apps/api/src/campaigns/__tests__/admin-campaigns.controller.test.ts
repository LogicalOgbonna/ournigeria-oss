import { describe, expect, it } from "vitest";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "@ournigeria/access";
import { AdminCampaignsController } from "../admin-campaigns.controller";

describe("AdminCampaignsController permissions", () => {
  const reflector = new Reflector();
  const perms = (handler: string) =>
    reflector.get<string[]>(PERMISSION_KEY, (AdminCampaignsController.prototype as never)[handler]);

  it("reads need campaigns.read, writes need campaigns.write, review verbs need campaigns.review", () => {
    expect(perms("list")).toEqual(["campaigns.read"]);
    expect(perms("get")).toEqual(["campaigns.read"]);
    expect(perms("create")).toEqual(["campaigns.write"]);
    expect(perms("patch")).toEqual(["campaigns.write"]);
    expect(perms("submit")).toEqual(["campaigns.write"]);
    expect(perms("order")).toEqual(["campaigns.write"]);
    expect(perms("conclude")).toEqual(["campaigns.write"]);
    for (const h of ["queue", "approve", "requestChanges", "unpublish", "withdraw", "dissolve"]) {
      expect(perms(h), h).toEqual(["campaigns.review"]);
    }
  });

  it("the council catalog reads with campaigns.read and writes with campaigns.write", () => {
    expect(perms("listRoles")).toEqual(["campaigns.read"]);
    for (const h of ["createRole", "patchRole", "deleteRole", "addMember", "patchMember", "endMember", "removeMember"]) {
      expect(perms(h), h).toEqual(["campaigns.write"]);
    }
  });

  it("asset routes: uploads/media/documents/council photo need campaigns.write, purge needs campaigns.review", () => {
    for (const h of ["presign", "commitMedia", "patchMedia", "deleteMedia", "putDocument", "deleteDocument", "councilPhoto"]) {
      expect(perms(h), h).toEqual(["campaigns.write"]);
    }
    expect(perms("purge")).toEqual(["campaigns.review"]);
  });
});
