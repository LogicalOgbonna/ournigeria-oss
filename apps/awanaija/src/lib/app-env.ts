/**
 * Which deployment this process is: `prod` (ournigeria.ng, the `prod` branch),
 * `staging` (the `main` branch's Vercel preview deployment — and any other
 * preview, which is exactly what we want: feature branches get staging gating),
 * or `dev` (local `pnpm awanaija:dev`).
 *
 * Derived from VERCEL_ENV, the same signal `robots.ts` and `constants.ts`
 * already trust (it is set on every Vercel deployment and is an Nx cache
 * input). `NEXT_PUBLIC_APP_ENV` is an explicit override for anywhere else —
 * e.g. forcing `staging` locally to test a staging-only feature gate.
 *
 * The election gate no longer reads this (it moved to first-class election
 * rows — see `election-gate.ts`; staging rehearsal = staging DB rows). Kept
 * as the canonical deployment-environment answer for anything else.
 */
export type AppEnv = "dev" | "staging" | "prod";

export function appEnv(): AppEnv {
  const explicit = process.env.NEXT_PUBLIC_APP_ENV;
  if (explicit === "dev" || explicit === "staging" || explicit === "prod") return explicit;
  const vercel = process.env.VERCEL_ENV;
  if (vercel === "production") return "prod";
  if (vercel === "preview") return "staging";
  return "dev";
}
