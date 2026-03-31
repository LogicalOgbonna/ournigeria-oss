/**
 * In-memory settings store — a simple Map<string, string> that decouples
 * the Mastra RAG config from Prisma/NestJS DI.
 *
 * Flow:
 *   1. AdminSettingsService loads DB rows into this store on app startup
 *   2. AdminSettingsService updates this store on every upsert/bulk-upsert
 *   3. RAG config.ts reads from this store (with process.env fallback)
 *   4. On change, RAG config's refreshConfig() is called to rebuild providers
 */

const store = new Map<string, string>();

let _version = 0;
let _onChangeCallback: (() => void) | null = null;

/** Get a setting value. Falls back to process.env, then to the provided default. */
export function getSetting(
  key: string,
  envKey?: string,
  fallback?: string,
): string {
  const val = store.get(key);
  if (val !== undefined) return val;
  if (envKey && process.env[envKey]) return process.env[envKey]!;
  return fallback ?? "";
}

/** Get a numeric setting. */
export function getSettingNumber(
  key: string,
  envKey?: string,
  fallback?: number,
): number {
  const raw = getSetting(key, envKey);
  const num = Number(raw);
  return Number.isFinite(num) ? num : (fallback ?? 0);
}

/** Get a boolean setting. */
export function getSettingBool(
  key: string,
  envKey?: string,
  fallback?: boolean,
): boolean {
  const raw = getSetting(key, envKey);
  if (!raw) return fallback ?? false;
  return raw !== "false" && raw !== "0";
}

/** Set a single value in the store. */
export function setSetting(key: string, value: string): void {
  store.set(key, value);
  _version++;
}

/** Bulk-load settings into the store (used at startup). */
export function loadSettings(entries: [string, string][]): void {
  for (const [k, v] of entries) {
    store.set(k, v);
  }
  _version++;
}

/** Clear all settings (mostly for tests). */
export function clearSettings(): void {
  store.clear();
  _version++;
}

/** Current version — incremented on every write. */
export function getStoreVersion(): number {
  return _version;
}

/** Register a callback invoked after any setting change. */
export function onSettingsChange(cb: () => void): void {
  _onChangeCallback = cb;
}

/** Notify listeners that settings changed. Called by the settings service. */
export function notifySettingsChanged(): void {
  _onChangeCallback?.();
}

/** Get all stored settings (for diagnostics). */
export function getAllSettings(): Map<string, string> {
  return new Map(store);
}
