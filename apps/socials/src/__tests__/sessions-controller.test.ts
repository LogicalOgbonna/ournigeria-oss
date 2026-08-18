import { describe, it, expect, vi } from "vitest";
import { SessionsController } from "../platforms/twitter/controllers/sessions.controller.js";
import type { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";

function makeController() {
  const saveCapture = vi.fn(async () => ({ id: "s1", userName: "botA", path: "SearchTimeline" }));
  const healthFor = vi.fn(async () => [{ userName: "botA", needsRelogin: false }]);
  const repo = { saveCapture, healthFor } as unknown as BotSessionRepo;
  return { controller: new SessionsController(repo), saveCapture, healthFor };
}

describe("SessionsController", () => {
  it("ingest passes createTweetOpHash through to saveCapture", async () => {
    const { controller, saveCapture } = makeController();
    await controller.ingest({
      userName: "botA",
      cookie: "ct0=abc",
      csrfToken: "abc",
      authorization: "Bearer x",
      xClientTransactionId: "tx",
      xClientUuid: "uuid",
      createTweetOpHash: "WRITE1",
    } as never);
    expect(saveCapture).toHaveBeenCalledOnce();
    expect(saveCapture.mock.calls[0][0].createTweetOpHash).toBe("WRITE1");
    expect(saveCapture.mock.calls[0][0].path).toBe("SearchTimeline");
  });

  it("health parses the handles query and returns the repo map", async () => {
    const { controller, healthFor } = makeController();
    const out = await controller.health("botA,botB");
    expect(healthFor).toHaveBeenCalledWith(["botA", "botB"]);
    expect(out).toEqual([{ userName: "botA", needsRelogin: false }]);
  });

  it("health with no query passes undefined (all sessions)", async () => {
    const { controller, healthFor } = makeController();
    await controller.health(undefined);
    expect(healthFor).toHaveBeenCalledWith(undefined);
  });
});
