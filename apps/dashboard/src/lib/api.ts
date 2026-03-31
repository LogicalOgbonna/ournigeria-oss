import { ADMIN_COOKIE } from "./constants";

function getAdminToken(): string {
  if (typeof document === "undefined") return "";
  // Cookie is httpOnly, so we can't read it from JS.
  // The browser sends it automatically via the Next.js rewrite proxy.
  // We also read from a meta tag set during SSR if needed.
  return "";
}

export async function adminFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function adminUpload(path: string, formData: FormData) {
  const res = await fetch(`/api/admin${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function socialsFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/socials${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Socials API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function ingestFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/ingest${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Ingest API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
