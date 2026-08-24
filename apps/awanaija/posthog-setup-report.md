<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the OurNigeria landing page (`apps/awanaija`). PostHog is initialized via `instrumentation-client.ts` (the Next.js 15.3+ approach — no provider component needed) and proxied through `/ingest/*` rewrites in `next.config.ts` to prevent ad-blocker interference. User identification fires on Telegram OAuth login. A total of 15 events are instrumented across 7 files, covering every major conversion funnel: CTA engagement, login, donation, civic contributions, and onboarding.

| Event name | Description | File |
|---|---|---|
| `hero_cta_clicked` | User clicks the 'Start Asking Questions' primary CTA button in the hero section. | `src/components/sections/Hero.tsx` |
| `hero_platform_selected` | User selects a platform (web, telegram, or whatsapp) from the hero dropdown. | `src/components/sections/Hero.tsx` |
| `cta_explore_clicked` | User clicks the 'Start Exploring Now' call-to-action button in the bottom CTA section. | `src/components/sections/CallToAction.tsx` |
| `login_method_selected` | User switches between Telegram and WhatsApp login tabs. | `src/components/auth/LandingLoginForm.tsx` |
| `otp_requested` | User submits their phone number to request a WhatsApp OTP code. | `src/components/auth/LandingLoginForm.tsx` |
| `login_completed` | User successfully authenticates via Telegram or WhatsApp OTP. | `src/components/auth/LandingLoginForm.tsx` |
| `donate_page_viewed` | User arrives at the donation page (top of donation funnel). | `src/app/donate/page.tsx` |
| `donate_giveth_clicked` | User clicks the 'Donate via Giveth' external link. | `src/app/donate/page.tsx` |
| `donation_crypto_address_copied` | User copies a crypto wallet address. | `src/app/donate/page.tsx` |
| `donation_share_clicked` | User clicks a social share button on the donation success page. | `src/app/donate/success/ShareButtons.tsx` |
| `proposal_location_confirmed` | User passes the location gate in the identify-official flow. | `src/app/proposals/new/page.tsx` |
| `official_identified` | User successfully submits a new official identification. | `src/app/proposals/new/page.tsx` |
| `official_proposal_submitted` | User submits a field-correction proposal for an existing official. | `src/app/proposals/new/page.tsx` |
| `welcome_modal_opened` | The welcome/onboarding modal is shown to a first-time visitor. | `src/components/civic/WelcomeModal.tsx` |
| `welcome_modal_location_action` | User enables location or picks their state manually from the welcome modal. | `src/components/civic/WelcomeModal.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/207039/dashboard/764265)
- [Login Conversion Funnel](https://eu.posthog.com/project/207039/insights/iSIfishD)
- [Hero CTA & Platform Engagement](https://eu.posthog.com/project/207039/insights/FNsaYzbs)
- [Donation Funnel](https://eu.posthog.com/project/207039/insights/Qb9cQt6u)
- [Civic Contributions Trend](https://eu.posthog.com/project/207039/insights/TfYzi9tU)
- [Onboarding Funnel](https://eu.posthog.com/project/207039/insights/sR0HIAEw)

## Verify before merging

- [ ] Run `pnpm install` from the workspace root to install `posthog-js` (sandbox restrictions prevented automatic installation — it has been added to `apps/awanaija/package.json`).
- [ ] Run a full production build (`pnpm awanaija:build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [x] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` to the deployment build environment so it is inlined at build time.

> [!IMPORTANT]
> `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is a **build-time** value — Next.js inlines `NEXT_PUBLIC_*`
> vars into the client bundle during `next build`, not at runtime. On Vercel it must be set as a
> Production env var **and the project rebuilt from scratch**. A dashboard "Redeploy" that reuses the
> existing build cache will *not* pick up a newly added var — trigger a fresh build (redeploy with
> build cache disabled, or push a commit). If the token is missing at build time, `posthog.init()`
> runs with `undefined` and the SDK no-ops with: "PostHog was initialized without a token."
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the Telegram login handler identifies the user, but any session-restore path (e.g. checking an existing cookie on load) should also call `posthog.identify()` with the known user ID to keep returning sessions attributed correctly.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
