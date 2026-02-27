const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "admin";

export async function adminFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function ingestFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/ingest${path}`, {
    ...opts,
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
