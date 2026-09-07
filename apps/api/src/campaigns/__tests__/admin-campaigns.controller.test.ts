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
});
