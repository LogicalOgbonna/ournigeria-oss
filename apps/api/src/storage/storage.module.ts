import { Global, Inject, Logger, Module, type DynamicModule, type Provider } from "@nestjs/common";
import { LocalStorageController } from "./local-storage.controller";
import { ObjectStorageService } from "./object-storage.service";
import { resolveStorageConfig, STORAGE_DOMAINS, usesProvider, type StorageDomain } from "./storage.config";

export function objectStoreToken(domain: StorageDomain): string {
  return `OBJECT_STORE:${domain}`;
}

/** Inject the `ObjectStore` bound to a storage domain. */
export function InjectObjectStore(domain: StorageDomain): ParameterDecorator {
  return Inject(objectStoreToken(domain));
}

/**
 * Global: any module may `@InjectObjectStore("images")` without importing.
 * The dev controller is only mounted when a domain resolves to `local`.
 */
@Global()
@Module({})
export class StorageModule {
  static forRoot(env: Record<string, string | undefined> = process.env): DynamicModule {
    const config = resolveStorageConfig(env);
    const usesLocal = usesProvider(config, "local");
    if (usesLocal) new Logger(StorageModule.name).warn(`local object storage enabled: public GET/PUT /api/storage/local mounted, objects under ${config.local?.rootDir}`);
    const domainProviders: Provider[] = STORAGE_DOMAINS.map((domain) => ({
      provide: objectStoreToken(domain),
      useFactory: (registry: ObjectStorageService) => registry.for(domain),
      inject: [ObjectStorageService],
    }));
    return {
      module: StorageModule,
      controllers: usesLocal ? [LocalStorageController] : [],
      providers: [{ provide: ObjectStorageService, useFactory: () => new ObjectStorageService(config) }, ...domainProviders],
      exports: [ObjectStorageService, ...STORAGE_DOMAINS.map(objectStoreToken)],
    };
  }
}
