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
const socials = makeClient({ prefix: "/api/socials", label: "Socials" });
const ingest = makeClient({ prefix: "/api/ingest", label: "Ingest" });
const proposals = makeClient({ prefix: "/api/proposals", label: "Proposals" });

// Backwards-compatible named exports (do not change ~38 existing call sites).
export const adminFetch = admin.json;
export const adminUpload = admin.upload;
export const socialsFetch = socials.json;
export const ingestFetch = ingest.json;
export const proposalsFetch = proposals.json;
