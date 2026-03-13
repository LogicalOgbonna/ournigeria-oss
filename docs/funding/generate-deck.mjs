import pptxgen from "pptxgenjs";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Brand Palette ───
const C = {
  emerald:     "059669",
  emeraldDark: "047857",
  emeraldDeep: "064E3B",
  emeraldLight:"10B981",
  emeraldBg:   "ECFDF5",
  emeraldBg2:  "D1FAE5",
  gold:        "D97706",
  goldBg:      "FFFBEB",
  dark:        "0F172A",
  gray:        "64748B",
  grayLight:   "94A3B8",
  lightGray:   "F8FAFC",
  border:      "E2E8F0",
  white:       "FFFFFF",
  red:         "DC2626",
  redBg:       "FEF2F2",
  redBorder:   "FECACA",
  greenBg:     "DCFCE7",
  greenText:   "166534",
};

const FONT_HEAD = "DM Sans";
const FONT_BODY = "Inter";

// ─── SVG Icons as base64 ───
function svgToBase64(svg) {
  return "image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const ICONS = {
  logo: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="18" fill="#059669"/>
    <path d="M40 16C30 16 22 24 22 34c0 14 18 30 18 30s18-16 18-30c0-10-8-18-18-18z" fill="white" opacity="0.9"/>
    <circle cx="40" cy="33" r="7" fill="#059669"/>
    <rect x="26" y="52" width="28" height="3" rx="1.5" fill="white" opacity="0.5"/>
    <rect x="30" y="58" width="20" height="3" rx="1.5" fill="white" opacity="0.35"/>
  </svg>`),

  logoWhite: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="18" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <path d="M40 16C30 16 22 24 22 34c0 14 18 30 18 30s18-16 18-30c0-10-8-18-18-18z" fill="white" opacity="0.9"/>
    <circle cx="40" cy="33" r="7" fill="#059669"/>
    <rect x="26" y="52" width="28" height="3" rx="1.5" fill="white" opacity="0.5"/>
    <rect x="30" y="58" width="20" height="3" rx="1.5" fill="white" opacity="0.35"/>
  </svg>`),

  lockedFile: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="6" width="24" height="32" rx="3" fill="#FCA5A5" stroke="#DC2626" stroke-width="1.5"/>
    <path d="M14 14h12M14 19h10M14 24h8" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="34" cy="32" r="11" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5"/>
    <rect x="30" y="31" width="8" height="7" rx="1.5" fill="#DC2626"/>
    <path d="M32 31v-3a2 2 0 114 0v3" stroke="#DC2626" stroke-width="1.5" fill="none"/>
  </svg>`),

  noData: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="10" width="40" height="28" rx="3" fill="#FCA5A5" stroke="#DC2626" stroke-width="1.5"/>
    <path d="M4 17h40" stroke="#DC2626" stroke-width="1.5"/>
    <circle cx="8" cy="13.5" r="1.2" fill="#DC2626"/>
    <circle cx="12" cy="13.5" r="1.2" fill="#DC2626"/>
    <circle cx="16" cy="13.5" r="1.2" fill="#DC2626"/>
    <path d="M16 28l6-6 6 6M18 30l4 4 4-4" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M32 22v10M36 22v10" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  </svg>`),

  hiddenMoney: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" fill="#FCA5A5" stroke="#DC2626" stroke-width="1.5"/>
    <text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#DC2626">&#x20A6;</text>
    <path d="M10 10l28 28" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`),

  bottleneck: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <path d="M12 8h24v8l-8 8 8 8v8H12v-8l8-8-8-8z" fill="#FCA5A5" stroke="#DC2626" stroke-width="1.5"/>
    <circle cx="20" cy="14" r="1.5" fill="#DC2626"/>
    <circle cx="28" cy="14" r="1.5" fill="#DC2626"/>
    <circle cx="24" cy="17" r="1.5" fill="#DC2626"/>
    <circle cx="24" cy="38" r="1.5" fill="#DC2626" opacity="0.5"/>
  </svg>`),

  ingest: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <rect x="6" y="8" width="22" height="28" rx="3" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
    <path d="M12 16h10M12 21h8M12 26h6" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="10" y="36" width="22" height="20" rx="3" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
    <path d="M16 42h10M16 47h8M16 52h6" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M34 24h8" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
    <path d="M42 20v8l6-4z" fill="#059669"/>
    <rect x="50" y="14" width="8" height="20" rx="2" fill="#059669"/>
    <rect x="52" y="18" width="4" height="3" rx="1" fill="white"/>
    <rect x="52" y="23" width="4" height="3" rx="1" fill="white"/>
    <rect x="52" y="28" width="4" height="3" rx="1" fill="white"/>
  </svg>`),

  analyze: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="24" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
    <path d="M20 32c0-6.6 5.4-12 12-12" stroke="#059669" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M32 20c6.6 0 12 5.4 12 12" stroke="#10B981" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="32" cy="32" r="5" fill="#059669"/>
    <circle cx="32" cy="32" r="2" fill="white"/>
    <path d="M32 27v-4M32 41v-4M27 32h-4M41 32h-4" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22 22l2.5 2.5M42 22l-2.5 2.5" stroke="#059669" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`),

  serve: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <rect x="8" y="12" width="48" height="34" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
    <rect x="12" y="16" width="40" height="22" rx="2" fill="white"/>
    <circle cx="20" cy="24" r="4" fill="#059669"/>
    <rect x="28" y="21" width="18" height="2.5" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="28" y="26" width="12" height="2" rx="1" fill="#059669" opacity="0.3"/>
    <path d="M14 32h36" stroke="#E2E8F0" stroke-width="1"/>
    <circle cx="20" cy="50" r="2" fill="#059669"/>
    <circle cx="32" cy="50" r="2" fill="#059669"/>
    <circle cx="44" cy="50" r="2" fill="#059669"/>
  </svg>`),

  arrow: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
    <path d="M6 16h18M20 10l6 6-6 6" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`),

  checkCircle: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#D1FAE5" stroke="#059669" stroke-width="1.5"/>
    <path d="M8 12.5l2.5 2.5 5-5" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`),

  clock: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5"/>
    <path d="M12 7v5l3 3" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`),

  target: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" stroke="#059669" stroke-width="2" fill="#D1FAE5"/>
    <circle cx="20" cy="20" r="10" stroke="#059669" stroke-width="1.5" fill="#ECFDF5"/>
    <circle cx="20" cy="20" r="4" fill="#059669"/>
  </svg>`),

  chart: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
    <rect x="4" y="4" width="32" height="32" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="1.5"/>
    <rect x="10" y="22" width="4" height="10" rx="1" fill="#059669"/>
    <rect x="18" y="16" width="4" height="16" rx="1" fill="#10B981"/>
    <rect x="26" y="10" width="4" height="22" rx="1" fill="#059669"/>
  </svg>`),

  person: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="16" r="10" fill="#059669"/>
    <path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16" fill="#059669"/>
    <circle cx="24" cy="16" r="6" fill="white"/>
  </svg>`),

  personGold: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="16" r="10" fill="#D97706"/>
    <path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16" fill="#D97706"/>
    <circle cx="24" cy="16" r="6" fill="white"/>
  </svg>`),

  rocket: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <path d="M24 6c-6 8-8 16-8 24h16c0-8-2-16-8-24z" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
    <circle cx="24" cy="22" r="4" fill="#059669"/>
    <path d="M16 30c-4 0-6 4-6 8h6z" fill="#059669" opacity="0.4"/>
    <path d="M32 30c4 0 6 4 6 8h-6z" fill="#059669" opacity="0.4"/>
    <rect x="22" y="34" width="4" height="8" rx="2" fill="#D97706"/>
  </svg>`),

  building: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <rect x="12" y="8" width="24" height="34" rx="2" fill="#D1FAE5" stroke="#059669" stroke-width="1.5"/>
    <rect x="16" y="13" width="5" height="4" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="27" y="13" width="5" height="4" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="16" y="21" width="5" height="4" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="27" y="21" width="5" height="4" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="16" y="29" width="5" height="4" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="27" y="29" width="5" height="4" rx="1" fill="#059669" opacity="0.6"/>
    <rect x="20" y="36" width="8" height="6" rx="1" fill="#059669"/>
  </svg>`),

  buildingGold: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <path d="M24 6l16 10v26H8V16z" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5"/>
    <rect x="16" y="22" width="5" height="4" rx="1" fill="#D97706" opacity="0.5"/>
    <rect x="27" y="22" width="5" height="4" rx="1" fill="#D97706" opacity="0.5"/>
    <rect x="16" y="30" width="5" height="4" rx="1" fill="#D97706" opacity="0.5"/>
    <rect x="27" y="30" width="5" height="4" rx="1" fill="#D97706" opacity="0.5"/>
    <rect x="20" y="36" width="8" height="6" rx="1" fill="#D97706"/>
    <path d="M24 10v6" stroke="#D97706" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`),

  milestone: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
    <path d="M6 28V6" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
    <path d="M6 8h18l-4 6 4 6H6" fill="#D1FAE5" stroke="#059669" stroke-width="1.5"/>
  </svg>`),

  money: svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="12" width="40" height="24" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
    <circle cx="24" cy="24" r="8" fill="#ECFDF5" stroke="#059669" stroke-width="1.5"/>
    <text x="24" y="29" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#059669">$</text>
    <circle cx="10" cy="18" r="2" fill="#059669" opacity="0.3"/>
    <circle cx="38" cy="30" r="2" fill="#059669" opacity="0.3"/>
  </svg>`),
};

// ─── Gradient Background Image (programmatic) ───
function makeGradientBg(w = 1280, h = 720) {
  // We create a simple SVG gradient background
  return svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#047857"/>
        <stop offset="50%" stop-color="#059669"/>
        <stop offset="100%" stop-color="#10B981"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
  </svg>`);
}

const gradientBg = makeGradientBg();

// ─── Helpers ───
function addFooter(slide, light = false) {
  const color = light ? "FFFFFF" : C.grayLight;
  slide.addImage({ data: light ? ICONS.logoWhite : ICONS.logo, x: 0.4, y: 5.05, w: 0.25, h: 0.25 });
  slide.addText("OurNigeria", { x: 0.7, y: 5.05, w: 1.5, h: 0.25, fontFace: FONT_HEAD, fontSize: 9, color, bold: true });
}

function addSlideNum(slide, num, light = false) {
  slide.addText(String(num).padStart(2, "0"), {
    x: 9.0, y: 5.05, w: 0.6, h: 0.25,
    fontFace: FONT_BODY, fontSize: 9, color: light ? "FFFFFF" : C.grayLight, align: "right"
  });
}

function addBadge(slide, text, y = 0.4) {
  slide.addText(text.toUpperCase(), {
    x: 0.5, y, w: 2, h: 0.28,
    fontFace: FONT_BODY, fontSize: 8.5, color: C.emerald, bold: true,
    letterSpacing: 1.5,
  });
}

function addTitle(slide, text, y = 0.72) {
  slide.addText(text, {
    x: 0.5, y, w: 9, h: 0.48,
    fontFace: FONT_HEAD, fontSize: 24, color: C.dark, bold: true,
  });
}

function addSubtitle(slide, text, y = 1.22) {
  slide.addText(text, {
    x: 0.5, y, w: 8.5, h: 0.45,
    fontFace: FONT_BODY, fontSize: 12, color: C.gray, lineSpacingMultiple: 1.3,
  });
}

// ─── Build Presentation ───
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "OurNigeria";
pres.company = "OurNigeria Research";
pres.subject = "OurNigeria Pitch Deck";
pres.title = "OurNigeria — Pre-Seed Pitch Deck";

// ==================== SLIDE 1: COVER ====================
{
  const slide = pres.addSlide();
  slide.background = { data: gradientBg };

  slide.addImage({ data: ICONS.logoWhite, x: 4.38, y: 0.8, w: 0.65, h: 0.65 });

  slide.addText("OurNigeria", {
    x: 0.5, y: 1.65, w: 9, h: 0.65,
    fontFace: FONT_HEAD, fontSize: 42, color: C.white, bold: true, align: "center",
  });

  slide.addText("AI-powered government data infrastructure for Africa.\nTurning 700+ budget documents into enterprise intelligence.", {
    x: 1.5, y: 2.4, w: 7, h: 0.75,
    fontFace: FONT_BODY, fontSize: 14, color: C.white, align: "center",
    lineSpacingMultiple: 1.4, transparency: 10,
  });

  // Divider line
  slide.addShape(pres.ShapeType.line, {
    x: 4.4, y: 3.35, w: 1.2, h: 0,
    line: { color: C.white, width: 1.5, transparency: 60 },
  });

  slide.addText("PRE-SEED INVESTMENT DECK", {
    x: 2, y: 3.55, w: 6, h: 0.3,
    fontFace: FONT_BODY, fontSize: 11, color: C.white, align: "center",
    bold: true, transparency: 15,
  });

  slide.addText("March 2026  |  Confidential", {
    x: 2, y: 3.9, w: 6, h: 0.25,
    fontFace: FONT_BODY, fontSize: 9.5, color: C.white, align: "center", transparency: 35,
  });
}

// ==================== SLIDE 2: PROBLEM ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "The Problem");
  addTitle(slide, "Nigeria's fiscal data is buried and broken");
  addSubtitle(slide, "Government spending data across 36 states exists only in scattered PDFs, scanned documents, and opaque portals. No one can access, query, or analyze it at scale.");

  const cards = [
    { icon: ICONS.lockedFile, title: "Inaccessible Data", desc: "700+ budget documents spread across 37 states in PDF/XLSX format. No unified database. No API. No way to search or compare." },
    { icon: ICONS.noData, title: "No Credit Intelligence", desc: "Banks lend billions to state governments without standardized fiscal health data. Credit agencies lack structured financial profiles." },
    { icon: ICONS.hiddenMoney, title: "Opaque Spending", desc: "891,000+ federal contractor payments with no searchable interface. Citizens, journalists, and researchers can't track where money goes." },
    { icon: ICONS.bottleneck, title: "Research Bottleneck", desc: "NGOs, consultants, and media spend weeks manually extracting data from government PDFs. Every fiscal analysis starts from scratch." },
  ];

  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.6;
    const y = 1.85 + row * 1.6;
    const w = 4.3;
    const h = 1.4;

    // Card background
    slide.addShape(pres.ShapeType.rect, {
      x, y, w, h, rectRadius: 0.12,
      fill: { color: C.redBg },
      line: { color: C.redBorder, width: 0.75 },
    });

    slide.addImage({ data: c.icon, x: x + 0.15, y: y + 0.15, w: 0.4, h: 0.4 });

    slide.addText(c.title, {
      x: x + 0.65, y: y + 0.12, w: w - 0.85, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 12, color: C.dark, bold: true,
    });

    slide.addText(c.desc, {
      x: x + 0.2, y: y + 0.55, w: w - 0.4, h: 0.75,
      fontFace: FONT_BODY, fontSize: 9.5, color: C.gray, lineSpacingMultiple: 1.35,
    });
  });

  addFooter(slide);
  addSlideNum(slide, 2);
}

// ==================== SLIDE 3: SOLUTION ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "The Solution");
  addTitle(slide, "AI that turns government documents into queryable intelligence");
  addSubtitle(slide, "A multi-agent AI pipeline ingests, structures, and serves Nigeria's fiscal data via natural language queries and enterprise APIs.");

  // Three-step flow
  const steps = [
    { icon: ICONS.ingest, title: "Ingest", desc: "PDF, XLSX, DOCX extractors process 700+ budget docs, corruption records, and payment data across all 37 states." },
    { icon: ICONS.analyze, title: "Analyze", desc: "6 specialist AI agents -- Budget, Corruption, GovSpend, FAAC, Impact -- analyze and cross-reference data in real time." },
    { icon: ICONS.serve, title: "Serve", desc: "Enterprise API, chat interface, Telegram bot, and embeddable widgets. Ask in English or Pidgin, get cited answers." },
  ];

  steps.forEach((s, i) => {
    const x = 0.5 + i * 3.3;
    const y = 1.85;

    // Step box
    slide.addShape(pres.ShapeType.rect, {
      x, y, w: 2.6, h: 2.3, rectRadius: 0.12,
      fill: { color: C.lightGray },
      line: { color: C.border, width: 0.75 },
    });

    slide.addImage({ data: s.icon, x: x + 0.85, y: y + 0.15, w: 0.7, h: 0.7 });

    slide.addText(s.title, {
      x, y: y + 0.95, w: 2.6, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 13, color: C.dark, bold: true, align: "center",
    });

    slide.addText(s.desc, {
      x: x + 0.15, y: y + 1.25, w: 2.3, h: 0.9,
      fontFace: FONT_BODY, fontSize: 9, color: C.gray, align: "center", lineSpacingMultiple: 1.35,
    });

    // Arrow between steps
    if (i < 2) {
      slide.addImage({ data: ICONS.arrow, x: x + 2.65, y: y + 0.7, w: 0.55, h: 0.35 });
    }
  });

  // Feature pills row
  const features = [
    "708K+ vector embeddings",
    "22 chart types",
    "Source citations",
    "English + Pidgin",
    "Real-time streaming",
    "Shareable conversations",
  ];

  features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.15;
    const y = 4.35 + row * 0.42;

    slide.addImage({ data: ICONS.checkCircle, x, y: y + 0.02, w: 0.2, h: 0.2 });
    slide.addText(f, {
      x: x + 0.25, y, w: 2.7, h: 0.24,
      fontFace: FONT_BODY, fontSize: 9, color: C.dark,
    });
  });

  addFooter(slide);
  addSlideNum(slide, 3);
}

// ==================== SLIDE 4: MARKET ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "Market Opportunity");
  addTitle(slide, "Government data is a zero-dollar market becoming a billion-dollar one");
  addSubtitle(slide, "No structured, queryable source for Nigerian government fiscal data exists. We're building the infrastructure layer.");

  // Left column: Who needs this
  slide.addImage({ data: ICONS.target, x: 0.5, y: 1.85, w: 0.3, h: 0.3 });
  slide.addText("Who Needs This Data", {
    x: 0.88, y: 1.85, w: 3, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 13, color: C.dark, bold: true,
  });

  const customers = [
    ["Credit rating agencies (CRC, FirstCentral)", "High value"],
    ["Banks lending to governments", "High value"],
    ["Media houses (TechCabal, Premium Times)", "Quick wins"],
    ["Research & consulting firms", "Recurring"],
    ["NGOs & development partners", "Grant-funded"],
    ["Insurance companies & MFBs", "Growing"],
  ];

  const custRows = customers.map(([name, tag]) => [
    { text: name, options: { fontFace: FONT_BODY, fontSize: 9.5, color: C.dark } },
    { text: tag, options: { fontFace: FONT_BODY, fontSize: 9, color: C.emerald, bold: true, align: "right" } },
  ]);

  slide.addTable(custRows, {
    x: 0.5, y: 2.25, w: 4.3, colW: [3.2, 1.1],
    border: { type: "solid", pt: 0.5, color: C.border },
    rowH: 0.33,
  });

  // Right column: Macro tailwinds
  slide.addImage({ data: ICONS.chart, x: 5.2, y: 1.85, w: 0.3, h: 0.3 });
  slide.addText("Africa Macro Tailwinds", {
    x: 5.58, y: 1.85, w: 3, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 13, color: C.dark, bold: true,
  });

  const macro = [
    ["Population under 35", "75%"],
    ["Internet users", "500M+"],
    ["Mobile penetration", "93%"],
    ["GDP growth (projected)", "3-6%/yr"],
    ["Nigeria's annual budget", "$30B+"],
    ["States with budget data online", "<5"],
  ];

  const macroRows = macro.map(([label, val]) => [
    { text: label, options: { fontFace: FONT_BODY, fontSize: 9.5, color: C.dark } },
    { text: val, options: { fontFace: FONT_BODY, fontSize: 9.5, color: C.emerald, bold: true, align: "right" } },
  ]);

  slide.addTable(macroRows, {
    x: 5.2, y: 2.25, w: 4.3, colW: [3.2, 1.1],
    border: { type: "solid", pt: 0.5, color: C.border },
    rowH: 0.33,
  });

  // Bottom highlight box
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2, y: 4.35, w: 4.3, h: 0.85, rectRadius: 0.1,
    fill: { color: C.emeraldBg },
    line: { color: C.emeraldBg2, width: 1 },
  });

  slide.addText([
    { text: "First mover advantage: ", options: { bold: true, color: C.emerald } },
    { text: "No competitor has structured fiscal data across all 37 Nigerian states. The data moat compounds \u2014 every document ingested makes the platform harder to replicate.", options: { color: C.emeraldDark } },
  ], {
    x: 5.4, y: 4.4, w: 3.9, h: 0.75,
    fontFace: FONT_BODY, fontSize: 9, lineSpacingMultiple: 1.35,
  });

  addFooter(slide);
  addSlideNum(slide, 4);
}

// ==================== SLIDE 5: BUSINESS MODEL ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "Business Model");
  addTitle(slide, "Dual-entity: for-profit data company + non-profit civic platform");
  addSubtitle(slide, "Citizens never pay. Revenue comes from organizations that extract professional value from government data.");

  // For-Profit card
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 1.85, w: 4.3, h: 2.6, rectRadius: 0.12,
    fill: { color: C.emeraldBg },
    line: { color: C.emerald, width: 1.5 },
  });

  slide.addImage({ data: ICONS.building, x: 0.7, y: 1.95, w: 0.35, h: 0.35 });
  slide.addText("OurNigeria Research", {
    x: 1.1, y: 1.95, w: 3.5, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 14, color: C.dark, bold: true,
  });
  slide.addText("FOR-PROFIT  |  REVENUE ENGINE", {
    x: 1.1, y: 2.25, w: 3.5, h: 0.2,
    fontFace: FONT_BODY, fontSize: 8, color: C.emerald, bold: true,
  });

  const profitItems = [
    "Data API subscriptions ($50\u2013$500/mo)",
    "Bulk data licensing for credit agencies & banks",
    "Commissioned research reports",
    "Government creditworthiness profiles",
    "Media partnerships with revenue share",
    "Embeddable widgets & fact-checking API",
  ];

  profitItems.forEach((item, i) => {
    slide.addText("\u2192  " + item, {
      x: 0.75, y: 2.55 + i * 0.28, w: 3.8, h: 0.26,
      fontFace: FONT_BODY, fontSize: 9.5, color: C.dark,
    });
  });

  // Non-Profit card
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2, y: 1.85, w: 4.3, h: 2.6, rectRadius: 0.12,
    fill: { color: C.goldBg },
    line: { color: C.gold, width: 1.5 },
  });

  slide.addImage({ data: ICONS.buildingGold, x: 5.4, y: 1.95, w: 0.35, h: 0.35 });
  slide.addText("OurNigeria Foundation", {
    x: 5.8, y: 1.95, w: 3.5, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 14, color: C.dark, bold: true,
  });
  slide.addText("NON-PROFIT  |  CIVIC MISSION", {
    x: 5.8, y: 2.25, w: 3.5, h: 0.2,
    fontFace: FONT_BODY, fontSize: 8, color: C.gold, bold: true,
  });

  const nonprofitItems = [
    "Free citizen-facing chat platform",
    "Budget transparency tools for all",
    "Civic education content & campaigns",
    "University research access programs",
    "Funded by grants + for-profit cross-subsidy",
    "Editorial neutrality on all public content",
  ];

  nonprofitItems.forEach((item, i) => {
    slide.addText("\u2192  " + item, {
      x: 5.45, y: 2.55 + i * 0.28, w: 3.8, h: 0.26,
      fontFace: FONT_BODY, fontSize: 9.5, color: C.dark,
    });
  });

  // Connector bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 4.6, w: 9, h: 0.6, rectRadius: 0.08,
    fill: { color: C.lightGray },
    line: { color: C.border, width: 0.75, dashType: "dash" },
  });

  slide.addText("Same technology stack  |  Same data pipeline  |  Same AI agents\nFor-profit revenue funds the non-profit mission. The civic platform drives brand & distribution.", {
    x: 0.7, y: 4.62, w: 8.6, h: 0.55,
    fontFace: FONT_BODY, fontSize: 9, color: C.gray, align: "center", lineSpacingMultiple: 1.4,
  });

  addFooter(slide);
  addSlideNum(slide, 5);
}

// ==================== SLIDE 6: TRACTION ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "Traction");
  addTitle(slide, "Pre-revenue, but the hard part is done");
  addSubtitle(slide, "The data moat and AI pipeline are built. Investment accelerates go-to-market.");

  // Stat cards row
  const stats = [
    { num: "37", label: "States covered\n(100% of Nigeria)" },
    { num: "708K+", label: "Vector\nembeddings" },
    { num: "891K+", label: "Payment\nrecords" },
    { num: "700+", label: "Documents\ningested" },
  ];

  stats.forEach((s, i) => {
    const x = 0.5 + i * 2.38;
    slide.addShape(pres.ShapeType.rect, {
      x, y: 1.8, w: 2.1, h: 0.95, rectRadius: 0.1,
      fill: { color: C.lightGray },
      line: { color: C.border, width: 0.75 },
    });
    slide.addText(s.num, {
      x, y: 1.82, w: 2.1, h: 0.42,
      fontFace: FONT_HEAD, fontSize: 26, color: C.emerald, bold: true, align: "center",
    });
    slide.addText(s.label, {
      x, y: 2.22, w: 2.1, h: 0.45,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.gray, align: "center", lineSpacingMultiple: 1.2,
    });
  });

  // Status table
  const hdrOpts = { fontFace: FONT_BODY, fontSize: 8.5, color: C.emeraldDark, bold: true, fill: C.emeraldBg };
  const cellOpts = { fontFace: FONT_BODY, fontSize: 9.5, color: C.dark };
  const liveOpts = { fontFace: FONT_BODY, fontSize: 8.5, color: C.emerald, bold: true };
  const nextOpts = { fontFace: FONT_BODY, fontSize: 8.5, color: C.gold, bold: true };
  const detailOpts = { fontFace: FONT_BODY, fontSize: 9, color: C.gray };

  const tableRows = [
    [
      { text: "CAPABILITY", options: hdrOpts },
      { text: "STATUS", options: hdrOpts },
      { text: "DETAIL", options: hdrOpts },
    ],
    [
      { text: "Multi-agent AI pipeline", options: cellOpts },
      { text: "LIVE", options: liveOpts },
      { text: "6 specialist agents (Budget, Corruption, GovSpend, FAAC, Impact, Router)", options: detailOpts },
    ],
    [
      { text: "Chat interface (Web)", options: cellOpts },
      { text: "LIVE", options: liveOpts },
      { text: "English + Pidgin, 22 chart types, source citations, shareable links", options: detailOpts },
    ],
    [
      { text: "Telegram bot", options: cellOpts },
      { text: "LIVE", options: liveOpts },
      { text: "Full query capability via Telegram", options: detailOpts },
    ],
    [
      { text: "Data ingestion pipeline", options: cellOpts },
      { text: "LIVE", options: liveOpts },
      { text: "PDF/XLSX/DOCX extractors, Voyage AI embeddings, pgvector", options: detailOpts },
    ],
    [
      { text: "Admin dashboard", options: cellOpts },
      { text: "LIVE", options: liveOpts },
      { text: "User management, analytics, system settings, ingestion tracking", options: detailOpts },
    ],
    [
      { text: "Enterprise API", options: cellOpts },
      { text: "NEXT", options: nextOpts },
      { text: "Authenticated API layer for B2B customers \u2014 first product to monetize", options: detailOpts },
    ],
    [
      { text: "WhatsApp integration", options: cellOpts },
      { text: "NEXT", options: nextOpts },
      { text: "Highest-reach channel for Nigerian users", options: detailOpts },
    ],
  ];

  slide.addTable(tableRows, {
    x: 0.5, y: 2.95, w: 9.0,
    colW: [2.0, 0.7, 6.3],
    rowH: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    border: { type: "solid", pt: 0.5, color: C.border },
  });

  addFooter(slide);
  addSlideNum(slide, 6);
}

// ==================== SLIDE 7: TEAM ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "Team");
  addTitle(slide, "Built by a technical founder, guided by market expertise");
  addSubtitle(slide, "Lean team with full-stack capability. Investment funds the first key hires.");

  // Founder card
  slide.addImage({ data: ICONS.person, x: 0.5, y: 1.9, w: 0.55, h: 0.55 });
  slide.addText("Arinze Ogbonna", {
    x: 1.2, y: 1.9, w: 3.5, h: 0.28,
    fontFace: FONT_HEAD, fontSize: 14, color: C.dark, bold: true,
  });
  slide.addText("FOUNDER & CEO", {
    x: 1.2, y: 2.16, w: 3.5, h: 0.2,
    fontFace: FONT_BODY, fontSize: 8.5, color: C.emerald, bold: true,
  });
  slide.addText("Full-stack engineer who built the entire platform solo \u2014 multi-agent AI pipeline, ingestion system, frontend, admin dashboard, and Telegram bot. Deep expertise in AI/ML, distributed systems, and Nigerian civic data.", {
    x: 1.2, y: 2.4, w: 3.8, h: 0.7,
    fontFace: FONT_BODY, fontSize: 9.5, color: C.gray, lineSpacingMultiple: 1.35,
  });

  // Advisor card
  slide.addImage({ data: ICONS.personGold, x: 5.2, y: 1.9, w: 0.55, h: 0.55 });
  slide.addText("Timi", {
    x: 5.9, y: 1.9, w: 3.5, h: 0.28,
    fontFace: FONT_HEAD, fontSize: 14, color: C.dark, bold: true,
  });
  slide.addText("ADVISOR  |  STRATEGY & GTM", {
    x: 5.9, y: 2.16, w: 3.5, h: 0.2,
    fontFace: FONT_BODY, fontSize: 8.5, color: C.gold, bold: true,
  });
  slide.addText("Strategic advisor driving go-to-market, entity structuring, and customer pipeline. Guided the dual-entity model and B2B revenue strategy.", {
    x: 5.9, y: 2.4, w: 3.6, h: 0.7,
    fontFace: FONT_BODY, fontSize: 9.5, color: C.gray, lineSpacingMultiple: 1.35,
  });

  // Hiring plan
  slide.addText("Hiring Plan (Post-Investment)", {
    x: 0.5, y: 3.3, w: 4, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 13, color: C.dark, bold: true,
  });

  const hireHdr = { fontFace: FONT_BODY, fontSize: 8.5, bold: true, color: C.emeraldDark, fill: C.emeraldBg };
  const hireCell = { fontFace: FONT_BODY, fontSize: 9.5, color: C.dark };
  const hirePurpose = { fontFace: FONT_BODY, fontSize: 9, color: C.gray };
  const phaseOpts = { fontFace: FONT_BODY, fontSize: 8.5, bold: true, color: C.emerald };
  const phase3Opts = { fontFace: FONT_BODY, fontSize: 8.5, bold: true, color: C.gold };

  const hireRows = [
    [
      { text: "PHASE", options: hireHdr },
      { text: "ROLE", options: hireHdr },
      { text: "PURPOSE", options: hireHdr },
    ],
    [
      { text: "Phase 2", options: phaseOpts },
      { text: "Backend / Data Engineer", options: hireCell },
      { text: "Build enterprise API, scale data pipeline, optimize RAG", options: hirePurpose },
    ],
    [
      { text: "Phase 2", options: phaseOpts },
      { text: "Content Writer / Editor", options: hireCell },
      { text: "Data narratives, social content, civic education materials", options: hirePurpose },
    ],
    [
      { text: "Phase 3", options: phase3Opts },
      { text: "Sales / Partnerships", options: hireCell },
      { text: "Close enterprise customers, manage media partnerships", options: hirePurpose },
    ],
    [
      { text: "Phase 3", options: phase3Opts },
      { text: "Research Analyst", options: hireCell },
      { text: "Commissioned reports, credit intelligence products", options: hirePurpose },
    ],
  ];

  slide.addTable(hireRows, {
    x: 0.5, y: 3.65, w: 9.0,
    colW: [1.0, 2.5, 5.5],
    rowH: [0.3, 0.3, 0.3, 0.3, 0.3],
    border: { type: "solid", pt: 0.5, color: C.border },
  });

  addFooter(slide);
  addSlideNum(slide, 7);
}

// ==================== SLIDE 8: ROADMAP ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "Roadmap");
  addTitle(slide, "18-month path to revenue and sustainability");
  addSubtitle(slide, "Clear milestones from current state to profitability.");

  // Three milestone cards
  const milestones = [
    {
      period: "MONTHS 0\u20133",
      title: "Foundation",
      items: [
        "Incorporate OurNigeria Research Ltd",
        "Build enterprise API layer",
        "Hire backend engineer",
        "Secure 3 LOIs from media houses",
        "Launch WhatsApp channel",
      ],
    },
    {
      period: "MONTHS 3\u20139",
      title: "First Revenue",
      items: [
        "Onboard 5\u201310 paying API customers",
        "Launch credit intelligence MVP",
        "Hire content writer",
        "Reach $1,500/mo MRR",
        "500+ daily active users (free tier)",
      ],
    },
    {
      period: "MONTHS 9\u201318",
      title: "Scale & Sustainability",
      items: [
        "20+ enterprise customers",
        "$5,000+/mo MRR",
        "Expand to 2 additional African markets",
        "Register OurNigeria Foundation",
        "Apply for follow-on grants",
      ],
    },
  ];

  milestones.forEach((m, i) => {
    const x = 0.5 + i * 3.2;
    const w = 2.9;

    // Top accent bar
    slide.addShape(pres.ShapeType.rect, {
      x, y: 1.8, w, h: 0.05,
      fill: { color: C.emerald },
    });

    // Card body
    slide.addShape(pres.ShapeType.rect, {
      x, y: 1.85, w, h: 2.1, rectRadius: 0,
      fill: { color: C.lightGray },
      line: { color: C.border, width: 0.75 },
    });

    slide.addText(m.period, {
      x: x + 0.15, y: 1.9, w: w - 0.3, h: 0.2,
      fontFace: FONT_BODY, fontSize: 8, color: C.emerald, bold: true,
    });

    slide.addText(m.title, {
      x: x + 0.15, y: 2.1, w: w - 0.3, h: 0.25,
      fontFace: FONT_HEAD, fontSize: 13, color: C.dark, bold: true,
    });

    m.items.forEach((item, j) => {
      slide.addText("\u2022  " + item, {
        x: x + 0.15, y: 2.4 + j * 0.28, w: w - 0.3, h: 0.26,
        fontFace: FONT_BODY, fontSize: 9, color: C.gray,
      });
    });
  });

  // Revenue projection table
  const projHdr = { fontFace: FONT_BODY, fontSize: 8.5, bold: true, color: C.emeraldDark, fill: C.emeraldBg };
  const projCell = { fontFace: FONT_BODY, fontSize: 9.5, color: C.dark };
  const projGray = { fontFace: FONT_BODY, fontSize: 9, color: C.gray };
  const projGreen = { fontFace: FONT_BODY, fontSize: 9, bold: true, color: C.greenText, fill: C.greenBg };

  const projRows = [
    [
      { text: "PHASE", options: projHdr },
      { text: "MONTHLY COST", options: projHdr },
      { text: "MONTHLY REVENUE", options: projHdr },
      { text: "STATUS", options: projHdr },
    ],
    [
      { text: "Pre-launch (now)", options: projCell },
      { text: "~$50", options: projGray },
      { text: "$0", options: projGray },
      { text: "Current", options: { fontFace: FONT_BODY, fontSize: 9, bold: true, color: C.emerald } },
    ],
    [
      { text: "Launch (Mo 1\u20136)", options: projCell },
      { text: "~$350", options: projGray },
      { text: "$0\u2013$500", options: projGray },
      { text: "First customers", options: projGray },
    ],
    [
      { text: "Traction (Mo 6\u201312)", options: projCell },
      { text: "$600\u2013$1,200", options: projGray },
      { text: "$1,500\u2013$3,000", options: projGray },
      { text: "Break-even", options: projGray },
    ],
    [
      { text: "Scale (Mo 12\u201318)", options: projCell },
      { text: "$3,000\u2013$6,000", options: projGray },
      { text: "$5,000\u2013$8,000", options: projGray },
      { text: "Profitable", options: projGreen },
    ],
  ];

  slide.addTable(projRows, {
    x: 0.5, y: 4.15, w: 9.0,
    colW: [2.2, 2.0, 2.4, 2.4],
    rowH: [0.28, 0.28, 0.28, 0.28, 0.28],
    border: { type: "solid", pt: 0.5, color: C.border },
  });

  addFooter(slide);
  addSlideNum(slide, 8);
}

// ==================== SLIDE 9: THE ASK ====================
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  addBadge(slide, "The Ask");
  addTitle(slide, "Seed investment to go from built to sold");
  addSubtitle(slide, "The hardest part \u2014 building the data moat and AI pipeline \u2014 is done. Capital accelerates go-to-market.");

  // Ask hero box (gradient background)
  const askGradient = svgToBase64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
    </defs>
    <rect width="900" height="120" rx="16" fill="url(#g)"/>
  </svg>`);

  slide.addImage({ data: askGradient, x: 0.5, y: 1.8, w: 9.0, h: 0.95 });

  slide.addImage({ data: ICONS.money, x: 0.75, y: 1.9, w: 0.55, h: 0.55 });

  slide.addText("$250K \u2013 $500K", {
    x: 1.45, y: 1.88, w: 4, h: 0.45,
    fontFace: FONT_HEAD, fontSize: 32, color: C.white, bold: true,
  });

  slide.addText("Pre-Seed / Seed Round  |  OurNigeria Research (For-Profit)", {
    x: 1.45, y: 2.32, w: 6, h: 0.25,
    fontFace: FONT_BODY, fontSize: 10.5, color: C.white, transparency: 15,
  });

  // Use of funds cards
  const uses = [
    { pct: "40%", label: "Engineering", sub: "Enterprise API,\npremium features" },
    { pct: "30%", label: "Go-to-Market", sub: "First 5 paying\ncustomers" },
    { pct: "20%", label: "Content & Dist.", sub: "Brand, social,\npartnerships" },
    { pct: "10%", label: "Operations", sub: "Infra, legal,\nincorporation" },
  ];

  uses.forEach((u, i) => {
    const x = 0.5 + i * 2.38;
    slide.addShape(pres.ShapeType.rect, {
      x, y: 3.0, w: 2.1, h: 1.15, rectRadius: 0.1,
      fill: { color: C.lightGray },
      line: { color: C.border, width: 0.75 },
    });

    slide.addText(u.pct, {
      x, y: 3.05, w: 2.1, h: 0.38,
      fontFace: FONT_HEAD, fontSize: 24, color: C.emerald, bold: true, align: "center",
    });
    slide.addText(u.label, {
      x, y: 3.42, w: 2.1, h: 0.22,
      fontFace: FONT_BODY, fontSize: 10, color: C.dark, bold: true, align: "center",
    });
    slide.addText(u.sub, {
      x, y: 3.65, w: 2.1, h: 0.4,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.grayLight, align: "center", lineSpacingMultiple: 1.2,
    });
  });

  // Why now box
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 4.35, w: 9.0, h: 0.85, rectRadius: 0.1,
    fill: { color: C.emeraldBg },
    line: { color: C.emeraldBg2, width: 1 },
  });

  slide.addText([
    { text: "Why now?  ", options: { bold: true, color: C.emerald, fontSize: 10 } },
    { text: "The data moat is built (708K+ embeddings, 37 states). The AI pipeline is live. The B2B revenue streams are defined. What's missing is the team and GTM push to convert this infrastructure into paying enterprise customers. Every month of delay is a month a competitor could start building.", options: { color: C.emeraldDark, fontSize: 9.5 } },
  ], {
    x: 0.7, y: 4.38, w: 8.6, h: 0.8,
    fontFace: FONT_BODY, lineSpacingMultiple: 1.35,
  });

  addFooter(slide);
  addSlideNum(slide, 9);
}

// ==================== SLIDE 10: CLOSING ====================
{
  const slide = pres.addSlide();
  slide.background = { data: gradientBg };

  slide.addImage({ data: ICONS.logoWhite, x: 4.38, y: 1.0, w: 0.65, h: 0.65 });

  slide.addText("OurNigeria", {
    x: 0.5, y: 1.85, w: 9, h: 0.6,
    fontFace: FONT_HEAD, fontSize: 36, color: C.white, bold: true, align: "center",
  });

  slide.addText("The innovation that doesn't just build companies \u2014 it builds countries.", {
    x: 1.5, y: 2.5, w: 7, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, color: C.white, align: "center", transparency: 12,
  });

  // Contact items
  const contacts = [
    "spending.arinze.online",
    "arinze@ournigeria.com",
    "t.me/OurNigeriaBot",
  ];

  contacts.forEach((c, i) => {
    const x = 1.8 + i * 2.4;
    slide.addShape(pres.ShapeType.rect, {
      x, y: 3.25, w: 2.1, h: 0.35, rectRadius: 0.06,
      fill: { color: C.white },
      transparency: 85,
    });
    slide.addText(c, {
      x, y: 3.25, w: 2.1, h: 0.35,
      fontFace: FONT_BODY, fontSize: 9.5, color: C.white, align: "center",
    });
  });

  slide.addText("Confidential  |  March 2026", {
    x: 2, y: 4.4, w: 6, h: 0.25,
    fontFace: FONT_BODY, fontSize: 9, color: C.white, align: "center", transparency: 50,
  });
}

// ─── Write File ───
const outPath = join(__dirname, "ournigeria-pitch-deck.pptx");
await pres.writeFile({ fileName: outPath });
console.log("Pitch deck saved to:", outPath);
