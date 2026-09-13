import { describe, expect, it } from "vitest";
import { LocalStorageController } from "../local-storage.controller";
import { ObjectStorageService } from "../object-storage.service";
import { resolveStorageConfig } from "../storage.config";
import { objectStoreToken, StorageModule } from "../storage.module";

const AWS = { S3_BUCKET: "b", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "k", AWS_SECRET_ACCESS_KEY: "s" };
const R2 = { R2_ACCOUNT_ID: "acct", R2_BUCKET: "r", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_PUBLIC_BASE_URL: "https://assets.test" };

describe("resolveStorageConfig", () => {
  it("defaults every domain to s3 (unchanged production behaviour)", () => {
    const c = resolveStorageConfig({ ...AWS, CDN_BASE_URL: "https://cdn.test/" });
    expect(c.domains).toEqual({ campaign_assets: "s3", images: "s3" });
    expect(c.s3).toMatchObject({ bucket: "b", publicBaseUrl: "https://cdn.test/" });
    expect(c.r2).toBeNull();
  });

  it("routes domains independently: default + per-domain override", () => {
    const c = resolveStorageConfig({ ...AWS, ...R2, STORAGE_PROVIDER: "s3", STORAGE_PROVIDER_CAMPAIGN_ASSETS: "r2" });
    expect(c.domains).toEqual({ campaign_assets: "r2", images: "s3" });
    const c2 = resolveStorageConfig({ ...AWS, ...R2, STORAGE_PROVIDER: "R2 " });
    expect(c2.domains).toEqual({ campaign_assets: "r2", images: "r2" });
  });

  it("fails fast when a selected provider lacks its variables", () => {
    expect(() => resolveStorageConfig({ ...AWS, STORAGE_PROVIDER: "r2" })).toThrow(/"r2" is selected but missing: R2_ACCOUNT_ID, R2_BUCKET/);
    expect(() => resolveStorageConfig({ STORAGE_PROVIDER: "s3" })).toThrow(/"s3" is selected but missing: S3_BUCKET/);
    expect(() => resolveStorageConfig({ ...AWS, STORAGE_PROVIDER: "gcs" })).toThrow(/must be one of s3, r2, local/);
    expect(() => resolveStorageConfig({ ...AWS, STORAGE_PROVIDER_IMAGES: "local" })).toThrow(/AUTH_SIGNING_SECRET/);
  });

  it("local: dev-only, with sensible defaults", () => {
    expect(() => resolveStorageConfig({ ...AWS, STORAGE_PROVIDER: "local", AUTH_SIGNING_SECRET: "x", NODE_ENV: "production" })).toThrow(/cannot be used when NODE_ENV=production/);
    const c = resolveStorageConfig({ ...AWS, STORAGE_PROVIDER: "local", AUTH_SIGNING_SECRET: "x", PORT: "3001" });
    expect(c.local).toMatchObject({ publicBaseUrl: "http://localhost:3001/api/storage/local", secret: "x" });
    expect(c.local!.rootDir.endsWith(".local/storage")).toBe(true);
    const c2 = resolveStorageConfig({ ...AWS, STORAGE_PROVIDER: "local", AUTH_SIGNING_SECRET: "x", LOCAL_STORAGE_DIR: "/tmp/on", LOCAL_STORAGE_PUBLIC_URL: "https://api.dev.test/api/storage/local", LOCAL_STORAGE_ALLOW_REMOTE: "true" });
    expect(c2.local).toMatchObject({ rootDir: "/tmp/on", publicBaseUrl: "https://api.dev.test/api/storage/local" });
  });

  it("local is opt-in by domain: settings are only built when a domain selects it", () => {
    expect(resolveStorageConfig({ ...AWS, AUTH_SIGNING_SECRET: "x" }).local).toBeNull();
    expect(resolveStorageConfig({ ...AWS, AUTH_SIGNING_SECRET: "x", STORAGE_PROVIDER_IMAGES: "local" }).local).not.toBeNull();
  });

  it("refuses to advertise the local route on a non-loopback host unless explicitly allowed", () => {
    const base = { ...AWS, STORAGE_PROVIDER: "local", AUTH_SIGNING_SECRET: "x" };
    expect(() => resolveStorageConfig({ ...base, LOCAL_STORAGE_PUBLIC_URL: "https://api.arinze.online/api/storage/local" })).toThrow(/not a loopback origin; set LOCAL_STORAGE_ALLOW_REMOTE=true/);
    expect(resolveStorageConfig({ ...base, LOCAL_STORAGE_PUBLIC_URL: "https://api.arinze.online/api/storage/local", LOCAL_STORAGE_ALLOW_REMOTE: "true" }).local?.publicBaseUrl).toBe("https://api.arinze.online/api/storage/local");
    for (const ok of ["http://localhost:3001/api/storage/local", "http://127.0.0.1:3001/x", "http://api.localhost/x", "http://[::1]:3001/x"]) {
      expect(resolveStorageConfig({ ...base, LOCAL_STORAGE_PUBLIC_URL: ok }).local?.publicBaseUrl, ok).toBe(ok);
    }
  });

  it("refuses two providers sharing one public base (URL ownership would be ambiguous)", () => {
    expect(() => resolveStorageConfig({ ...AWS, ...R2, CDN_BASE_URL: "https://assets.test/" })).toThrow(/must differ/);
    expect(resolveStorageConfig({ ...AWS, ...R2, CDN_BASE_URL: "https://cdn.test" }).r2).not.toBeNull();
  });
});

describe("StorageModule.forRoot", () => {
  it("mounts the local controller only when a domain uses local, and binds one token per domain", () => {
    expect(StorageModule.forRoot(AWS).controllers).toEqual([]);
    const env = { ...AWS, ...R2, STORAGE_PROVIDER_CAMPAIGN_ASSETS: "r2", STORAGE_PROVIDER_IMAGES: "local", AUTH_SIGNING_SECRET: "x" };
    const mod = StorageModule.forRoot(env);
    expect(mod.controllers).toEqual([LocalStorageController]);
    const registry = new ObjectStorageService(resolveStorageConfig(env));
    const factoryFor = (token: string) => (mod.providers as { provide: unknown; useFactory?: (r: ObjectStorageService) => { provider: string } }[]).find((p) => p.provide === token)!.useFactory!;
    expect(factoryFor(objectStoreToken("campaign_assets"))(registry).provider).toBe("r2");
    expect(factoryFor(objectStoreToken("images"))(registry).provider).toBe("local");
    expect(mod.exports).toEqual(expect.arrayContaining([ObjectStorageService, objectStoreToken("campaign_assets"), objectStoreToken("images")]));
  });
});

describe("ObjectStorageService", () => {
  it("hands each domain its provider and shares one instance per provider", () => {
    const svc = new ObjectStorageService(resolveStorageConfig({ ...AWS, ...R2, STORAGE_PROVIDER_CAMPAIGN_ASSETS: "r2" }));
    expect(svc.for("campaign_assets").provider).toBe("r2");
    expect(svc.for("images").provider).toBe("s3");
    expect(svc.for("images")).toBe(svc.provider("s3"));
    expect(svc.localStore()).toBeNull();
  });

  it("ownsUrl recognises every configured provider, not only the active one", () => {
    const svc = new ObjectStorageService(resolveStorageConfig({ ...AWS, ...R2, CDN_BASE_URL: "https://cdn.test", AUTH_SIGNING_SECRET: "x", STORAGE_PROVIDER_IMAGES: "local" }));
    expect(svc.keyForAny("https://cdn.test/a.webp")).toEqual({ provider: "s3", key: "a.webp" });
    expect(svc.keyForAny("https://b.s3.eu-west-1.amazonaws.com/a.webp")).toEqual({ provider: "s3", key: "a.webp" });
    expect(svc.keyForAny("https://assets.test/a.webp")).toEqual({ provider: "r2", key: "a.webp" });
    expect(svc.keyForAny("http://localhost:3001/api/storage/local/a.webp")).toEqual({ provider: "local", key: "a.webp" });
    expect(svc.ownsUrl("https://evil.test/a.webp")).toBe(false);
    expect(svc.localStore()?.provider).toBe("local");
  });

  it("does not expose the local store when no domain uses it", () => {
    const svc = new ObjectStorageService(resolveStorageConfig({ ...AWS, AUTH_SIGNING_SECRET: "x" }));
    expect(svc.ownsUrl("http://localhost:3001/api/storage/local/a.webp")).toBe(false);
    expect(svc.localStore()).toBeNull();
  });

  it("provider() throws a precise error for a provider that is not configured", () => {
    const svc = new ObjectStorageService(resolveStorageConfig({ ...AWS, AUTH_SIGNING_SECRET: "x" }));
    expect(() => svc.provider("r2")).toThrow(/"r2" is not configured/);
    expect(() => svc.provider("local")).toThrow(/"local" is not configured/);
  });
});
