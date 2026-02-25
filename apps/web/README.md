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
- [x] User-selectable tools with automatic agent routing
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
- [ ] Multi-channel access via WhatsApp and Telegram
  - Users should be able to interact with the application through **WhatsApp** and **Telegram** — meeting them in environments they already use daily
  - Expose the same AI-powered query capabilities (budget analysis, corruption case lookup, tool routing) through chat messages on both platforms
  - **WhatsApp integration**:
    - Use the WhatsApp Business API (e.g. Meta Cloud API, Twilio) to receive and respond to user messages
    - Support text queries and return formatted responses (with limits appropriate for WhatsApp message length)
    - Tie into the existing phone-number auth — a user messaging from a verified number is already authenticated
  - **Telegram integration**:
    - Create a Telegram Bot via BotFather
    - Use the Telegram Bot API to receive and respond to messages
    - Support commands (e.g. `/budget Ebonyi 2025`, `/corruption Yari`) as well as freeform text queries
  - Both channels should share the same backend query pipeline as the web chat — a unified API layer that WhatsApp, Telegram, and the web frontend all call into
  - Conversation history should be stored per-user across channels so context is preserved regardless of which platform they use
- [ ] Shareable public chat conversations
  - All conversations are **private by default** — only the owner can see them
  - A user can make a **specific conversation** public via a "Share" action (e.g. toggle or button in the chat UI)
  - Users **cannot** make their entire chat history public — sharing is per-conversation only
  - When a conversation is set to public, **all messages** within it become publicly accessible (no per-message visibility control)
  - Public conversations get a **shareable URL** that anyone can view without authentication
  - **SEO-optimized public chat pages**:
    - Generate a slug from the conversation topic/first question (e.g. `/chat/ebonyi-2025-budget-analysis`)
    - Auto-generate **Open Graph images** (og:image) for each public chat — include the conversation title, key stats, or a summary visual so link previews on Twitter/WhatsApp/Telegram look compelling
    - Set proper meta tags: `og:title`, `og:description`, `og:image`, `twitter:card`, canonical URL
    - Server-side render (SSR) the public chat page so search engines can crawl and index the content
    - Use structured data (JSON-LD) where applicable (e.g. `FAQPage` schema if the chat is Q&A-style)
  - The owner can **revoke** public access at any time, turning the conversation back to private (the public URL should return a 404 or "conversation not found" page)
  - Database changes: add a `visibility` column (`private` | `public`) and a `slug` column to the conversations table
  - API: expose endpoints to toggle conversation visibility and retrieve public conversations by slug
