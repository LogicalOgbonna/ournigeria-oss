import posthog from "posthog-js";

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!posthogProjectToken || !posthogHost) {
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      !posthogProjectToken
        ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
        : "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured",
    );
  }
} else {
  posthog.init(posthogProjectToken, {
    api_host: "/ingest",
    ui_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Real-user Core Web Vitals (LCP/FCP/CLS/INP/TTFB) per page. CrUX has no field data
    // for this site (below its traffic threshold), so this is our only field-CWV source.
    capture_performance: { web_vitals: true },
    debug: process.env.NODE_ENV === "development",
    // Privacy: the login + proposal flows have phone/OTP and personal fields.
    // Mask every input in session replay so we never record what users type.
    session_recording: {
      maskAllInputs: true,
    },
  });
}

// Returning-visitor attribution. If a valid session cookie is already present on
// load, identify with the canonical DB user id so returning users aren't counted
// as anonymous/new — otherwise retention metrics are wrong. Runs once per load;
// anonymous visitors get a 401 and stay anonymous.
if (posthogProjectToken && posthogHost && typeof window !== "undefined") {
  fetch("/api/auth/profile", { credentials: "include", cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((profile) => {
      if (profile?.id) posthog.identify(profile.id);
    })
    .catch(() => {});
}
