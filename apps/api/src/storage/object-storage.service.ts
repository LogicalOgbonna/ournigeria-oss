import { Injectable, Logger } from "@nestjs/common";
import { LocalObjectStore } from "./local-object-store";
import type { ObjectStore, StorageProvider } from "./object-store";
import { CloudflareR2ObjectStore } from "./r2-object-store";
import { S3ObjectStore } from "./s3-object-store";
import { usesProvider, type StorageConfig, type StorageDomain } from "./storage.config";

/**
 * Registry of object stores. One instance per provider, shared by every domain
 * that points at it. `ownsUrl` consults EVERY configured provider (not only the
 * ones a domain currently uses) so URLs written before a domain moved from S3
 * to R2 are still recognised as ours.
 */
@Injectable()
export class ObjectStorageService {
  private readonly log = new Logger(ObjectStorageService.name);
  readonly config: StorageConfig;
  private readonly stores = new Map<StorageProvider, ObjectStore>();

  constructor(config: StorageConfig) {
    this.config = config;
    for (const domain of Object.keys(config.domains) as StorageDomain[]) {
      this.log.log(`storage domain ${domain} → ${config.domains[domain]}`);
    }
  }

  for(domain: StorageDomain): ObjectStore {
    return this.provider(this.config.domains[domain]);
  }

  provider(name: StorageProvider): ObjectStore {
    const cached = this.stores.get(name);
    if (cached) return cached;
    const store = this.build(name);
    this.stores.set(name, store);
    return store;
  }

  /** s3/r2 whenever their variables are present (even if no domain uses them); local only when a domain opted in. */
  configuredProviders(): StorageProvider[] {
    const out: StorageProvider[] = [];
    if (this.config.s3) out.push("s3");
    if (this.config.r2) out.push("r2");
    if (this.config.local) out.push("local");
    return out;
  }

  /** True when any configured provider would resolve `url` to a key of ours. */
  ownsUrl(url: string): boolean {
    return this.keyForAny(url) !== null;
  }

  keyForAny(url: string): { provider: StorageProvider; key: string } | null {
    for (const provider of this.configuredProviders()) {
      const key = this.provider(provider).keyFor(url);
      if (key) return { provider, key };
    }
    return null;
  }

  /** The local store when some domain uses it; null otherwise (controller guard). */
  localStore(): LocalObjectStore | null {
    if (!usesProvider(this.config, "local")) return null;
    return this.provider("local") as LocalObjectStore;
  }

  private build(name: StorageProvider): ObjectStore {
    switch (name) {
      case "s3": {
        const s = this.config.s3;
        if (!s) throw new Error('storage provider "s3" is not configured');
        return new S3ObjectStore({ ...s });
      }
      case "r2": {
        const r = this.config.r2;
        if (!r) throw new Error('storage provider "r2" is not configured');
        return new CloudflareR2ObjectStore({ ...r });
      }
      case "local": {
        const l = this.config.local;
        if (!l) throw new Error('storage provider "local" is not configured');
        return new LocalObjectStore({ ...l });
      }
    }
  }
}
