This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## TODO

- [ ] Create a Google Drive folder to house budget documents
  - Create a **public-facing** folder (e.g. `budget_uploads`) where users can drop budget documents (PDF, XLSX)
  - Create three **private** folders for pipeline state management:
    - `ingesting_budgets` — files currently being processed
    - `ingested_budgets` — files that were successfully ingested
    - `ingestion_failed` — files that failed during ingestion
  - Set up a **cron job** that periodically scans the public folder:
    1. For each new file, compute the SHA-256 hash and check the `ingested_documents` table
    2. If already ingested, skip it and append `[already-ingested]` to the filename in the public folder
    3. If not ingested, move the file to `ingesting_budgets` and begin the ingestion pipeline
    4. On success, move the file to `ingested_budgets`
    5. On failure, move the file to `ingestion_failed` for manual review
- [ ] Create a connection that syncs and ingests budget documents from the Google Drive folder
- [ ] User-selectable tools with automatic agent routing
  - Add a **tool selector** in the UI (user dashboard) that lets users explicitly choose which tool to use for their query
  - If the user selects a tool, the backend uses that specific tool and its corresponding agent workflow
  - If the user does **not** select a tool, the AI infers from the question which tool(s) are needed
  - Each tool maps to a different agent flow:
    - **Budget tool** — uses the existing budget analyst + impact analyst pipeline (current flow)
    - Other tools — route to their own dedicated agent workflows
  - The chat API should accept an optional `tool` parameter from the frontend
  - Agent routing logic: match the selected (or inferred) tool to the correct agent(s), then execute that agent's specific flow
  - Tools should be extensible — adding a new tool means defining its agent workflow and registering it in the router
- [ ] Add phone-number-only authentication via WhatsApp OTP
  - No username or password — the only credential is a phone number
  - On login, send a one-time passcode (OTP) to the user's WhatsApp number (number must be registered on WhatsApp)
  - User enters the OTP to verify and create a session
  - Sessions should be long-lived (effectively "forever")
  - If a session expires for any reason, re-authenticate by sending a new OTP — no password reset flow needed
  - Use a WhatsApp Business API provider (e.g. Twilio, Meta Cloud API) for OTP delivery
