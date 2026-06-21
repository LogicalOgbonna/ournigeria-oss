/**
 * Fetch helpers for the curated-imports admin API. Two variants because the
 * upload endpoints take multipart bodies:
 *  - importsFetch:  JSON GET/POST (the datasets list). Sets Content-Type: json.
 *  - importsUpload: multipart POST. Sends FormData; DOES NOT set Content-Type so
 *    the browser writes the multipart boundary itself.
 * Both surface the API's JSON error message (Nest: { statusCode, message, error }).
 */
const BASE = "/api/admin/imports";

function errorMessage(body: Record<string, unknown>, status: number): string {
  const msg = body.message ?? body.error;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg) return msg;
  return `API error: ${status}`;
}

export async function importsFetch<T>(path = "", opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  return body as T;
}

/** Multipart upload (preview/apply). Field name is "file" to match FileInterceptor. */
export async function importsUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  // No Content-Type header — the browser sets multipart/form-data; boundary=…
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  return body as T;
}

/** import_runs row as returned by GET /admin/imports (camelCased Prisma fields). */
export interface ImportRun {
  id: string;
  dataset: string;
  status: string; // running | done | failed
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  notes: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Dataset {
  name: string;
  label: string;
  description: string;
  autoApprove: boolean;
  latestRun: ImportRun | null;
}

export interface DiffSample {
  kind: "create" | "update";
  label: string;
  detail: string;
}

export interface ImportDiff {
  creates: unknown[];
  updates: unknown[];
  unchangedCount: number;
  sample: DiffSample[];
}

export interface ImportResult {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  errors: { label: string; error: string }[];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
