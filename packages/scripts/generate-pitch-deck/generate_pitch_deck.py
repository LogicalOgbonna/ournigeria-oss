#!/usr/bin/env python3
"""Generate the Our Nigeria pitch deck PowerPoint presentation."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# ── Brand Colors ──────────────────────────────────────────────
EMERALD   = RGBColor(0x10, 0xB9, 0x81)  # Primary brand
EMERALD_D = RGBColor(0x05, 0x96, 0x69)  # Dark emerald
DARK_BG   = RGBColor(0x0A, 0x0A, 0x0A)  # Near-black
DARK_2    = RGBColor(0x11, 0x11, 0x11)  # Card bg
DARK_3    = RGBColor(0x1A, 0x1A, 0x1A)  # Lighter card
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT     = RGBColor(0xD1, 0xD5, 0xDB)  # Muted text
MUTED     = RGBColor(0x9C, 0xA3, 0xAF)  # Secondary text
RED_ACC   = RGBColor(0xEF, 0x44, 0x44)  # Danger/corruption
AMBER     = RGBColor(0xF5, 0x9E, 0x0B)  # Highlight
BLUE_ACC  = RGBColor(0x3B, 0x82, 0xF6)  # Info accent

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
W = prs.slide_width
H = prs.slide_height


# ── Helper Functions ──────────────────────────────────────────

def add_bg(slide, color=DARK_BG):
    """Fill the entire slide background with a solid color."""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_rect(slide, left, top, width, height, fill_color=None, border_color=None, border_width=Pt(0)):
    """Add a rounded rectangle shape."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.background()
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    ln = shape.line
    if border_color:
        ln.color.rgb = border_color
        ln.width = border_width
    else:
        ln.fill.background()
    return shape


def add_text_box(slide, left, top, width, height, text, font_size=18, color=WHITE,
                 bold=False, alignment=PP_ALIGN.LEFT, font_name="Calibri"):
    """Add a text box with a single run."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = alignment
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.name = font_name
    return txBox


def add_multiline_text(slide, left, top, width, height, lines, default_size=16,
                       default_color=LIGHT, alignment=PP_ALIGN.LEFT, font_name="Calibri"):
    """
    Add a text box with multiple paragraphs.
    Each item in `lines` is a dict: {text, size, color, bold, spacing_after}
    """
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.alignment = alignment
        p.space_after = Pt(line.get("spacing_after", 6))
        p.space_before = Pt(line.get("spacing_before", 0))
        run = p.add_run()
        run.text = line.get("text", "")
        run.font.size = Pt(line.get("size", default_size))
        run.font.color.rgb = line.get("color", default_color)
        run.font.bold = line.get("bold", False)
        run.font.name = font_name
    return txBox


def add_accent_line(slide, left, top, width=Inches(0.6), color=EMERALD):
    """Draw a small horizontal accent bar."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Pt(4))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def add_stat_card(slide, left, top, number, label, accent=EMERALD):
    """Add a stat card with a big number and label."""
    card_w = Inches(2.6)
    card_h = Inches(1.8)
    add_rect(slide, left, top, card_w, card_h, fill_color=DARK_3, border_color=RGBColor(0x2A, 0x2A, 0x2A), border_width=Pt(1))
    add_text_box(slide, left + Inches(0.25), top + Inches(0.25), card_w - Inches(0.5), Inches(0.8),
                 number, font_size=32, color=accent, bold=True, alignment=PP_ALIGN.LEFT)
    add_text_box(slide, left + Inches(0.25), top + Inches(1.0), card_w - Inches(0.5), Inches(0.6),
                 label, font_size=13, color=MUTED, bold=False, alignment=PP_ALIGN.LEFT)


def add_slide_number(slide, num, total):
    """Add slide number at the bottom right."""
    add_text_box(slide, W - Inches(1.5), H - Inches(0.5), Inches(1.2), Inches(0.3),
                 f"{num} / {total}", font_size=10, color=MUTED, alignment=PP_ALIGN.RIGHT)


TOTAL_SLIDES = 16


# ══════════════════════════════════════════════════════════════
#  SLIDE 1 — TITLE / COVER
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
add_bg(slide)

# Top accent bar
add_rect(slide, Inches(0), Inches(0), W, Pt(4), fill_color=EMERALD)

# Brand pill
pill = add_rect(slide, Inches(0.8), Inches(1.2), Inches(2.2), Inches(0.45), fill_color=DARK_3, border_color=EMERALD, border_width=Pt(1))
add_text_box(slide, Inches(0.8), Inches(1.2), Inches(2.2), Inches(0.45),
             "OUR NIGERIA", font_size=14, color=EMERALD, bold=True, alignment=PP_ALIGN.CENTER)

# Main headline
add_multiline_text(slide, Inches(0.8), Inches(2.3), Inches(8), Inches(2.8), [
    {"text": "To Fix Our Country,", "size": 52, "color": WHITE, "bold": True, "spacing_after": 2},
    {"text": "We Must Know.", "size": 52, "color": EMERALD, "bold": True, "spacing_after": 20},
    {"text": "AI-powered transparency for Nigerian government budgets,", "size": 20, "color": LIGHT, "spacing_after": 2},
    {"text": "spending, and corruption data. Ask in English or Pidgin.", "size": 20, "color": LIGHT, "spacing_after": 20},
    {"text": "Because na your money.", "size": 18, "color": EMERALD, "bold": True},
])

# Right side — key stat cards
add_stat_card(slide, Inches(9.5), Inches(1.6), "700+", "Budget Documents\nIngested")
add_stat_card(slide, Inches(9.5), Inches(3.7), "37", "States & FCT\nCovered")
add_stat_card(slide, Inches(9.5), Inches(5.8), "2M+", "Data Points\nIndexed")

add_slide_number(slide, 1, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 2 — THE PROBLEM
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "THE PROBLEM", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(10), Inches(1.0),
             "200 million Nigerians are locked out of understanding\nhow their own money is spent.",
             font_size=36, color=WHITE, bold=True)

problems = [
    {"icon": "01", "title": "Government Spending is Opaque",
     "desc": "Budget documents are buried in dense PDFs across dozens of government websites. No unified access point exists for citizens."},
    {"icon": "02", "title": "Information Overload & Jargon",
     "desc": "Thousands of pages of technical budget data written in dense bureaucratic language that excludes the average Nigerian."},
    {"icon": "03", "title": "Corruption is Hard to Track",
     "desc": "EFCC and ICPC case records are scattered across news articles and court filings. No searchable database exists for citizens."},
    {"icon": "04", "title": "No Accountability Infrastructure",
     "desc": "Citizens cannot compare spending across states, track contractor payments, or verify where public funds actually go."},
]

for i, p in enumerate(problems):
    col = i % 2
    row = i // 2
    x = Inches(0.8) + col * Inches(6.2)
    y = Inches(3.0) + row * Inches(2.1)
    card_w = Inches(5.8)
    card_h = Inches(1.85)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=RGBColor(0x2A, 0x2A, 0x2A), border_width=Pt(1))
    add_text_box(slide, x + Inches(0.15), y + Inches(0.15), Inches(0.5), Inches(0.4),
                 p["icon"], font_size=22, color=EMERALD, bold=True)
    add_text_box(slide, x + Inches(0.7), y + Inches(0.15), card_w - Inches(0.9), Inches(0.4),
                 p["title"], font_size=17, color=WHITE, bold=True)
    add_text_box(slide, x + Inches(0.7), y + Inches(0.65), card_w - Inches(0.9), Inches(1.0),
                 p["desc"], font_size=13, color=MUTED)

add_slide_number(slide, 2, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 3 — MARKET OPPORTUNITY
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "MARKET OPPORTUNITY", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.8),
             "The intersection of civic tech, AI, and Africa's largest democracy",
             font_size=32, color=WHITE, bold=True)

# TAM / SAM / SOM
circles = [
    {"label": "TAM", "value": "200M+", "desc": "Nigerian citizens with a right to\nknow how public money is spent", "x": Inches(1.0), "color": EMERALD},
    {"label": "SAM", "value": "45M+", "desc": "Internet-active Nigerians engaged\nwith news, politics, and civic issues", "x": Inches(5.0), "color": EMERALD_D},
    {"label": "SOM", "value": "2M+", "desc": "Journalists, researchers, NGOs,\nstudents, and active civic citizens", "x": Inches(9.0), "color": AMBER},
]

for c in circles:
    cx = c["x"]
    card_w = Inches(3.5)
    card_h = Inches(3.0)
    add_rect(slide, cx, Inches(2.5), card_w, card_h, fill_color=DARK_3, border_color=c["color"], border_width=Pt(2))
    add_text_box(slide, cx, Inches(2.7), card_w, Inches(0.4),
                 c["label"], font_size=14, color=c["color"], bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, cx, Inches(3.2), card_w, Inches(0.7),
                 c["value"], font_size=44, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, cx, Inches(4.2), card_w, Inches(0.8),
                 c["desc"], font_size=13, color=MUTED, alignment=PP_ALIGN.CENTER)

# Market drivers
add_multiline_text(slide, Inches(0.8), Inches(5.8), Inches(11.5), Inches(1.5), [
    {"text": "Why Now?", "size": 18, "color": WHITE, "bold": True, "spacing_after": 8},
    {"text": "Nigeria's 2026 federal budget is N58.47 trillion  --  the largest ever. Public demand for transparency is at an all-time high.", "size": 14, "color": LIGHT, "spacing_after": 4},
    {"text": "AI advancements now make it possible to process 700+ budget documents and make them conversational.  |  Africa's civic tech market is projected to grow 25%+ YoY.", "size": 14, "color": MUTED},
])

add_slide_number(slide, 3, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 4 — THE SOLUTION
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "OUR SOLUTION", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(1.0),
             "Most platforms give you raw PDFs.\nWe give you answers.",
             font_size=36, color=WHITE, bold=True)

features = [
    {"title": "Uncover The Truth", "pidgin": '"Find any record wey government hide"',
     "desc": "Search through 700+ budget documents, federal contractor payments, and corruption records across all 36 states + FCT."},
    {"title": "Ask in Plain Language", "pidgin": '"Just ask like you dey talk to person"',
     "desc": "No need to read thousands of complex pages. Ask questions in English or Pidgin and get clear, data-backed answers."},
    {"title": "Track Accountability", "pidgin": '"See who dey do well and who dey mess up"',
     "desc": "Compare state budgets, track real-time GovSpend payments, and monitor EFCC/ICPC corruption investigations."},
    {"title": "100% Transparent", "pidgin": '"Everything dey open, nothing dey hide"',
     "desc": "All data from official government budget documents, financial portals, and anti-corruption agencies. Every answer cites sources."},
]

for i, f in enumerate(features):
    x = Inches(0.8) + i * Inches(3.1)
    y = Inches(3.0)
    card_w = Inches(2.9)
    card_h = Inches(4.0)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=RGBColor(0x2A, 0x2A, 0x2A), border_width=Pt(1))
    # Top accent
    add_rect(slide, x, y, card_w, Pt(3), fill_color=EMERALD)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.25), card_w - Inches(0.4), Inches(0.4),
                 f["title"], font_size=16, color=WHITE, bold=True)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.7), card_w - Inches(0.4), Inches(0.6),
                 f["pidgin"], font_size=12, color=EMERALD, bold=False)
    add_text_box(slide, x + Inches(0.2), y + Inches(1.5), card_w - Inches(0.4), Inches(2.3),
                 f["desc"], font_size=12, color=MUTED)

add_slide_number(slide, 4, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 5 — HOW IT WORKS (USER FLOW)
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "HOW IT WORKS", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "From question to insight in seconds",
             font_size=32, color=WHITE, bold=True)

steps = [
    {"num": "1", "title": "Ask a Question",
     "desc": "Type your question in plain English or Pidgin. No login required for free tier.\n\nExample: \"How much did Lagos State budget for education in 2026?\"",
     "color": EMERALD},
    {"num": "2", "title": "AI Agents Analyze",
     "desc": "Our multi-agent pipeline routes your query to specialized analysts — Budget, Corruption, GovSpend, or Impact — who search 708K+ vector embeddings.",
     "color": BLUE_ACC},
    {"num": "3", "title": "Get Verified Answers",
     "desc": "Receive a clear, sourced answer with interactive charts (22 types), real-world impact analysis, and links to original government documents.",
     "color": AMBER},
]

for i, s in enumerate(steps):
    x = Inches(0.8) + i * Inches(4.1)
    y = Inches(2.5)
    card_w = Inches(3.8)
    card_h = Inches(4.5)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=s["color"], border_width=Pt(2))
    # Number circle
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.2), y + Inches(0.25), Inches(0.5), Inches(0.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = s["color"]
    circle.line.fill.background()
    add_text_box(slide, x + Inches(0.2), y + Inches(0.25), Inches(0.5), Inches(0.5),
                 s["num"], font_size=20, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, x + Inches(0.85), y + Inches(0.3), card_w - Inches(1.1), Inches(0.4),
                 s["title"], font_size=18, color=WHITE, bold=True)
    add_text_box(slide, x + Inches(0.25), y + Inches(1.1), card_w - Inches(0.5), Inches(3.2),
                 s["desc"], font_size=13, color=LIGHT)

# Arrow connectors (text-based)
for i in range(2):
    x = Inches(0.8) + (i + 1) * Inches(4.1) - Inches(0.35)
    add_text_box(slide, x, Inches(4.3), Inches(0.5), Inches(0.5),
                 ">>", font_size=28, color=EMERALD, bold=True, alignment=PP_ALIGN.CENTER)

add_slide_number(slide, 5, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 6 — PRODUCT DEMO / FEATURES DEEP DIVE
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "PRODUCT FEATURES", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Wetin Dey Happen? -- A Platform Built for Citizens",
             font_size=32, color=WHITE, bold=True)

left_features = [
    {"title": "AI Chat with Budget Analysis", "desc": "Multi-agent pipeline: Router, Budget Analyst, Corruption Analyst, Impact Analyst, GovSpend Analyst. Streaming responses via SSE."},
    {"title": "22 Interactive Chart Types", "desc": "Bar, line, pie, treemap, waterfall, heatmap, gauge, radar, and more. Auto-generated from AI responses with Naira formatting."},
    {"title": "Pidgin English Support", "desc": "Ask in plain English or Pidgin and get answers that everyone can understand. \"Wetin be Lagos 2023 budget?\""},
    {"title": "Shareable Public Conversations", "desc": "Toggle conversations public with SEO-optimized pages, Open Graph metadata, and JSON-LD structured data for search indexing."},
]

right_features = [
    {"title": "Real-Time GovSpend Tracker", "desc": "Daily contractor payment data. Track ministry spending, beneficiary details, and historical records from 2018-2025."},
    {"title": "Corruption Case Database", "desc": "Searchable EFCC and ICPC cases with charges, amounts, status, officials, and outcomes. Timeline tracking."},
    {"title": "Phone-Only Auth + Telegram", "desc": "No passwords. OTP via phone (+234), Telegram OAuth, and session-based auth with 5-year cookies. Zero friction."},
    {"title": "Admin Dashboard", "desc": "32+ pages covering ingestion tracking, conversation analytics, user metrics, feedback management, and system health."},
]

for i, f in enumerate(left_features):
    y = Inches(2.4) + i * Inches(1.25)
    add_rect(slide, Inches(0.8), y, Inches(5.8), Inches(1.1), fill_color=DARK_3)
    add_text_box(slide, Inches(1.0), y + Inches(0.08), Inches(5.4), Inches(0.35),
                 f["title"], font_size=14, color=EMERALD, bold=True)
    add_text_box(slide, Inches(1.0), y + Inches(0.45), Inches(5.4), Inches(0.6),
                 f["desc"], font_size=11, color=MUTED)

for i, f in enumerate(right_features):
    y = Inches(2.4) + i * Inches(1.25)
    add_rect(slide, Inches(6.9), y, Inches(5.8), Inches(1.1), fill_color=DARK_3)
    add_text_box(slide, Inches(7.1), y + Inches(0.08), Inches(5.4), Inches(0.35),
                 f["title"], font_size=14, color=EMERALD, bold=True)
    add_text_box(slide, Inches(7.1), y + Inches(0.45), Inches(5.4), Inches(0.6),
                 f["desc"], font_size=11, color=MUTED)

add_slide_number(slide, 6, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 7 — DATA & COVERAGE
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "DATA COVERAGE", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "The most comprehensive Nigerian public finance dataset",
             font_size=32, color=WHITE, bold=True)

# Stats row
stats = [
    {"num": "700+", "label": "Budget Documents\nProcessed", "color": EMERALD},
    {"num": "37", "label": "States + FCT\nCovered", "color": EMERALD},
    {"num": "708,309", "label": "Vector Chunks\nIndexed", "color": BLUE_ACC},
    {"num": "6+", "label": "Data Sources\nIntegrated", "color": AMBER},
]
for i, s in enumerate(stats):
    x = Inches(0.8) + i * Inches(3.1)
    add_stat_card(slide, x, Inches(2.3), s["num"], s["label"], accent=s["color"])

# Data sources
sources = [
    {"name": "State Budgets", "detail": "700+ documents across all 36 states + FCT, multiple years", "status": "LIVE"},
    {"name": "Federal Budget", "detail": "N58.47 trillion (2026) — full allocation data", "status": "LIVE"},
    {"name": "GovSpend Payments", "detail": "Daily federal contractor payments (2018-2025)", "status": "LIVE"},
    {"name": "EFCC Cases", "detail": "Economic and Financial Crimes Commission investigations", "status": "LIVE"},
    {"name": "ICPC Cases", "detail": "Independent Corrupt Practices Commission records", "status": "LIVE"},
    {"name": "Senate Bills & MDAs", "detail": "109 Senators, 360 HOR Members, legislation tracking", "status": "COMING"},
]

for i, src in enumerate(sources):
    col = i % 2
    row = i // 2
    x = Inches(0.8) + col * Inches(6.2)
    y = Inches(4.5) + row * Inches(0.85)
    card_w = Inches(5.9)
    card_h = Inches(0.7)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.05), Inches(3.0), Inches(0.3),
                 src["name"], font_size=13, color=WHITE, bold=True)
    status_color = EMERALD if src["status"] == "LIVE" else AMBER
    add_text_box(slide, x + card_w - Inches(1.0), y + Inches(0.05), Inches(0.8), Inches(0.3),
                 src["status"], font_size=10, color=status_color, bold=True, alignment=PP_ALIGN.RIGHT)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.35), card_w - Inches(0.4), Inches(0.3),
                 src["detail"], font_size=11, color=MUTED)

add_slide_number(slide, 7, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 8 — TECHNOLOGY & ARCHITECTURE
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "TECHNOLOGY", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Production-grade AI infrastructure built for scale",
             font_size=32, color=WHITE, bold=True)

# Architecture diagram as text
arch_text = """CLIENTS                                    AI PIPELINE
  Web App (Next.js)                          Router Agent
  Telegram Bot (@ournigeria)                    Budget Analyst
  Admin Dashboard                               Corruption Analyst
  Landing Page (Static)                          GovSpend Analyst
                                                 Impact Analyst
         |
         v                                 INFRASTRUCTURE
  NestJS API                                PostgreSQL 16 + pgvector
  (SSE Streaming)                           Voyage AI Embeddings (1024-dim)
  (OTP + Telegram Auth)                     708K+ Vector Chunks
  (Mastra Multi-Agent)                      Docker Compose (Production)"""

add_rect(slide, Inches(0.8), Inches(2.3), Inches(7.5), Inches(4.0), fill_color=DARK_3, border_color=RGBColor(0x2A, 0x2A, 0x2A), border_width=Pt(1))
add_text_box(slide, Inches(1.0), Inches(2.5), Inches(7.1), Inches(3.6),
             arch_text, font_size=12, color=LIGHT, font_name="Courier New")

# Tech stack cards on the right
tech_groups = [
    {"title": "Backend", "items": "NestJS  /  Mastra AI  /  Prisma\nPostgreSQL 16  /  pgvector", "color": EMERALD},
    {"title": "Frontend", "items": "Next.js 16  /  React 19\nTailwind v4  /  Recharts", "color": BLUE_ACC},
    {"title": "AI & Data", "items": "Claude (Anthropic)  /  Voyage AI\nLangfuse  /  Tesseract OCR", "color": AMBER},
    {"title": "DevOps", "items": "Docker Compose  /  Nx Monorepo\npnpm  /  Infisical  /  OTEL", "color": EMERALD_D},
]

for i, tg in enumerate(tech_groups):
    y = Inches(2.3) + i * Inches(1.0)
    x = Inches(8.6)
    card_w = Inches(4.0)
    card_h = Inches(0.9)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=tg["color"], border_width=Pt(1.5))
    add_text_box(slide, x + Inches(0.15), y + Inches(0.05), Inches(1.2), Inches(0.3),
                 tg["title"], font_size=11, color=tg["color"], bold=True)
    add_text_box(slide, x + Inches(0.15), y + Inches(0.35), card_w - Inches(0.3), Inches(0.5),
                 tg["items"], font_size=10, color=MUTED)

add_slide_number(slide, 8, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 9 — MULTI-AGENT AI PIPELINE
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "AI ARCHITECTURE", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Multi-Agent Pipeline: Specialized analysts for every query",
             font_size=32, color=WHITE, bold=True)

agents = [
    {"name": "Router Agent", "role": "Intent Detection & Routing",
     "desc": "Classifies incoming queries and routes to the appropriate specialist agent. Handles conversation context, follow-up resolution, and user profiling.",
     "color": EMERALD},
    {"name": "Budget Analyst", "role": "State & Federal Budget Search",
     "desc": "Searches 708K+ vector chunks from 700+ budget documents. Performs query decomposition, multi-state comparison, and year-over-year analysis with source citations.",
     "color": BLUE_ACC},
    {"name": "Corruption Analyst", "role": "EFCC & ICPC Case Research",
     "desc": "Searches corruption case records. Returns charges, amounts, officials involved, conviction status, and case timelines from anti-corruption agencies.",
     "color": RED_ACC},
    {"name": "GovSpend Analyst", "role": "Real-Time Payment Tracking",
     "desc": "Queries daily federal contractor payment data. Tracks ministry spending, beneficiary identification, and historical payment patterns (2018-2025).",
     "color": AMBER},
    {"name": "Impact Analyst", "role": "Real-World Translation",
     "desc": "Translates raw budget figures into relatable real-world equivalents. \"N2.4B could build 48 primary schools\" — making numbers meaningful for citizens.",
     "color": EMERALD_D},
]

for i, a in enumerate(agents):
    x = Inches(0.8)
    y = Inches(2.3) + i * Inches(1.0)
    card_w = Inches(11.7)
    card_h = Inches(0.9)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=a["color"], border_width=Pt(1.5))
    # Color dot
    dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.2), y + Inches(0.3), Inches(0.25), Inches(0.25))
    dot.fill.solid()
    dot.fill.fore_color.rgb = a["color"]
    dot.line.fill.background()
    add_text_box(slide, x + Inches(0.55), y + Inches(0.08), Inches(2.5), Inches(0.35),
                 a["name"], font_size=14, color=WHITE, bold=True)
    add_text_box(slide, x + Inches(0.55), y + Inches(0.45), Inches(2.5), Inches(0.35),
                 a["role"], font_size=10, color=a["color"], bold=True)
    add_text_box(slide, x + Inches(3.3), y + Inches(0.1), Inches(8.0), Inches(0.7),
                 a["desc"], font_size=11, color=MUTED)

add_slide_number(slide, 9, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 10 — BUSINESS MODEL & PRICING
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "BUSINESS MODEL", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Freemium SaaS with tiered subscriptions",
             font_size=32, color=WHITE, bold=True)

tiers = [
    {"name": "Free", "price": "N0", "period": "forever", "for": "Casual Citizens & Students",
     "features": ["10 messages/day", "Budget Analysis", "Corruption Tracker", "Pidgin Support", "GovSpend (3/day)", "24-hour history"],
     "border": MUTED},
    {"name": "Starter", "price": "N1,500", "period": "/month", "for": "Active Citizens & Journalists",
     "features": ["100 messages/day", "Unlimited GovSpend", "30-day history", "Impact Analysis (5/day)", "Chart Export (PNG/CSV)", "Public Sharing"],
     "border": EMERALD, "popular": True},
    {"name": "Pro", "price": "N5,000", "period": "/month", "for": "Analysts & Researchers",
     "features": ["Unlimited messages", "Unlimited history", "Source Doc Download", "Full PDF RAG", "Premium AI Models", "Priority Support"],
     "border": BLUE_ACC},
    {"name": "Institutional", "price": "N50,000+", "period": "/month", "for": "Newsrooms, NGOs & Agencies",
     "features": ["Everything in Pro", "5+ Team Seats", "API Access (1K/mo)", "Custom Ingestion", "White-label Reports", "Dedicated Rep"],
     "border": AMBER},
]

for i, t in enumerate(tiers):
    x = Inches(0.6) + i * Inches(3.15)
    y = Inches(2.3)
    card_w = Inches(3.0)
    card_h = Inches(5.0)
    bw = Pt(2) if t.get("popular") else Pt(1)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=t["border"], border_width=bw)

    if t.get("popular"):
        pill = add_rect(slide, x + Inches(0.6), y - Inches(0.15), Inches(1.8), Inches(0.3), fill_color=EMERALD)
        add_text_box(slide, x + Inches(0.6), y - Inches(0.15), Inches(1.8), Inches(0.3),
                     "MOST POPULAR", font_size=9, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

    add_text_box(slide, x + Inches(0.2), y + Inches(0.25), card_w - Inches(0.4), Inches(0.35),
                 t["name"], font_size=16, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

    add_multiline_text(slide, x + Inches(0.2), y + Inches(0.65), card_w - Inches(0.4), Inches(0.7), [
        {"text": t["price"], "size": 28, "color": t["border"], "bold": True, "spacing_after": 0},
        {"text": t["period"], "size": 12, "color": MUTED, "spacing_after": 2},
    ], alignment=PP_ALIGN.CENTER)

    add_text_box(slide, x + Inches(0.2), y + Inches(1.5), card_w - Inches(0.4), Inches(0.35),
                 t["for"], font_size=10, color=LIGHT, alignment=PP_ALIGN.CENTER)

    feature_lines = []
    for feat in t["features"]:
        feature_lines.append({"text": f"  {feat}", "size": 11, "color": MUTED, "spacing_after": 4})
    add_multiline_text(slide, x + Inches(0.25), y + Inches(2.1), card_w - Inches(0.5), Inches(2.7), feature_lines)

add_slide_number(slide, 10, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 11 — TRACTION & METRICS
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "TRACTION", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "What we have built — ready for launch",
             font_size=32, color=WHITE, bold=True)

milestones = [
    {"label": "Full Platform Built", "desc": "Production-ready web app, API, admin dashboard, Telegram bot, ingestion pipeline, and landing page.", "status": "DONE"},
    {"label": "700+ Documents Ingested", "desc": "Budget documents from all 36 states + FCT processed into 708,309 searchable vector chunks with zero errors.", "status": "DONE"},
    {"label": "Multi-Agent AI Pipeline", "desc": "5 specialized AI agents (Router, Budget, Corruption, GovSpend, Impact) with streaming responses.", "status": "DONE"},
    {"label": "22 Interactive Chart Types", "desc": "Auto-generated data visualizations with Naira formatting, rendered inline within chat responses.", "status": "DONE"},
    {"label": "Telegram Bot Live", "desc": "@ournigeria on Telegram — full AI chat capabilities, automatic user creation, webhook-based.", "status": "DONE"},
    {"label": "Admin Dashboard", "desc": "32+ pages: ingestion tracking, conversation analytics, user metrics, feedback, vector search, system health.", "status": "DONE"},
    {"label": "SEO-Optimized Public Sharing", "desc": "Shareable conversation pages with Open Graph, JSON-LD FAQPage schema, and SSR for search indexing.", "status": "DONE"},
    {"label": "Docker Production Deploy", "desc": "Full Docker Compose stack with health checks, memory limits, and auto-migration on startup.", "status": "DONE"},
]

for i, m in enumerate(milestones):
    col = i % 2
    row = i // 2
    x = Inches(0.8) + col * Inches(6.2)
    y = Inches(2.3) + row * Inches(1.2)
    card_w = Inches(5.9)
    card_h = Inches(1.05)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.08), Inches(4.5), Inches(0.3),
                 m["label"], font_size=13, color=WHITE, bold=True)
    sc = EMERALD if m["status"] == "DONE" else AMBER
    add_text_box(slide, x + card_w - Inches(0.8), y + Inches(0.08), Inches(0.6), Inches(0.3),
                 m["status"], font_size=10, color=sc, bold=True, alignment=PP_ALIGN.RIGHT)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.45), card_w - Inches(0.4), Inches(0.55),
                 m["desc"], font_size=11, color=MUTED)

add_slide_number(slide, 11, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 12 — COMPETITIVE LANDSCAPE
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "COMPETITIVE LANDSCAPE", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "No direct competitor combines AI + Nigerian budget data at this depth",
             font_size=28, color=WHITE, bold=True)

# Comparison table header
header_y = Inches(2.4)
col_x = [Inches(0.8), Inches(4.2), Inches(6.4), Inches(8.6), Inches(10.8)]
col_w = [Inches(3.2), Inches(2.0), Inches(2.0), Inches(2.0), Inches(2.0)]
headers = ["Feature", "Our Nigeria", "BudgIT", "GovSpend.ng", "Manual PDF"]
for i, h in enumerate(headers):
    c = EMERALD if i == 1 else WHITE
    add_rect(slide, col_x[i], header_y, col_w[i], Inches(0.5), fill_color=DARK_3 if i != 1 else EMERALD_D)
    add_text_box(slide, col_x[i], header_y, col_w[i], Inches(0.5),
                 h, font_size=12, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

rows = [
    ["AI Conversational Search", "Yes", "No", "No", "No"],
    ["All 36 States + FCT", "Yes", "Partial", "Federal only", "Varies"],
    ["Corruption Case Tracking", "Yes", "No", "No", "No"],
    ["Real-Time GovSpend Data", "Yes", "No", "Yes", "No"],
    ["Pidgin English Support", "Yes", "No", "No", "No"],
    ["Interactive Charts (22 types)", "Yes", "Limited", "Limited", "No"],
    ["Telegram Bot", "Yes", "No", "No", "No"],
    ["Source-Cited Answers", "Yes", "N/A", "N/A", "N/A"],
    ["Public Sharing + SEO", "Yes", "No", "No", "No"],
]

for ri, row in enumerate(rows):
    ry = Inches(2.95) + ri * Inches(0.47)
    bg = DARK_3 if ri % 2 == 0 else DARK_2
    for ci, cell in enumerate(row):
        c = EMERALD if ci == 1 and cell == "Yes" else (MUTED if cell in ("No", "N/A") else LIGHT)
        add_rect(slide, col_x[ci], ry, col_w[ci], Inches(0.42), fill_color=bg)
        al = PP_ALIGN.LEFT if ci == 0 else PP_ALIGN.CENTER
        fs = 11 if ci == 0 else 11
        add_text_box(slide, col_x[ci] + Inches(0.1), ry + Inches(0.04), col_w[ci] - Inches(0.2), Inches(0.35),
                     cell, font_size=fs, color=c, bold=(ci == 1 and cell == "Yes"), alignment=al)

add_slide_number(slide, 12, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 13 — GO-TO-MARKET STRATEGY
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "GO-TO-MARKET", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Three-phase growth strategy",
             font_size=32, color=WHITE, bold=True)

phases = [
    {"phase": "PHASE 1", "title": "Launch & Organic Growth", "timeline": "Q1-Q2 2026",
     "items": [
         "Launch free tier to build user base and word-of-mouth",
         "Telegram bot as viral distribution channel (@ournigeria)",
         "SEO through public shared conversations (Google indexing)",
         "Partner with civic tech Twitter/X influencers",
         "University campus ambassador program",
     ], "color": EMERALD},
    {"phase": "PHASE 2", "title": "Monetization & Partnerships", "timeline": "Q3-Q4 2026",
     "items": [
         "Activate Starter & Pro paid tiers (N1,500 - N5,000/mo)",
         "Partner with media houses (Premium Times, The Cable, Sahara Reporters)",
         "NGO partnerships (Transparency International, CISLAC, BPP)",
         "WhatsApp channel for mass reach (100M+ Nigerian users)",
         "Content marketing: weekly budget insight reports",
     ], "color": BLUE_ACC},
    {"phase": "PHASE 3", "title": "Scale & Enterprise", "timeline": "2027+",
     "items": [
         "Launch Institutional tier (N50,000+/mo) for newsrooms & agencies",
         "API access for third-party integrations",
         "Expand to other African countries (Ghana, Kenya, South Africa)",
         "Government and World Bank partnerships",
         "Custom data ingestion for enterprise clients",
     ], "color": AMBER},
]

for i, ph in enumerate(phases):
    x = Inches(0.8) + i * Inches(4.1)
    y = Inches(2.3)
    card_w = Inches(3.8)
    card_h = Inches(4.8)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3, border_color=ph["color"], border_width=Pt(2))
    add_text_box(slide, x + Inches(0.2), y + Inches(0.15), card_w - Inches(0.4), Inches(0.3),
                 ph["phase"], font_size=11, color=ph["color"], bold=True)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.45), card_w - Inches(0.4), Inches(0.4),
                 ph["title"], font_size=16, color=WHITE, bold=True)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.9), card_w - Inches(0.4), Inches(0.3),
                 ph["timeline"], font_size=12, color=MUTED, bold=True)

    item_lines = []
    for item in ph["items"]:
        item_lines.append({"text": f"  {item}", "size": 11, "color": LIGHT, "spacing_after": 6})
    add_multiline_text(slide, x + Inches(0.2), y + Inches(1.4), card_w - Inches(0.4), Inches(3.2), item_lines)

add_slide_number(slide, 13, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 14 — TEAM
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "THE TEAM", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Built by Nigerians, for Nigerians",
             font_size=32, color=WHITE, bold=True)

# Founder card — large and centered
card_w = Inches(8)
card_h = Inches(3.5)
card_x = (W - card_w) // 2
card_y = Inches(2.5)
add_rect(slide, card_x, card_y, card_w, card_h, fill_color=DARK_3, border_color=EMERALD, border_width=Pt(2))

add_multiline_text(slide, card_x + Inches(0.5), card_y + Inches(0.3), card_w - Inches(1), Inches(3.0), [
    {"text": "Founder & Technical Lead", "size": 12, "color": EMERALD, "bold": True, "spacing_after": 8},
    {"text": "[Your Name Here]", "size": 28, "color": WHITE, "bold": True, "spacing_after": 12},
    {"text": "Full-stack engineer who single-handedly designed and built the entire Our Nigeria platform:", "size": 14, "color": LIGHT, "spacing_after": 12},
    {"text": "  NestJS multi-agent API  /  Next.js web & admin apps  /  Telegram bot", "size": 13, "color": MUTED, "spacing_after": 4},
    {"text": "  Custom document ingestion pipeline (PDF OCR, Excel, DOCX)", "size": 13, "color": MUTED, "spacing_after": 4},
    {"text": "  708K+ vector embeddings  /  Docker production deployment", "size": 13, "color": MUTED, "spacing_after": 4},
    {"text": "  Remotion programmatic video generation", "size": 13, "color": MUTED, "spacing_after": 12},
    {"text": "From data collection to AI pipeline to pixel-perfect frontend — one person, one mission.", "size": 14, "color": EMERALD, "bold": True},
])

# Bottom note
add_text_box(slide, Inches(0.8), Inches(6.3), Inches(11.5), Inches(0.6),
             "Hiring: Looking for co-founders in Product, Growth, and Data to scale Our Nigeria across Africa.",
             font_size=14, color=LIGHT, alignment=PP_ALIGN.CENTER)

add_slide_number(slide, 14, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 15 — THE ASK
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(4), Inches(0.5),
             "THE ASK", font_size=14, color=EMERALD, bold=True)
add_accent_line(slide, Inches(0.8), Inches(1.0))

add_text_box(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.6),
             "Raising pre-seed to launch and scale across Nigeria",
             font_size=32, color=WHITE, bold=True)

# Funding amount
add_rect(slide, Inches(0.8), Inches(2.4), Inches(5.5), Inches(2.5), fill_color=DARK_3, border_color=EMERALD, border_width=Pt(2))
add_multiline_text(slide, Inches(1.2), Inches(2.6), Inches(4.7), Inches(2.2), [
    {"text": "Pre-Seed Round", "size": 14, "color": EMERALD, "bold": True, "spacing_after": 8},
    {"text": "$150K - $300K", "size": 44, "color": WHITE, "bold": True, "spacing_after": 12},
    {"text": "12-18 month runway to reach 100K+ active users", "size": 14, "color": LIGHT, "spacing_after": 4},
    {"text": "and achieve product-market fit in Nigeria.", "size": 14, "color": LIGHT},
])

# Use of funds
add_rect(slide, Inches(6.8), Inches(2.4), Inches(5.8), Inches(2.5), fill_color=DARK_3, border_color=RGBColor(0x2A, 0x2A, 0x2A), border_width=Pt(1))
add_text_box(slide, Inches(7.0), Inches(2.55), Inches(5.4), Inches(0.35),
             "Use of Funds", font_size=14, color=WHITE, bold=True)

funds = [
    {"item": "Infrastructure & AI Costs", "pct": "35%", "desc": "LLM API, embeddings, hosting, database scaling"},
    {"item": "Growth & Marketing", "pct": "30%", "desc": "User acquisition, partnerships, campus ambassadors"},
    {"item": "Team Expansion", "pct": "25%", "desc": "Product, growth, and data engineering hires"},
    {"item": "Operations & Legal", "pct": "10%", "desc": "Company formation, compliance, accounting"},
]

for i, f in enumerate(funds):
    fy = Inches(3.1) + i * Inches(0.42)
    add_text_box(slide, Inches(7.0), fy, Inches(0.6), Inches(0.35),
                 f["pct"], font_size=12, color=EMERALD, bold=True)
    add_text_box(slide, Inches(7.6), fy, Inches(2.5), Inches(0.35),
                 f["item"], font_size=12, color=WHITE, bold=False)
    add_text_box(slide, Inches(10.2), fy, Inches(2.3), Inches(0.35),
                 f["desc"], font_size=10, color=MUTED)

# Milestones
add_text_box(slide, Inches(0.8), Inches(5.3), Inches(11.5), Inches(0.4),
             "Key Milestones", font_size=16, color=WHITE, bold=True)

milestones_ask = [
    {"q": "Month 1-3", "goal": "Public launch, 10K users, media partnerships"},
    {"q": "Month 4-6", "goal": "Paid tiers live, 50K users, WhatsApp integration"},
    {"q": "Month 7-12", "goal": "100K users, institutional clients, revenue breakeven path"},
    {"q": "Month 12-18", "goal": "Pan-African expansion planning, Series A readiness"},
]

for i, ms in enumerate(milestones_ask):
    x = Inches(0.8) + i * Inches(3.1)
    y = Inches(5.8)
    card_w = Inches(2.9)
    card_h = Inches(1.2)
    add_rect(slide, x, y, card_w, card_h, fill_color=DARK_3)
    add_text_box(slide, x + Inches(0.15), y + Inches(0.08), card_w - Inches(0.3), Inches(0.3),
                 ms["q"], font_size=12, color=EMERALD, bold=True)
    add_text_box(slide, x + Inches(0.15), y + Inches(0.45), card_w - Inches(0.3), Inches(0.65),
                 ms["goal"], font_size=11, color=LIGHT)

add_slide_number(slide, 15, TOTAL_SLIDES)


# ══════════════════════════════════════════════════════════════
#  SLIDE 16 — CLOSING / THANK YOU
# ══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)

# Top accent bar
add_rect(slide, Inches(0), Inches(0), W, Pt(4), fill_color=EMERALD)

add_multiline_text(slide, Inches(0.8), Inches(1.5), Inches(11.5), Inches(3.5), [
    {"text": "Together, For Our Nigeria.", "size": 52, "color": WHITE, "bold": True, "spacing_after": 20},
    {"text": "The Power Dey Your Hand, Use Am.", "size": 32, "color": EMERALD, "bold": True, "spacing_after": 30},
    {"text": "Making government spending transparent and accessible to every Nigerian citizen.", "size": 18, "color": LIGHT, "spacing_after": 6},
    {"text": "Because na your money.", "size": 18, "color": EMERALD, "bold": True, "spacing_after": 40},
], alignment=PP_ALIGN.CENTER)

# Contact card
contact_w = Inches(6)
contact_h = Inches(1.8)
contact_x = (W - contact_w) // 2
contact_y = Inches(4.8)
add_rect(slide, contact_x, contact_y, contact_w, contact_h, fill_color=DARK_3, border_color=EMERALD, border_width=Pt(2))

add_multiline_text(slide, contact_x + Inches(0.3), contact_y + Inches(0.2), contact_w - Inches(0.6), Inches(1.5), [
    {"text": "Let's Talk", "size": 18, "color": WHITE, "bold": True, "spacing_after": 10},
    {"text": "Web:  ournigeria.com    |    Telegram:  @ournigeria_bot", "size": 14, "color": LIGHT, "spacing_after": 4},
    {"text": "Twitter/X:  @awanigeria    |    GitHub:  ournigeria", "size": 14, "color": MUTED, "spacing_after": 4},
    {"text": "[your-email@domain.com]", "size": 14, "color": EMERALD},
], alignment=PP_ALIGN.CENTER)

# Footer
add_text_box(slide, Inches(0), H - Inches(0.45), W, Inches(0.35),
             "We build am with love for Naija.  |  v0.1.0  |  2026 Our Nigeria",
             font_size=11, color=MUTED, alignment=PP_ALIGN.CENTER)

add_slide_number(slide, 16, TOTAL_SLIDES)


# ── Save ──────────────────────────────────────────────────────
output_path = "/Users/arinzeogbonna/Work/personal/spending/docs/pitch_deck_claude.pptx"
prs.save(output_path)
print(f"Pitch deck saved to: {output_path}")
print(f"Total slides: {TOTAL_SLIDES}")
