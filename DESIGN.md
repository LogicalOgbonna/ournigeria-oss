# Design System — OurNigeria

This document is the single source of truth for all visual design decisions across the OurNigeria platform. Every UI change, new component, and content asset should align with these specifications.

## Product Context

- **What this is:** An AI-powered civic transparency platform that lets Nigerian citizens query government spending in plain English or Pidgin across 37 states
- **Who it's for:** Nigerian citizens, journalists, researchers, civil society organizations — people who want to hold government accountable
- **Space/industry:** Civic tech / open government / accountability tools
- **Project type:** Multi-app platform — chat web app, admin dashboard, marketing landing page, social content (video + images)

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian with civic warmth
- **Decoration level:** Intentional — subtle emerald accents and data-driven visuals, not decorative for decoration's sake
- **Mood:** Function-first data interface softened by emerald green (the national color) and a Pidgin voice. Not a startup, not a government portal — a citizen's tool. It should feel like it belongs to the people, with the authority of real data and the warmth of speaking your language.

## Color System

### Primary Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| **Emerald (Primary)** | `#059669` | `#34d399` | Primary actions, active states, brand accent |
| **Emerald Light** | `#d1fae5` | `#064e3b` | Subtle backgrounds, hover states |
| **Gold** | `#d97706` | `#fbbf24` | Secondary accent, infrastructure data |

### Semantic Colors

| Purpose | Color | Hex |
|---------|-------|-----|
| Corruption / Danger | Red | `#ef4444` |
| Warning / Ongoing status | Amber | `#f59e0b` |
| Neutral / Inactive | Slate | `#94a3b8` |
| Destructive | Rose | `oklch(0.577 0.245 27.325)` |

### Chart Palette (ordered by priority)

```
#059669  Emerald 600 (primary)
#0891b2  Cyan 600
#d97706  Amber 600
#65a30d  Lime 600
#7c3aed  Violet 600
#e11d48  Rose 600
#0284c7  Sky 600
#ea580c  Orange 600
#4f46e5  Indigo 600
#be185d  Pink 700
```

### Sector-Specific Colors

| Sector | Color |
|--------|-------|
| Education | `#059669` |
| Health | `#0891b2` |
| Infrastructure / Works | `#d97706` |
| Agriculture | `#65a30d` |
| Security | `#ef4444` |
| General Administration | `#7c3aed` |
| Debt Service | `#64748b` |
| Other | `#94a3b8` |

### Platform-Specific Background Variants

The background strategy varies by platform for maximum impact:

| Platform | Background | Rationale |
|----------|-----------|-----------|
| **Web App** (light) | `oklch(0.98 0.002 120)` near-white | Clean reading environment |
| **Web App** (dark) | `oklch(0.15 0.005 260)` deep blue-black | Comfortable dark mode |
| **Landing Page** (dark) | `oklch(0.10 0.005 160)` darker emerald-tinted | Premium, immersive feel |
| **Twitter Images** | Gradient `#064e3b` -> `#065f46` -> `#047857` | Bright emerald pops on Twitter's white feed |
| **TikTok/Reels Videos** | `#080c0a` near-black | Immersive dark for vertical video format |
| **ShareCard (OG images)** | Gradient `#064e3b` -> `#065f46` -> `#047857` | Same as Twitter — optimized for link preview |
| **Link preview cards** (awanaija `opengraph-image`) | Gradient `#052e26` -> `#064e3b` -> `#066f4d` | Deliberately darker than ShareCard. These carry a white Instrument Serif headline at 66px, and the lighter ShareCard ground loses contrast once WhatsApp scales the card to a thumbnail. See `apps/awanaija/src/lib/og.tsx`. |

> **Why the difference?** Twitter/OG images appear as cards in a mostly-white feed — the emerald gradient creates contrast and brand recognition. TikTok videos are consumed in a dark, full-screen environment — dark backgrounds feel native and let data glow.

### Dark Mode Strategy

- Implemented via `next-themes` with class-based toggling (`.dark` on `<html>`)
- Default: system preference
- Surfaces: reduce lightness, shift hue slightly toward blue-black (`oklch(0.15 0.005 260)`)
- Accent colors: increase lightness for readability (emerald `#059669` → `#34d399`, gold `#d97706` → `#fbbf24`)
- Semantic colors maintain hue but adjust saturation and lightness for dark backgrounds

## Typography

### Font Stack

| Role | Font | Weights | CSS Variable | Usage |
|------|------|---------|-------------|-------|
| **Body** | Instrument Sans | 400, 500, 600, 700 | `--font-sans` | All body text, UI labels, chat messages |
| **Headings** | DM Sans | 400, 500, 600, 700 | `--font-heading` | Section headings, card titles, navigation |
| **Display** | Instrument Serif | 400, 400i | `--font-serif` | Hero text, video titles, emotional moments |
| **Data** | IBM Plex Mono | 400, 500, 700 | `--font-mono` | Numbers, currency, code, data labels |

> **Why Instrument Sans?** It pairs naturally with Instrument Serif (our display font), creating family cohesion across the platform. Geometric, modern, readable — without being the generic Inter/Roboto that every other dashboard uses.

### Font Loading by App

| App | Fonts Loaded | Rationale |
|-----|-------------|-----------|
| **Web App** | Instrument Sans, DM Sans, Instrument Serif, IBM Plex Mono | Full stack — chat uses body + display, data views need mono |
| **Dashboard** | Instrument Sans, DM Sans, IBM Plex Mono | No display serif needed — admin is utilitarian |
| **Landing Page** | Instrument Sans, DM Sans, Instrument Serif, IBM Plex Mono | Full stack — hero uses serif, stats need mono |
| **Videos** | DM Sans, Instrument Serif, IBM Plex Mono | No body sans — video uses heading + display + data fonts |

All fonts loaded via `next/font/google` with CSS variable assignment.

### Type Scale (Web App)

| Level | Size | Line Height | Font | Weight | Usage |
|-------|------|-------------|------|--------|-------|
| Display | 36px / 2.25rem | 1.15 | Instrument Serif | 400 | Hero headings, empty states |
| H1 | 28px / 1.75rem | 1.25 | DM Sans | 700 | Page titles |
| H2 | 22px / 1.375rem | 1.3 | DM Sans | 600 | Section headings |
| H3 | 18px / 1.125rem | 1.4 | DM Sans | 600 | Card titles, subsections |
| Body | 16px / 1rem | 1.6 | Instrument Sans | 400 | Default text, chat messages |
| Body Small | 14px / 0.875rem | 1.5 | Instrument Sans | 400 | Secondary text, descriptions |
| Caption | 12px / 0.75rem | 1.4 | Instrument Sans | 500 | Labels, timestamps, metadata |
| Overline | 11px / 0.6875rem | 1.3 | IBM Plex Mono | 500 | Section labels, uppercase tags |
| Data | 14-22px | 1.4 | IBM Plex Mono | 500-700 | Currency figures, statistics |

### Type Scale (Video / Social Media)

For 9:16 vertical video (1080x1920):

| Element | Size | Font | Weight | Color |
|---------|------|------|--------|-------|
| State/Title name | 80px (scales down for long names) | Instrument Serif | 400 | `#fff` |
| Big number | 64-72px | IBM Plex Mono | 700 | Accent color (emerald/red) |
| Question/subtitle | 36px | DM Sans | 500 | `rgba(255,255,255,0.7)` |
| Badge text | 24-28px | IBM Plex Mono or DM Sans | 600 | Accent color |
| Caption text | 28px | DM Sans | 600 | `#fff` |
| Label text | 20-22px | DM Sans | 500-600 | `rgba(255,255,255,0.6)` |
| Small label | 14px | DM Sans | 400 | `rgba(255,255,255,0.5)` |

### Dynamic Font Scaling

When text content exceeds the available width, step down font sizes:

| Character count | Base 80px becomes | Base 64px becomes |
|----------------|-------------------|-------------------|
| <= 12 chars | 80px | 64px |
| 13-20 chars | 64px | 52px |
| 21+ chars | 48px | 42px |

Applies to: state names, official names, and any dynamic title text in videos and images.

### Type Scale (Twitter Images / Data Cards)

For 1200x630 images:

| Element | Size | Font | Weight |
|---------|------|------|--------|
| Title | 28px | System bold | 700 |
| Big number | 56px | System bold | 800 |
| Caption | 24px | System regular | 400 |
| Footer | 18px | System regular | 400 |

## Spacing

### Base Unit & Density

- **Base unit:** 4px
- **Density:** Comfortable — enough breathing room for long reading sessions with data tables

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| 2xs | 4px | Tight gaps between inline elements |
| xs | 8px | Icon-to-label gaps, compact list items |
| sm | 16px | Default element spacing, form field gaps |
| md | 24px | Card padding, section sub-gaps |
| lg | 32px | Section spacing within a view |
| xl | 48px | Major section breaks |
| 2xl | 64px | Page-level vertical rhythm |

### Border Radius

- **Base:** `0.625rem` (10px)
- **Scale:** sm(6px), md(8px), lg(10px), xl(14px), 2xl(18px), 3xl(22px), 4xl(26px), full(9999px)
- **CSS:** `--radius: 0.625rem` with calc-based derivatives

| Element Type | Radius | Token |
|-------------|--------|-------|
| Small buttons, badges | 6px | sm |
| Inputs, small cards | 8px | md |
| Standard cards, modals | 10px | lg |
| Featured cards, buttons | 14px | xl |
| Large containers, hero | 18px | 2xl |
| Avatars, pills | 9999px | full |

### Video (9:16) Spacing

- Frame padding: 60px horizontal, 80px vertical
- Element gap: 40-48px
- Card padding: 24px 28px
- Card border-radius: 16-20px

### Twitter Images (1200x630) Spacing

- Padding: 40px all sides
- Nigerian flag accent: 8px bars (green + white + green), top-right corner

## Layout

### Approach

Grid-disciplined — strict alignment, predictable layout. The data does the talking, not the grid.

### Breakpoints

Using Tailwind CSS v4 defaults:

| Token | Width | Usage |
|-------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / small desktop |
| xl | 1280px | Standard desktop |
| 2xl | 1536px | Wide desktop |

### Max Content Widths

| Context | Max Width | Tailwind Class |
|---------|-----------|---------------|
| Chat conversation | 768px | `max-w-3xl` |
| Profile / settings | 1024px | `max-w-5xl` |
| Modals | 448px | `max-w-md` |
| Compact forms | 384px | `max-w-sm` |

### Container Strategy

- Container queries on card headers (`@container/card-header`) for responsive card behavior independent of viewport
- Card padding: `px-6 py-6` (24px) with `gap-6` between sections
- Chat messages: `max-w-[85%]` for readable line length

## Motion

### Approach

Intentional — subtle entrance animations and meaningful state transitions. Motion aids comprehension of data changes, not decoration.

### Easing

| Purpose | Easing | CSS |
|---------|--------|-----|
| Enter/appear | ease-out | `cubic-bezier(0, 0, 0.2, 1)` |
| Exit/disappear | ease-in | `cubic-bezier(0.4, 0, 1, 1)` |
| Move/resize | ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` |

### Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| micro | 50-100ms | Hover states, focus rings |
| short | 150-250ms | Button press, input focus, tooltip |
| medium | 300-500ms | Card entrance, modal open, fade in |
| long | 400-700ms | Page transitions, complex animations |

### Web App Transitions

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade in up | 0.5s | ease-out |
| Fade in | 0.4s | ease-out |
| Scale in | 0.3s | ease-out |
| Slide in right | 0.4s | ease-out |
| Stagger delay | 0.1s per item | — |

### Video Animation (Remotion)

| Pattern | Config | Usage |
|---------|--------|-------|
| Spring entrance | damping: 15-25, stiffness: 60-100 | Elements entering frame |
| Fade + slide up | 0.5s (15 frames at 30fps) | Text reveals |
| Count-up numbers | 1-1.2s duration | Budget figures, statistics |
| Sequential stagger | 6 frames (0.2s) between items | Bar chart bars, list items |
| Donut draw | 1s linear interpolation | Donut chart segments |

### Landing Page Effects

| Animation | Duration | Usage |
|-----------|----------|-------|
| Orb drift | 18-28s infinite | Background atmosphere |
| Pulse glow | 3s infinite | Emerald glow effects |
| Gradient shift | 8s infinite | Background gradients |
| Float | 6s infinite | Floating elements |
| Carousel | Multi-step | Hero content rotation |

## Visual Signatures by Content Type

Each content type has a distinct emotional register achieved through color, not layout:

| Content Type | Accent Color | Badge Color | Emotional Arc |
|-------------|-------------|-------------|---------------|
| **State Budget** | Emerald `#34d399` | Emerald | Curiosity -> Analysis -> Accountability |
| **Corruption Case** | Red `#ef4444` | Red | Shock -> Outrage -> Justice |
| **State Comparison** | Emerald `#34d399` | Emerald | Pride/Shame -> Analysis -> Action |
| **FAAC Allocation** | Emerald `#34d399` | Emerald | "Where's the money?" -> Tracking -> Accountability |
| **Money Could Buy** | Emerald `#34d399` | Emerald | Realization -> Impact -> Empowerment |

> **Corruption is the exception.** Red accent, red badge border, red number glow — everything signals danger/betrayal. All other content types use the standard emerald palette.

## Components

### Shared Video Components

- **OutroScene**: CTA + QR code + URL pill + stats row. Used as the final 5s of every video.
- **PidginCaption**: Bottom-positioned text overlay with blur background. The emotional voice of every video.
- **VerticalHBarChart**: Full-width animated horizontal bars for sector breakdowns.
- **VerticalDonutChart**: Animated SVG donut with center stat and legend.
- **BigStat**: Animated count-up number with glow effect. The scroll-stopper.
- **EmeraldOrbs**: Ambient background orbs for atmosphere.

### Image Templates

- **Data Card**: Title + big number + Pidgin caption + footer CTA (1200x630)
- **Chart Card**: Title + embedded chart.js chart + caption + footer CTA (1200x630)

## Voice & Tone

### Pidgin English Guidelines

All social media content (videos, tweets, image captions) uses Nigerian Pidgin as the primary voice.

- Use "we", "our", "your pikin" — make it personal
- Real numbers in every statement (never vague)
- Emotional but factual — outrage backed by data
- CTA always points to `app.ournigeria.ng`

### Brand Text

| Context | Text |
|---------|------|
| Video CTA heading | "Ask Your Own Questions" |
| Video URL | `ournigeria.ng` |
| Image footer | `app.ournigeria.ng` |
| Stats row | "36 + FCT" / "2019-2025" / "700+" |
| Nigerian flag | Top-right accent in images, not in videos |

## Cultural Markers

- **Nigerian flag accent** (green-white-green bars): Used in static images only. Provides instant cultural context in a Twitter feed.
- **Naira symbol (₦)**: Always use the Naira sign, never "NGN" or "N". Format: ₦1.2T, ₦350.5B, ₦25.0M.
- **Emerald green**: The national color. Our primary accent is deliberately aligned.

## Anti-Patterns (Don't Do This)

- Don't use blue as a primary color (too "tech startup")
- Don't use generic gradient backgrounds (purple-blue is AI slop)
- Don't use "Clean, modern UI" as a design spec — name the actual choices
- Don't add hashtags inside content — only in the last tweet of a thread
- Don't use "No items found" as an empty state — CLI should reject bad data, not render it
- Don't mix emerald and red accents in the same composition (except in charts with sector colors)
- Don't use Inter, Roboto, or Poppins — the body font is Instrument Sans for a reason
- Don't use purple/violet gradients as accent colors
- Don't center everything with uniform spacing — use intentional alignment and hierarchy

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Body font changed from Inter to Instrument Sans | Creates family cohesion with Instrument Serif (display font). Inter is overused and undermines the "not a Silicon Valley startup" identity. |
| 2026-03-19 | Added Product Context, Aesthetic Direction, Layout, Web Type Scale, Motion Scale sections | Formalizing design decisions that were implemented but undocumented. |
| 2026-03-19 | Documented font loading per app | Web/dashboard were missing Instrument Serif and IBM Plex Mono. Clarified which apps need which fonts. |
