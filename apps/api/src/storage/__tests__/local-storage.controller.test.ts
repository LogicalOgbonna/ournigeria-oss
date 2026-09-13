import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStorageController } from "../local-storage.controller";
import { ObjectStorageService } from "../object-storage.service";
import { resolveStorageConfig } from "../storage.config";

const AWS = { S3_BUCKET: "b", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "k", AWS_SECRET_ACCESS_KEY: "s" };

/** Express-shaped request: a readable body plus headers/query/params. */
function req(body: Buffer, headers: Record<string, string>, query: Record<string, string>, key: string) {
  const r = Readable.from([body]) as unknown as Record<string, unknown>;
  r.headers = headers;
  r.query = query;
  r.params = { path: key.split("/") };
  return r as never;
}
function res() {
  const headers: Record<string, string> = {};
  const r = {
    code: 0,
    body: undefined as Buffer | undefined,
    headers,
    status(c: number) {
      r.code = c;
      return r;
    },
    send(b?: Buffer) {
      r.body = b;
      if (!r.code) r.code = 200;
    },
    setHeader(k: string, v: string) {
      headers[k] = v;
    },
  };
  return r;
}
const status = (p: Promise<unknown>) => p.then(() => 0, (e: { getStatus?: () => number }) => e.getStatus?.() ?? -1);

describe("LocalStorageController", () => {
  let root: string;
  let svc: ObjectStorageService;
  let ctrl: LocalStorageController;
  let key: string;
  let params: Record<string, string>;
  const body = Buffer.from("png-bytes");

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "on-ctrl-"));
    svc = new ObjectStorageService(resolveStorageConfig({ ...AWS, STORAGE_PROVIDER: "local", AUTH_SIGNING_SECRET: "x", LOCAL_STORAGE_DIR: root }));
    ctrl = new LocalStorageController(svc);
    key = "staging/c1/u1";
    const p = await svc.localStore()!.presignPut({ key, contentType: "image/png", size: body.length, expiresInSeconds: 60 });
    params = Object.fromEntries(new URL(p.url).searchParams);
  });
  afterEach(() => rm(root, { recursive: true, force: true }));

  it("accepts a correctly presigned PUT, then serves a committed object with its headers and CORP cross-origin", async () => {
    const r1 = res();
    await ctrl.put(req(body, { "content-type": "image/png", "content-length": String(body.length) }, params, key), r1 as never);
    expect(r1.code).toBe(200);
    expect(await svc.localStore()!.head(key)).toEqual({ size: body.length, contentType: "image/png" });

    // Committed objects are served; staged ones are not (see below).
    await svc.localStore()!.put("election/2094/x/poster-abc.webp", body, { contentType: "image/webp", cacheControl: "public, max-age=1" });
    const r2 = res();
    await ctrl.get(req(Buffer.alloc(0), {}, {}, "election/2094/x/poster-abc.webp"), r2 as never);
    expect(r2.code).toBe(200);
    expect(r2.body?.equals(body)).toBe(true);
    expect(r2.headers).toMatchObject({ "Content-Type": "image/webp", "Cache-Control": "public, max-age=1", "Cross-Origin-Resource-Policy": "cross-origin" });
  });

  it("never serves staged (unvalidated) objects over HTTP and 404s unknown keys", async () => {
    await svc.localStore()!.put(key, body, { contentType: "image/png" });
    expect(await status(ctrl.get(req(Buffer.alloc(0), {}, {}, key), res() as never))).toBe(404);
    expect(await status(ctrl.get(req(Buffer.alloc(0), {}, {}, "election/nope.webp"), res() as never))).toBe(404);
  });

  it("rejects: forged/expired signature (403), wrong content-type (400), content-length mismatch (400), oversize body (413), short body (400), unsafe key (400)", async () => {
    const ok = { "content-type": "image/png", "content-length": String(body.length) };
    const flipped = (params.sig[0] === "0" ? "1" : "0") + params.sig.slice(1);
    expect(await status(ctrl.put(req(body, ok, { ...params, sig: flipped }, key), res() as never))).toBe(403);
    expect(await status(ctrl.put(req(body, ok, { ...params, exp: "1" }, key), res() as never))).toBe(403);
    expect(await status(ctrl.put(req(body, { ...ok, "content-type": "image/jpeg" }, params, key), res() as never))).toBe(400);
    expect(await status(ctrl.put(req(body, { ...ok, "content-length": "1" }, params, key), res() as never))).toBe(400);
    expect(await status(ctrl.put(req(Buffer.concat([body, body]), ok, params, key), res() as never))).toBe(413);
    expect(await status(ctrl.put(req(body.subarray(0, 3), ok, params, key), res() as never))).toBe(400);
    expect(await status(ctrl.put(req(body, ok, params, "../etc/passwd"), res() as never))).toBe(400);
    expect(await svc.localStore()!.head(key)).toBeNull();
  });

  it("refuses a body the API's own parsers already drained instead of hanging", async () => {
    const r = req(body, { "content-type": "image/png", "content-length": String(body.length) }, params, key) as unknown as Readable;
    await new Promise<void>((resolve) => r.on("data", () => undefined).on("end", resolve));
    expect(await status(ctrl.put(r as never, res() as never))).toBe(400);
  });

  it("404s everything when no storage domain uses local", async () => {
    const none = new LocalStorageController(new ObjectStorageService(resolveStorageConfig({ ...AWS, AUTH_SIGNING_SECRET: "x" })));
    expect(await status(none.get(req(Buffer.alloc(0), {}, {}, "a.png"), res() as never))).toBe(404);
    expect(await status(none.put(req(body, {}, params, key), res() as never))).toBe(404);
  });
});
