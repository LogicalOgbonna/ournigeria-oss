export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function extractError(res: Response, service: string): Promise<ApiError> {
  // Prefer the server's JSON `message` (NestJS HttpException) over bare statusText.
  let detail = res.statusText;
  try {
    const body = await res.clone().json();
    // NestJS HttpException uses `message`; several admin/proposals endpoints use `error`.
    const raw = body?.message ?? body?.error;
    if (raw) {
      detail = Array.isArray(raw) ? raw.join("; ") : String(raw);
    }
  } catch {
    /* non-JSON error body — keep statusText */
  }
  return new ApiError(res.status, `${service} API error: ${res.status} ${detail}`);
}

type Service = { prefix: string; label: string };

function makeClient({ prefix, label }: Service) {
  async function json(path: string, opts?: RequestInit) {
    const res = await fetch(`${prefix}${path}`, {
      ...opts,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...opts?.headers },
    });
    if (!res.ok) throw await extractError(res, label);
    return res.json();
  }
  async function upload(path: string, formData: FormData) {
    const res = await fetch(`${prefix}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw await extractError(res, label);
    return res.json();
  }
  return { json, upload };
}

const admin = makeClient({ prefix: "/api/admin", label: "Admin" });
// Public, unprefixed reads (geo lists, officials search, parties) proxied by the
// Next rewrites. Same error extraction as the admin client, so a Nest `message`
// surfaces verbatim through errorMessage() instead of a bare status code.
const publicApi = makeClient({ prefix: "", label: "Public" });
const socials = makeClient({ prefix: "/api/socials", label: "Socials" });
const ingest = makeClient({ prefix: "/api/ingest", label: "Ingest" });
const proposals = makeClient({ prefix: "/api/proposals", label: "Proposals" });

// Backwards-compatible named exports (do not change ~38 existing call sites).
export const adminFetch = admin.json;
export const adminUpload = admin.upload;
export const socialsFetch = socials.json;
export const ingestFetch = ingest.json;
export const proposalsFetch = proposals.json;
export const publicFetch = publicApi.json;

/**
 * Human-facing text from a thrown API error: drops the
 * `<Service> API error: <status> ` prefix extractError() adds above, and falls
 * back to the status when the server sent nothing useful.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const stripped = err.message.replace(/^\w+ API error: \d+\s*/, "").trim();
    return stripped || `Request failed (${err.status})`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Revert a diff-invertible audit event (POST /api/admin/audit/:seq/revert).
 * Shared by every surface that renders an audit trail — the API decides which
 * permission the reverted action needs, per REVERTIBLE_ACTIONS.
 */
export function revertAuditEvent(seq: number, reason?: string) {
  return adminFetch(`/audit/${seq}/revert`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
