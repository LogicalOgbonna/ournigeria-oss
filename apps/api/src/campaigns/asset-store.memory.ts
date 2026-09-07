import { keyFromUrl, type ObjectStore, type PresignPutInput, type PutOptions } from "./asset-store.service";

/** Test double: everything in a Map, presigned URLs are fake but well-formed. */
export class MemoryObjectStore implements ObjectStore {
  readonly objects = new Map<string, { body: Buffer; opts: PutOptions }>();
  readonly deleted: string[] = [];
  /** `aliases` = extra public bases the same object may be referenced under (tests for purge). */
  constructor(private readonly baseUrl: string, private readonly aliases: string[] = []) {}

  async presignPut(input: PresignPutInput) {
    return {
      url: `https://upload.test/${input.key}?type=${encodeURIComponent(input.contentType)}`,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    };
  }
  async head(key: string) {
    const o = this.objects.get(key);
    return o ? { size: o.body.length, contentType: o.opts.contentType } : null;
  }
  async get(key: string) {
    const o = this.objects.get(key);
    if (!o) throw new Error(`NoSuchKey: ${key}`);
    return o.body;
  }
  async put(key: string, body: Buffer, opts: PutOptions) {
    this.objects.set(key, { body, opts });
  }
  async delete(key: string) {
    this.objects.delete(key);
    this.deleted.push(key);
  }
  urlFor(key: string) {
    return `${this.baseUrl}/${key}`;
  }
  keyFor(url: string) {
    for (const base of [this.baseUrl, ...this.aliases]) {
      const key = keyFromUrl(base, url);
      if (key) return key;
    }
    return null;
  }

  urlsFor(key: string) {
    return [this.baseUrl, ...this.aliases].map((b) => `${b}/${key}`);
  }
}
