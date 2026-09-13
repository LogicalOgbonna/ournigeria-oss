import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { keyForBases, type ObjectStore, type PresignPutInput, type PutOptions } from "./object-store";

export interface LocalObjectStoreOptions {
  /** Directory everything lives under. Created on first write. */
  rootDir: string;
  /** Public base the API serves objects from, e.g. http://localhost:3001/api/storage/local */
  publicBaseUrl: string;
  /** Secret the presign key is DERIVED from (never used raw; see `constructor`). */
  secret: string;
}

/** Domain-separation label: a sub-key so the shared app secret never signs two protocols. */
const PRESIGN_KEY_LABEL = "ournigeria/storage/local-presign/v1";
const PRESIGN_MESSAGE_TAG = "local-presign-v1";

export interface LocalPresignParams {
  exp: string;
  size: string;
  type: string;
  sig: string;
}

interface Meta {
  contentType: string;
  cacheControl?: string;
  contentDisposition?: string;
  size: number;
}

const KEY_SEGMENT = /^[A-Za-z0-9._@()+-]+$/;

/**
 * Objects on local disk for development. Bytes live at `<root>/objects/<key>`,
 * headers at `<root>/meta/<key>.json`. `presignPut` returns a URL on the API's
 * own `/storage/local` route carrying an HMAC over (key, type, size, exp), so
 * the dev controller can accept browser PUTs with the same content-type and
 * content-length guarantees a signed S3 URL gives.
 *
 * Never used in production: `resolveStorageConfig` refuses it there.
 */
export class LocalObjectStore implements ObjectStore {
  readonly provider = "local" as const;
  readonly rootDir: string;
  private readonly baseUrl: string;
  private readonly key: Buffer;

  constructor(opts: LocalObjectStoreOptions) {
    this.rootDir = path.resolve(opts.rootDir);
    this.baseUrl = opts.publicBaseUrl.replace(/\/+$/, "");
    if (!opts.secret) throw new Error("LocalObjectStore requires a signing secret");
    // AUTH_SIGNING_SECRET also signs the login handoff; derive a purpose-bound
    // sub-key so a signature minted by one verifier can never satisfy the other.
    this.key = createHmac("sha256", opts.secret).update(PRESIGN_KEY_LABEL).digest();
  }

  /**
   * Keys are `/`-joined segments of a conservative charset; `.`/`..`, empty
   * segments, backslashes and control characters are refused so a key can
   * never resolve outside `rootDir`. Returns the object and meta paths.
   */
  resolveKey(key: string): { object: string; meta: string } {
    if (!isSafeKey(key)) throw new Error(`invalid object key: ${JSON.stringify(key)}`);
    const object = path.join(this.rootDir, "objects", ...key.split("/"));
    const meta = path.join(this.rootDir, "meta", ...key.split("/")) + ".json";
    for (const p of [object, meta]) {
      if (!p.startsWith(this.rootDir + path.sep)) throw new Error(`object key escapes root: ${key}`);
    }
    return { object, meta };
  }

  async presignPut(input: PresignPutInput) {
    this.resolveKey(input.key);
    const exp = String(Math.floor(Date.now() / 1000) + input.expiresInSeconds);
    const size = String(input.size);
    const sig = this.sign(input.key, input.contentType, size, exp);
    const q = new URLSearchParams({ exp, size, type: input.contentType, sig });
    return { url: `${this.baseUrl}/${input.key}?${q.toString()}`, expiresAt: new Date(Number(exp) * 1000) };
  }

  /** True when `params` is an unexpired signature for exactly this key/type/size. */
  verifyPresign(key: string, params: LocalPresignParams, now = Date.now()): boolean {
    if (!isSafeKey(key)) return false;
    const exp = Number(params.exp);
    if (!Number.isFinite(exp) || exp * 1000 < now) return false;
    if (!/^\d+$/.test(params.size)) return false;
    const expected = Buffer.from(this.sign(key, params.type, params.size, params.exp), "hex");
    const given = Buffer.from(params.sig ?? "", "hex");
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  private sign(key: string, contentType: string, size: string, exp: string): string {
    return createHmac("sha256", this.key).update([PRESIGN_MESSAGE_TAG, key, contentType, size, exp].join("\n")).digest("hex");
  }

  async head(key: string) {
    const meta = await this.readMeta(key);
    return meta ? { size: meta.size, contentType: meta.contentType } : null;
  }

  async readMeta(key: string): Promise<Meta | null> {
    const { meta } = this.resolveKey(key);
    try {
      return JSON.parse(await fs.readFile(meta, "utf8")) as Meta;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async get(key: string) {
    const { object } = this.resolveKey(key);
    try {
      return await fs.readFile(object);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") throw new Error(`NoSuchKey: ${key}`);
      throw err;
    }
  }

  async put(key: string, body: Buffer, opts: PutOptions) {
    const { object, meta } = this.resolveKey(key);
    await Promise.all([fs.mkdir(path.dirname(object), { recursive: true }), fs.mkdir(path.dirname(meta), { recursive: true })]);
    const record: Meta = { contentType: opts.contentType, cacheControl: opts.cacheControl, contentDisposition: opts.contentDisposition, size: body.length };
    // Bytes first, meta last, each via tmp+rename: a concurrent GET never sees a
    // partial object and a crash in between leaves nothing `head` would report.
    await writeAtomic(object, body);
    await writeAtomic(meta, JSON.stringify(record));
  }

  async delete(key: string) {
    const { object, meta } = this.resolveKey(key);
    await Promise.all([fs.rm(object, { force: true }), fs.rm(meta, { force: true })]);
  }

  urlFor(key: string) {
    return `${this.baseUrl}/${key}`;
  }

  keyFor(url: string) {
    return keyForBases([this.baseUrl], url);
  }

  urlsFor(key: string) {
    return [`${this.baseUrl}/${key}`];
  }
}

async function writeAtomic(target: string, data: Buffer | string): Promise<void> {
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, target);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => undefined);
    throw err;
  }
}

export function isSafeKey(key: string): boolean {
  if (typeof key !== "string" || key.length === 0 || key.length > 1024) return false;
  const segments = key.split("/");
  return segments.every((s) => s !== "." && s !== ".." && KEY_SEGMENT.test(s));
}
