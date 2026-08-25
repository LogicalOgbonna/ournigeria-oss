export const ADMIN_COOKIE = "on_admin_session";

// Opaque server-stored admin session tokens (OWASP A07 remediation, api commit
// e2592912). Must stay in sync with ADMIN_SESSION_PREFIX in the api's
// admin-auth.service.ts.
export const ADMIN_SESSION_PREFIX = "ons_";
