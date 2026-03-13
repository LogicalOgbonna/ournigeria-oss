# E10: Diaspora Premium Tier

**Entity:** OurNigeria Research Ltd (For-Profit) — NOTE: despite being in non-profit folder, this is a for-profit product
**Priority:** Month 3-4
**Timeline:** Month 3-4
**Revenue potential:** $5-10/month × target 10,000 subscribers = $50K-100K/month at scale

---

## Problem

Nigeria's diaspora community — estimated 15-17 million people across the US, UK, Canada, Europe, and the Middle East — has a unique relationship with government spending:

1. **They send money home.** Diaspora remittances exceed $20B/year, making Nigeria the largest remittance destination in Africa. They care deeply about how government spends money because it affects their families.

2. **They can't see what's happening.** Living abroad, they have even less access to government fiscal information than domestic Nigerians. They rely on social media rumors, family phone calls, and partisan news sources.

3. **They're politically engaged from afar.** Many diaspora Nigerians vote (PVC registration from abroad), donate to campaigns, and advocate for their home states/LGAs. But they do this without fiscal data.

4. **They're digitally sophisticated and willing to pay.** Diaspora Nigerians use subscription products regularly (Netflix, Spotify, news subscriptions). $5-10/month is trivial for someone earning in USD/GBP/EUR.

5. **They're underserved.** No product exists that gives diaspora Nigerians structured, personalized access to their home state's fiscal data.

---

## Solution

A **premium diaspora subscription** providing personalized fiscal intelligence about the subscriber's home state and LGA.

### Core Product: "My State Dashboard"

Subscribers select their home state (and optionally LGA), and receive:

**1. Monthly Fiscal Digest (Email/App)**
Every month, automatically:
- FAAC allocation to your state and LGA this month (with trend)
- Budget execution update (what's been spent this quarter)
- Key payments from GovSpend (notable contracts and disbursements)
- "What your tax money bought" — impact equivalents
- Any new corruption cases involving your state officials
- Comparison with national average

**2. Real-Time Alerts**
Push notifications / email alerts for:
- Significant changes in FAAC allocation (±10%)
- New corruption case involving your state
- Budget document published (new fiscal year budget)
- Notable government payment above threshold

**3. Deep Dive Tools**
Interactive dashboards:
- Historical FAAC trends for your state (5+ years)
- Budget breakdown by sector
- GovSpend payment search for your state
- State comparison (your state vs 2-3 others)
- Governor scorecard (from E2)

**4. Community Features**
- Discussion forum for fellow diaspora from same state
- "Verify a claim" — submit a fiscal claim for data verification
- "Track a project" — flag a government project for monitoring
- Monthly virtual town hall with data walkthrough

### Example Monthly Digest

```
Subject: Your Imo State Fiscal Update — February 2026

Hi Chinedu,

Here's what happened with government money in Imo State this month:

💰 FAAC ALLOCATION
Imo received ₦14.2B from FAAC in February 2026
↑ 3% from January (₦13.8B)
Imo ranks 18th out of 37 states

📊 BUDGET EXECUTION (Q4 2025)
Overall: 47% executed (below national avg of 56%)
Education: 52% | Health: 38% | Infrastructure: 41%

💳 NOTABLE PAYMENTS
• ₦2.1B to Consolidated Construction Ltd (road project)
• ₦850M to State Universal Basic Education Board
• ₦420M to Ministry of Health (medical supplies)

⚖️ ACCOUNTABILITY WATCH
• No new EFCC cases this month
• 1 ongoing case: Former commissioner under investigation

🏫 WHAT ₦14.2B COULD FUND
• 710 fully equipped classrooms
• 2,840 boreholes for clean water
• 28 primary health centers

📈 Your state's fiscal health score: 52/100 (C-)
Compare with Anambra (68, B-) and Abia (44, D+)

[View Full Dashboard →]
```

---

## Target Market

### Demographics
- 15-17 million Nigerians in diaspora
- Primary markets: US (500K+), UK (300K+), Canada (100K+), UAE (50K+), South Africa (50K+)
- Age: 25-55 (economically active, politically engaged)
- Income: Middle to upper-middle class in host countries
- Digital native: 95%+ smartphone penetration

### Market Sizing

**Conservative (Year 1):**
- 0.1% of diaspora = 15,000-17,000 potential subscribers
- 30% conversion = 5,000 subscribers
- $5/month average = **$25,000/month**

**Moderate (Year 2):**
- 0.3% of diaspora = 45,000-51,000 potential subscribers
- 30% conversion = 15,000 subscribers
- $7/month average = **$105,000/month**

**Optimistic (Year 3):**
- 0.5% of diaspora = 75,000-85,000 potential
- 40% conversion = 30,000+ subscribers
- $8/month average = **$240,000/month**

---

## Pricing

| Tier | Price | Features |
|---|---|---|
| **Essential** | $5/month | Monthly digest, 1 state, basic alerts |
| **Premium** | $10/month | Weekly digest, 3 states, deep dive tools, real-time alerts |
| **Family** | $15/month | Premium for up to 5 family members, community features |
| **Annual discount** | 20% off | Any tier paid annually |

**Payment methods:** Stripe (international cards), PayPal. NOT Naira-denominated — price in USD to avoid FX volatility.

---

## Distribution Channels

### Organic
- **Diaspora WhatsApp groups** — State-specific groups (Igbo in diaspora, Yoruba in UK, etc.) are massive distribution channels
- **Twitter/X** — Nigerian Twitter diaspora is highly engaged
- **Podcasts** — Nigerian diaspora podcasts (The Takeaway with Zikoko, The Other Room, I Said What I Said)

### Partnerships
- **Diaspora organizations:** Nigerians in Diaspora Commission (NIDCOM), state associations (Lagos State Alumni, Imo State Union UK)
- **Remittance platforms:** Partner with Flutterwave, Chipper, Wise, WorldRemit — co-marketing ("send money AND know how it's spent")
- **Churches:** Nigerian diaspora churches are major community hubs; monthly fiscal updates as bulletin inserts

### Content Marketing
- Free weekly Twitter/X threads: "This week in Nigerian government spending"
- Free monthly email newsletter (conversion funnel to paid subscription)
- YouTube shorts: "Your state's budget in 60 seconds"

---

## Technical Requirements

### Backend
1. **User onboarding** — State/LGA selection, subscription tier (1 week)
2. **Monthly digest generator** — Auto-compose email from state fiscal data (1-2 weeks)
3. **Alert engine** — Monitor for significant changes, trigger notifications (1 week)
4. **Stripe integration** — Subscription billing in USD (1 week)

### Frontend
5. **Diaspora dashboard** — Personalized state view with deep-dive tools (2-3 weeks)
6. **Community features** — Discussion forum, claim verification queue (2-3 weeks)

### Email/Push
7. **Email template system** — Branded monthly digest emails (3-5 days)
8. **Push notification infrastructure** — Web push or mobile app (1-2 weeks)

**Total estimated effort:** 8-12 weeks

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Low willingness to pay | Medium | High | Validate with 100 diaspora Nigerians before building; start with free digest to prove value |
| High churn (subscribers cancel after novelty) | Medium | Medium | Monthly digest must be genuinely valuable, not just data dumps; community features increase stickiness |
| FX risk (Naira costs vs USD revenue) | Low | Medium | Costs mostly in USD (cloud, AI APIs); FX works in favor |
| Competition from free sources | Medium | Medium | No free source provides personalized, structured state fiscal data; differentiate on depth and personalization |
| Data latency frustrates paying customers | Medium | Medium | Be transparent about data freshness; set expectation of monthly updates |

---

## Why For-Profit (Not Non-Profit)

1. **Willing and able to pay** — Unlike domestic Nigerian citizens, diaspora subscribers earn in hard currency and regularly pay for digital subscriptions
2. **Premium experience expected** — Paying customers expect product quality, support, and reliability that justifies a commercial relationship
3. **Revenue predictability** — MRR from subscriptions is more predictable than grants
4. **Foundation cross-subsidy** — Diaspora revenue directly funds the free citizen platform

The Foundation provides the data and civic mission. Research Ltd provides the premium product and billing infrastructure. Value flows both ways.

---

## Relationship to Other Use Cases

- **E2 (Report Cards):** Governor scorecards are embedded in diaspora dashboards
- **E1 (SMS/USSD):** Diaspora subscribers may want to share data with family at home via SMS
- **A8 (Fact-Check):** "Verify a claim" feature uses the fact-check engine
- **Core platform:** Same data, personalized + premium delivery
- **Foundation funding:** Every diaspora dollar partially funds the free civic platform
