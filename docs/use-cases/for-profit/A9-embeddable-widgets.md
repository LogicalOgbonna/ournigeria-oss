# A9: Embeddable Data Widgets for News Sites

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Ship with media partnerships
**Timeline:** Month 1-2
**Revenue potential:** $100-300/month per customer (distribution > revenue play)

---

## Problem

Online publishers want interactive data in their articles — budget comparisons, spending trends, FAAC allocation charts — but building custom visualisations for every story is expensive and slow. Most Nigerian newsrooms lack data engineering capacity.

Meanwhile, OurNigeria already generates 22 chart types from government fiscal data. The gap is a distribution mechanism that lets publishers embed these charts in their articles without technical integration.

---

## Solution

**Embeddable data widgets** — iframe-based interactive charts that publishers paste into articles.

### How It Works

1. Publisher or journalist searches for data on OurNigeria (or uses the chat interface)
2. When a chart is generated, a "Share / Embed" button appears
3. Clicking it produces an embed code:
   ```html
   <iframe src="https://ournigeria.ng/embed/chart/abc123"
           width="100%" height="400" frameborder="0">
   </iframe>
   ```
4. Publisher pastes the embed code into their CMS (WordPress, Ghost, custom)
5. The chart renders live in the article with OurNigeria branding
6. Data updates automatically when new data is ingested

### Widget Types

| Widget | Description | Use Case |
|---|---|---|
| **Budget comparison** | Side-by-side state/sector budget comparison | "Comparing education spending across geopolitical zones" |
| **FAAC trend** | Monthly FAAC allocation trend for a state/LGA | "How much did Kano receive from the federation account?" |
| **Spending breakdown** | Pie/donut chart of sector spending | "Where does Rivers State spend its money?" |
| **Payment timeline** | GovSpend payment activity over time | "Government payments to health sector, 2024" |
| **State ranking** | Horizontal bar chart ranking states on a metric | "Which states spend the most on education per capita?" |
| **Impact equivalent** | Visual showing what an amount could buy | "What N50 billion could fund in education" |
| **Fact-check card** | Compact claim verification result | "Governor claimed N200B on roads — here's the data" |

### Tiers

| Tier | Branding | Features | Price |
|---|---|---|---|
| **Free** | OurNigeria watermark + "Powered by OurNigeria" link | Basic charts, limited customisation | Free |
| **Professional** | Small "Data: OurNigeria" attribution | Custom colors, responsive sizing, no watermark | $100/month |
| **Enterprise** | White-labeled (publisher's branding) | Custom domain, priority data, analytics dashboard | $300/month |

---

## Strategic Value

The revenue from widgets is modest, but the **distribution value is enormous:**

- Every embedded widget is free advertising to the publisher's audience
- "Powered by OurNigeria" links drive traffic to the civic platform
- Widgets normalize the idea of structured government data
- Publishers become dependent on OurNigeria data — creating stickiness for media partnerships
- Viral potential: if one publisher's article goes viral, thousands see the OurNigeria brand

This is a **distribution play, not a revenue play.** Price accordingly — make the free tier genuinely useful.

---

## Target Customers

### Tier 1: Online-First Publications
- TechCabal, TechPoint, Dataphyte, Stears, BusinessDay Online
- These publications already do data-driven content and understand embeds

### Tier 2: Traditional Media with Online Presence
- Premium Times, The Cable, Punch Online, Vanguard, ThisDay
- Larger audiences but less technical sophistication

### Tier 3: International Media Covering Nigeria
- BBC Africa, Reuters Africa, Bloomberg Africa
- Occasional Nigeria stories that need quick data visualisation

### Tier 4: Bloggers and Civic Commentators
- Twitter/X threadmakers, Substack writers, YouTube commentators
- Free tier users who amplify reach

---

## Technical Requirements

1. **Embed endpoint** — `GET /embed/chart/:id` renders a standalone chart page optimised for iframes (3-5 days)
2. **Share/Embed UI** — "Copy embed code" button on chat-generated charts (2-3 days)
3. **Responsive sizing** — Charts that adapt to container width (1-2 days)
4. **Branding tiers** — Watermark/attribution logic based on API key tier (1-2 days)
5. **Analytics** — Track embed impressions per publisher (2-3 days)
6. **OG meta tags** — Social media preview cards when widget URLs are shared (1 day)

**Total estimated effort:** 2-3 weeks

---

## Relationship to Other Use Cases

- **Media partnerships** — Widgets are the technical product that media partnerships distribute
- **A8 (Fact-Check):** Fact-check verdict cards as a widget type
- **E2 (Report Cards):** Report card widgets embeddable in election coverage articles
- **Foundation mission:** Free tier widgets democratise access to government data through media
