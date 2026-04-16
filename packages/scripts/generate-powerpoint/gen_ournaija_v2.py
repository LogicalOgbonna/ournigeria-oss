#!/usr/bin/env python3
"""
Generate ournaija_v2.pptx — updated pitch deck with "Free for Citizens" business model.
Uses ournaija.pptx as template for theme/master slides, then rebuilds all slides.
"""

from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# ─── Design System (extracted from ournaija.pptx) ───
BG_DARK = RGBColor(0x11, 0x18, 0x27)       # slide background
GREEN = RGBColor(0x10, 0xB9, 0x81)          # brand green / accent
GREEN_DARK = RGBColor(0x05, 0x96, 0x69)     # darker green
BLUE = RGBColor(0x3B, 0x82, 0xF6)           # blue accent
AMBER = RGBColor(0xF5, 0x9E, 0x0B)          # amber/gold accent
RED = RGBColor(0xEF, 0x44, 0x44)            # red accent
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY = RGBColor(0xD1, 0xD5, 0xDB)
MID_GRAY = RGBColor(0x9C, 0xA3, 0xAF)
CARD_BG = RGBColor(0x1E, 0x29, 0x3B)        # card background
CARD_BORDER = RGBColor(0x37, 0x41, 0x51)     # card border
PURPLE = RGBColor(0xA7, 0x8B, 0xFA)          # purple accent (new)

FONT = "Calibri"
SLIDE_W = Emu(12192000)
SLIDE_H = Emu(6858000)

# Margins
LEFT_M = Emu(731520)
TOP_M = Emu(457200)


def set_slide_bg(slide, color=BG_DARK):
    """Set solid background color on a slide."""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_text_box(slide, left, top, width, height, text, font_size=14,
                 bold=False, color=WHITE, alignment=PP_ALIGN.LEFT,
                 font_name=FONT, line_spacing=None):
    """Add a text box with a single paragraph."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.name = font_name
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.alignment = alignment
    if line_spacing:
        p.line_spacing = Pt(line_spacing)
    return txBox


def add_rich_text_box(slide, left, top, width, height, runs_list,
                      alignment=PP_ALIGN.LEFT, line_spacing=None):
    """Add a text box with multiple styled runs in a single paragraph.
    runs_list: [(text, font_size, bold, color), ...]
    """
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = alignment
    if line_spacing:
        p.line_spacing = Pt(line_spacing)
    for i, (text, fsize, bold, color) in enumerate(runs_list):
        if i == 0:
            run = p.runs[0] if p.runs else p.add_run()
            run.text = text
        else:
            run = p.add_run()
            run.text = text
        run.font.name = FONT
        run.font.size = Pt(fsize)
        run.font.bold = bold
        run.font.color.rgb = color
    return txBox


def add_multi_para_box(slide, left, top, width, height, paragraphs,
                       alignment=PP_ALIGN.LEFT):
    """Add a text box with multiple paragraphs.
    paragraphs: [(text, font_size, bold, color, line_spacing_pt), ...]
    """
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, (text, fsize, bold, color, *rest) in enumerate(paragraphs):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = text
        p.font.name = FONT
        p.font.size = Pt(fsize)
        p.font.bold = bold
        p.font.color.rgb = color
        p.alignment = alignment
        if rest and rest[0]:
            p.line_spacing = Pt(rest[0])
    return txBox


def add_rounded_rect(slide, left, top, width, height, fill_color=CARD_BG,
                     border_color=None, border_width=Pt(1)):
    """Add a rounded rectangle shape."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = border_width
    else:
        shape.line.fill.background()
    return shape


def add_circle(slide, left, top, size, fill_color=GREEN):
    """Add a circle (oval) shape."""
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, size, size)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    return shape


def add_accent_bar(slide, left=LEFT_M, top=Emu(914400), width=Emu(548640), height=Emu(50800)):
    """Add the green accent bar under section titles."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = GREEN
    shape.line.fill.background()
    return shape


def add_top_bar(slide):
    """Add the thin green bar at the very top."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Emu(0), Emu(0), SLIDE_W, Emu(50800)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = GREEN
    shape.line.fill.background()
    return shape


def add_page_number(slide, num, total):
    """Add page number at bottom right."""
    add_text_box(slide, Emu(10820095), Emu(6400800), Emu(1097280), Emu(274320),
                 f"{num} / {total}", font_size=10, color=MID_GRAY,
                 alignment=PP_ALIGN.RIGHT)


def build_section_header(slide, section_text, subtitle_text):
    """Build standard section header: green label + accent bar + white subtitle."""
    add_text_box(slide, LEFT_M, TOP_M, Emu(5000000), Emu(457200),
                 section_text, font_size=14, bold=True, color=GREEN)
    add_accent_bar(slide)
    add_text_box(slide, LEFT_M, Emu(1188720), Emu(10058400), Emu(548640),
                 subtitle_text, font_size=32, bold=True, color=WHITE)


def build_stat_card(slide, left, top, stat_value, stat_label, stat_color=GREEN):
    """Build a stat card: rounded rect with big number + small label."""
    w, h = Emu(2377440), Emu(1645920)
    add_rounded_rect(slide, left, top, w, h, fill_color=CARD_BG)
    add_text_box(slide, Emu(left + 228600), Emu(top + 228600), Emu(1920240), Emu(731520),
                 stat_value, font_size=32, bold=True, color=stat_color,
                 alignment=PP_ALIGN.LEFT)
    add_multi_para_box(slide, Emu(left + 228600), Emu(top + 685800), Emu(1920240), Emu(548640),
                       [(stat_label, 13, False, MID_GRAY)])


# ─── Slide builders ───

def slide_01_title(prs, total):
    """Title slide — hero."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank
    set_slide_bg(slide)
    add_top_bar(slide)

    # Brand name
    add_text_box(slide, LEFT_M, Emu(1097280), Emu(2600000), Emu(411480),
                 "AJE", font_size=14, bold=True, color=GREEN)

    # Tagline
    add_multi_para_box(slide, LEFT_M, Emu(1700000), Emu(7315200), Emu(3200000), [
        ("To Fix Am,", 52, True, WHITE),
        ("We Must Know Am.", 52, True, GREEN),
        ("", 12, False, WHITE),
        ("AI-powered transparency for Nigerian government budgets,", 20, False, LIGHT_GRAY),
        ("spending, FAAC allocations, and corruption data.", 20, False, LIGHT_GRAY),
        ("Free for every Nigerian. Ask in English or Pidgin.", 18, True, GREEN),
    ])

    # Stat cards on right
    build_stat_card(slide, Emu(8716683), Emu(502920), "800+", "Budget Documents\nIngested")
    build_stat_card(slide, Emu(8716683), Emu(2423160), "37", "States & FCT\nCovered")
    build_stat_card(slide, Emu(8716683), Emu(4343400), "2M+", "Data Points\nIndexed", BLUE)

    add_page_number(slide, 1, total)


def slide_02_problem(prs, total):
    """The Problem."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "THE PROBLEM", "")

    add_text_box(slide, LEFT_M, Emu(1188720), Emu(10058400), Emu(1200000),
                 "200 million Nigerians are locked out of\nunderstanding how their own money is spent.",
                 font_size=36, bold=True, color=WHITE)

    # Problem cards (2x2 grid)
    cards = [
        ("01", "Government Spending is Opaque",
         "Budget documents are buried in dense PDFs across dozens of government websites. No unified access point exists."),
        ("02", "Information Overload & Jargon",
         "Thousands of pages of technical budget data written in dense bureaucratic language that excludes the average citizen."),
        ("03", "Corruption is Hard to Track",
         "EFCC and ICPC case records are scattered across news articles and court filings. No searchable database exists."),
        ("04", "FAAC Allocations Are Invisible",
         "Monthly federal revenue shared to 774 LGAs is published in impenetrable PDFs. Citizens can't track what their LGA receives."),
    ]

    positions = [
        (LEFT_M, Emu(2796987)),
        (Emu(6400800), Emu(2796987)),
        (LEFT_M, Emu(4717227)),
        (Emu(6400800), Emu(4717227)),
    ]

    card_w, card_h = Emu(5303520), Emu(1691640)

    for (num, title, desc), (cx, cy) in zip(cards, positions):
        add_rounded_rect(slide, cx, cy, card_w, card_h, fill_color=CARD_BG)
        add_text_box(slide, Emu(cx + 137160), Emu(cy + 137160), Emu(457200), Emu(365760),
                     num, font_size=22, bold=True, color=GREEN)
        add_text_box(slide, Emu(cx + 640080), Emu(cy + 137160), Emu(4480560), Emu(365760),
                     title, font_size=17, bold=True, color=WHITE)
        add_text_box(slide, Emu(cx + 640080), Emu(cy + 594360), Emu(4480560), Emu(914400),
                     desc, font_size=13, color=MID_GRAY)

    add_page_number(slide, 2, total)


def slide_03_market(prs, total):
    """Market Opportunity."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "MARKET OPPORTUNITY",
                         "The intersection of civic tech, AI, and Africa's largest democracy")

    # TAM / SAM / SOM cards
    markets = [
        ("TAM", "200M+", GREEN, "Nigerian citizens with a right to\nknow how public money is spent"),
        ("SAM", "45M+", GREEN_DARK, "Internet-active Nigerians engaged\nwith news, politics, and civic issues"),
        ("SOM", "2M+", AMBER, "Journalists, researchers, NGOs,\nstudents, and active civic citizens"),
    ]

    x_positions = [Emu(914400), Emu(4572000), Emu(8229600)]
    card_w, card_h = Emu(3200400), Emu(2743200)

    for (label, value, color, desc), x in zip(markets, x_positions):
        add_rounded_rect(slide, x, Emu(2286000), card_w, card_h, fill_color=CARD_BG)
        add_text_box(slide, x, Emu(2468880), card_w, Emu(365760),
                     label, font_size=14, bold=True, color=color,
                     alignment=PP_ALIGN.CENTER)
        add_text_box(slide, x, Emu(2926080), card_w, Emu(640080),
                     value, font_size=44, bold=True, color=WHITE,
                     alignment=PP_ALIGN.CENTER)
        add_text_box(slide, x, Emu(3840480), card_w, Emu(731520),
                     desc, font_size=13, color=MID_GRAY, alignment=PP_ALIGN.CENTER)

    # Why Now section
    add_multi_para_box(slide, LEFT_M, Emu(5303520), Emu(10515600), Emu(1371600), [
        ("Why Now?", 18, True, WHITE),
        ("Nigeria's 2026 federal budget is N58.47 trillion \u2014 the largest ever. Public demand for transparency is at an all-time high.", 14, False, LIGHT_GRAY),
        ("AI advancements now make it possible to process 800+ budget documents and make them conversational. This was impossible 2 years ago.", 14, False, MID_GRAY),
    ])

    add_page_number(slide, 3, total)


def slide_04_solution(prs, total):
    """Our Solution."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "OUR SOLUTION", "")

    add_text_box(slide, LEFT_M, Emu(1188720), Emu(10058400), Emu(914400),
                 "Most platforms give you raw PDFs.\nWe give you answers.",
                 font_size=36, bold=True, color=WHITE)

    pillars = [
        ("Uncover The Truth", '"Find any record wey government hide"',
         "Search through 800+ budget documents, federal contractor payments, FAAC allocations, and corruption records across all 36 states + FCT."),
        ("Ask in Plain Language", '"Just ask like you dey talk to person"',
         "No need to read thousands of complex pages. Ask questions in English or Pidgin and get clear, data-backed answers in seconds."),
        ("Track Accountability", '"See who dey do well and who dey mess up"',
         "Compare state budgets, track GovSpend payments, monitor FAAC disbursements to your LGA, and investigate EFCC corruption cases."),
        ("100% Free for Citizens", '"Na our money, na our right to know"',
         "Every Nigerian gets full, unlimited access. No paywalls, no message limits, no premium tiers. The data belongs to the people."),
    ]

    x_positions = [LEFT_M, Emu(3566160), Emu(6400800), Emu(9235440)]
    card_w, card_h = Emu(2651760), Emu(2695388)

    for (title, quote, desc), x in zip(pillars, x_positions):
        add_rounded_rect(slide, x, Emu(2814912), card_w, card_h, fill_color=CARD_BG)
        # Green top accent line
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, x, Emu(2814912), card_w, Emu(38100)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = GREEN
        shape.line.fill.background()

        add_text_box(slide, Emu(x + 182880), Emu(2814912 + 228600), Emu(2286000), Emu(365760),
                     title, font_size=16, bold=True, color=WHITE)
        add_text_box(slide, Emu(x + 182880), Emu(2814912 + 640080), Emu(2286000), Emu(548640),
                     quote, font_size=12, color=GREEN)
        add_text_box(slide, Emu(x + 182880), Emu(2814912 + 1371600), Emu(2286000), Emu(1200000),
                     desc, font_size=12, color=MID_GRAY)

    add_page_number(slide, 4, total)


def slide_05_how_it_works(prs, total):
    """How It Works."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "HOW IT WORKS", "From question to insight in seconds")

    steps = [
        ("1", "Ask a Question",
         "Type your question in plain English or Pidgin. No login required.\n\n"
         'Example: "How much did my LGA receive from FAAC in January 2025?"'),
        ("2", "AI Agents Analyze",
         "Our multi-agent pipeline routes your query to specialized analysts \u2014 Budget, Corruption, GovSpend, FAAC, or Impact \u2014 each with access to dedicated vector databases."),
        ("3", "Get Verified Answers",
         "Receive a clear, sourced answer with interactive charts, real-world impact analysis, and links to original government documents."),
    ]

    x_positions = [LEFT_M, Emu(4480559), Emu(8229598)]
    card_w, card_h = Emu(3474720), Emu(3248212)

    for (num, title, desc), x in zip(steps, x_positions):
        add_rounded_rect(slide, x, Emu(2286000), card_w, card_h, fill_color=CARD_BG)
        # Circle with number
        add_circle(slide, Emu(x + 182880), Emu(2514600), Emu(457200))
        add_text_box(slide, Emu(x + 182880), Emu(2514600), Emu(457200), Emu(457200),
                     num, font_size=20, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
        add_text_box(slide, Emu(x + 777240), Emu(2560320), Emu(2468880), Emu(365760),
                     title, font_size=18, bold=True, color=WHITE)
        add_text_box(slide, Emu(x + 228600), Emu(3291840), Emu(3017520), Emu(2100000),
                     desc, font_size=13, color=LIGHT_GRAY)

    # Arrow connectors
    add_text_box(slide, Emu(4160519), Emu(3931920), Emu(457200), Emu(457200),
                 "\u00BB", font_size=28, bold=True, color=GREEN, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, Emu(7909558), Emu(3931920), Emu(457200), Emu(457200),
                 "\u00BB", font_size=28, bold=True, color=GREEN, alignment=PP_ALIGN.CENTER)

    add_page_number(slide, 5, total)


def slide_06_features(prs, total):
    """Product Features."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "PRODUCT FEATURES",
                         "Wetin Dey Happen? \u2014 A Platform Built for Citizens")

    features = [
        # Left column
        ("AI Chat with Budget & FAAC Analysis",
         "6 specialized AI agents: Router, Budget, Corruption, GovSpend, FAAC, and Impact Analyst. Streaming responses with source citations."),
        ("22 Interactive Chart Types",
         "Bar, line, pie, treemap, waterfall, heatmap, gauge, radar, and more. Auto-generated from AI responses with Naira formatting."),
        ("Pidgin English Support",
         'Ask in plain English or Pidgin and get answers that everyone can understand. "Wetin be Lagos 2023 budget?" works perfectly.'),
        ("Shareable Public Conversations",
         "Toggle conversations public with SEO-optimized pages, Open Graph metadata, and JSON-LD structured data."),
        # Right column
        ("FAAC Allocation Tracker (NEW)",
         "Track monthly federal revenue sharing to all 774 LGAs across 36 states. Compare allocations between states, LGAs, and geopolitical zones."),
        ("Real-Time GovSpend Tracker",
         "891,000+ contractor payment records. Track ministry spending, beneficiary details, and historical records."),
        ("Corruption Case Database",
         "Searchable EFCC and ICPC cases with charges, amounts, status, officials, and outcomes."),
        ("Phone-Only Auth + Telegram",
         "No passwords. OTP via phone (+234), Telegram OAuth, and session-based auth. Zero friction."),
    ]

    # Left column
    for i, (title, desc) in enumerate(features[:4]):
        y = Emu(2194560 + i * 1143000)
        add_rounded_rect(slide, LEFT_M, y, Emu(5303520), Emu(1005840), fill_color=CARD_BG)
        add_text_box(slide, Emu(914400), Emu(y + 73152), Emu(4937760), Emu(320040),
                     title, font_size=14, bold=True, color=GREEN)
        add_text_box(slide, Emu(914400), Emu(y + 411480), Emu(4937760), Emu(548640),
                     desc, font_size=11, color=MID_GRAY)

    # Right column
    for i, (title, desc) in enumerate(features[4:]):
        y = Emu(2194560 + i * 1143000)
        add_rounded_rect(slide, Emu(6309360), y, Emu(5303520), Emu(1005840), fill_color=CARD_BG)
        color = AMBER if i == 0 else GREEN  # highlight FAAC as NEW
        add_text_box(slide, Emu(6492240), Emu(y + 73152), Emu(4937760), Emu(320040),
                     title, font_size=14, bold=True, color=color)
        add_text_box(slide, Emu(6492240), Emu(y + 411480), Emu(4937760), Emu(548640),
                     desc, font_size=11, color=MID_GRAY)

    add_page_number(slide, 6, total)


def slide_07_data(prs, total):
    """Data Coverage — updated with FAAC."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "DATA COVERAGE",
                         "The most comprehensive Nigerian public finance dataset")

    # Stat cards
    stats = [
        (Emu(731520), "800+", "Budget Documents\nProcessed", GREEN),
        (Emu(3566160), "37", "States + FCT\nCovered", GREEN),
        (Emu(6400800), "774", "LGAs Tracked\nvia FAAC", BLUE),
        (Emu(9235440), "891K+", "Payment Records\nSearchable", AMBER),
    ]
    for x, val, label, color in stats:
        build_stat_card(slide, x, Emu(2103120), val, label, color)

    # Data source rows
    sources = [
        ("State Budgets", "800+ documents across all 36 states + FCT, 2019\u20132025", "LIVE", GREEN),
        ("Federal Budget", "\u20A658.47 trillion (2026) \u2014 full allocation data", "LIVE", GREEN),
        ("GovSpend Payments", "891,000+ federal contractor payment records (2018\u20132025)", "LIVE", GREEN),
        ("FAAC Allocations", "84 months of federal revenue sharing to all states & 774 LGAs", "LIVE", GREEN),
        ("EFCC Cases", "Economic and Financial Crimes Commission investigations", "LIVE", GREEN),
        ("Senate Bills & MDAs", "109 Senators, 360 HOR Members, legislation tracking", "COMING", AMBER),
    ]

    for i, (name, desc, status, status_color) in enumerate(sources):
        col = i % 2
        row = i // 2
        x = LEFT_M if col == 0 else Emu(6400800)
        y = Emu(4114800 + row * 777240)
        w = Emu(5394960)
        h = Emu(640080)

        add_rounded_rect(slide, x, y, w, h, fill_color=CARD_BG)
        add_text_box(slide, Emu(x + 182880), Emu(y + 45720), Emu(2743200), Emu(274320),
                     name, font_size=13, bold=True, color=WHITE)
        add_text_box(slide, Emu(x + w - 914400), Emu(y + 45720), Emu(731520), Emu(274320),
                     status, font_size=10, bold=True, color=status_color,
                     alignment=PP_ALIGN.RIGHT)
        add_text_box(slide, Emu(x + 182880), Emu(y + 320040), Emu(5029200), Emu(274320),
                     desc, font_size=11, color=MID_GRAY)

    add_page_number(slide, 7, total)


def slide_08_technology(prs, total):
    """Technology stack."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "TECHNOLOGY",
                         "Production-grade AI infrastructure built for scale")

    # Architecture diagram (simplified ASCII in a card)
    add_rounded_rect(slide, LEFT_M, Emu(2423160), Emu(6675120), Emu(2899186), fill_color=CARD_BG)
    add_text_box(slide, Emu(914400), Emu(2606040), Emu(6492240), Emu(2500000),
                 "CLIENTS                                    AI PIPELINE\n"
                 "  Web App (Next.js)                          Router Agent\n"
                 "  Telegram Bot           \u2500\u2500\u2500\u2500\u2192   NestJS API   \u2500\u2500\u2500\u2500\u2192   Budget Analyst\n"
                 "  Shared URL Pages                           Corruption Analyst\n"
                 "                                             GovSpend Analyst\n"
                 "  DATA LAYER                                 FAAC Analyst (NEW)\n"
                 "  PostgreSQL + pgvector                      Impact Analyst\n"
                 "  AWS S3 (Source Docs)                  Embedding + Vector Search",
                 font_size=12, color=LIGHT_GRAY, font_name="Courier New")

    # Stack cards on right
    stack = [
        ("Backend", "NestJS  /  Mastra AI Agents  /  Prisma\nPostgreSQL 16  /  pgvector", GREEN),
        ("Frontend", "Next.js 16  /  React 19\nTailwind v4  /  Recharts", BLUE),
        ("AI & Data", "Gemini Flash  /  Voyage AI  /  OpenRouter\nLangfuse  /  Tesseract OCR", AMBER),
        ("DevOps", "Docker Compose  /  Nx Monorepo\npnpm  /  Infisical  /  OTEL", GREEN_DARK),
    ]

    for i, (label, desc, color) in enumerate(stack):
        y = Emu(2103120 + i * 914400)
        add_rounded_rect(slide, Emu(7863840), y, Emu(3657600), Emu(822960), fill_color=CARD_BG)
        add_text_box(slide, Emu(8001000), Emu(y + 45720), Emu(1097280), Emu(274320),
                     label, font_size=11, bold=True, color=color)
        add_text_box(slide, Emu(8001000), Emu(y + 320040), Emu(3383280), Emu(457200),
                     desc, font_size=10, color=MID_GRAY)

    add_page_number(slide, 8, total)


def slide_09_ai_architecture(prs, total):
    """AI Architecture — multi-agent pipeline (updated with FAAC)."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "AI ARCHITECTURE",
                         "Multi-Agent Pipeline: Specialized analysts for every query")

    agents = [
        ("Router Agent", "Intent Detection & Routing", GREEN,
         "Classifies incoming queries and routes to the appropriate specialist agent. Handles follow-ups and conversation context."),
        ("Budget Analyst", "State & Federal Budget Search", BLUE,
         "Searches 708K+ vector chunks from 800+ budget documents. Performs query decomposition, multi-state comparison, and trend analysis."),
        ("Corruption Analyst", "EFCC & ICPC Case Research", RED,
         "Searches corruption case records. Returns charges, amounts, officials involved, conviction status, and amounts recovered."),
        ("GovSpend Analyst", "Real-Time Payment Tracking", AMBER,
         "Queries 891K+ federal contractor payment records. Tracks ministry spending, beneficiary identification, and payment patterns."),
        ("FAAC Analyst", "Federation Revenue Sharing", PURPLE,
         "Searches 84 months of FAAC data across 774 LGAs and 37 states. Compares allocations by state, LGA, and geopolitical zone."),
        ("Impact Analyst", "Real-World Translation", GREEN_DARK,
         'Translates budget figures into relatable equivalents. "\u20A62.4B could build 48 primary schools or employ 4,800 teachers for a year."'),
    ]

    for i, (name, subtitle, color, desc) in enumerate(agents):
        y = Emu(2103120 + i * 780000)
        add_rounded_rect(slide, LEFT_M, y, Emu(10698480), Emu(700000), fill_color=CARD_BG)
        add_circle(slide, Emu(914400), Emu(y + 228600), Emu(228600), fill_color=color)
        add_text_box(slide, Emu(1234440), Emu(y + 73152), Emu(2286000), Emu(320040),
                     name, font_size=14, bold=True, color=WHITE)
        add_text_box(slide, Emu(1234440), Emu(y + 365760), Emu(2286000), Emu(320040),
                     subtitle, font_size=10, bold=True, color=color)
        add_text_box(slide, Emu(3749040), Emu(y + 109728), Emu(7315200), Emu(548640),
                     desc, font_size=11, color=MID_GRAY)

    add_page_number(slide, 9, total)


def slide_10_business_model(prs, total):
    """NEW: Free for Citizens — Revenue from institutions, not people."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "BUSINESS MODEL",
                         "Free for every Nigerian. Revenue from institutions, not citizens.")

    # The "Free" hero card (large, centered)
    add_rounded_rect(slide, LEFT_M, Emu(2000000), Emu(3800000), Emu(4400000),
                     fill_color=CARD_BG, border_color=GREEN, border_width=Pt(2))

    # Green top accent bar on free card
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, LEFT_M, Emu(2000000), Emu(3800000), Emu(50800)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = GREEN
    shape.line.fill.background()

    add_text_box(slide, Emu(731520 + 182880), Emu(2200000), Emu(3400000), Emu(411480),
                 "CITIZENS", font_size=18, bold=True, color=GREEN,
                 alignment=PP_ALIGN.CENTER)
    add_text_box(slide, Emu(731520 + 182880), Emu(2600000), Emu(3400000), Emu(640080),
                 "\u20A60", font_size=48, bold=True, color=WHITE,
                 alignment=PP_ALIGN.CENTER)
    add_text_box(slide, Emu(731520 + 182880), Emu(3200000), Emu(3400000), Emu(320040),
                 "forever \u2014 no limits, no paywalls", font_size=14, bold=False, color=MID_GRAY,
                 alignment=PP_ALIGN.CENTER)

    # Feature list inside free card
    free_features = [
        "Unlimited messages",
        "All 6 AI agents (Budget, FAAC, GovSpend,\n  Corruption, Impact, General)",
        "22 interactive chart types",
        "Pidgin English support",
        "Telegram + Web access",
        "Full conversation history",
    ]
    for j, feat in enumerate(free_features):
        add_rich_text_box(
            slide, Emu(731520 + 320040), Emu(3600000 + j * 280000),
            Emu(3200000), Emu(280000),
            [("\u2713  ", 13, True, GREEN), (feat, 12, False, LIGHT_GRAY)]
        )

    # Revenue streams on the right side
    add_text_box(slide, Emu(5000000), Emu(2000000), Emu(6800000), Emu(365760),
                 "WHO PAYS?", font_size=16, bold=True, color=AMBER)

    streams = [
        ("\u20A6", "Grants & Foundations", "$30K\u2013$500K",
         "MacArthur, Ford Foundation, Google.org, Omidyar,\nOpen Society (OSIWA), USAID, Luminate"),
        ("\u20A6", "Institutional Subscriptions", "$50\u2013$500/mo",
         "Newsrooms (Premium Times, The Cable), NGOs\n(BudgIT, ActionAid, SERAP), researchers"),
        ("\u20A6", "Data API & Licensing", "$50\u2013$500/mo",
         "Credit agencies, investment banks, fintech\ncompanies, international consultancies"),
        ("\u20A6", "Corporate Sponsors (CSR)", "$5K\u2013$20K/yr",
         "Banks (GTBank, Access), telecoms (MTN, Airtel):\n\"Free queries this month powered by [Brand]\""),
        ("\u20A6", "Government Transparency Portals", "$3.7K\u2013$11K/yr",
         "Progressive state governments wanting an AI-powered\npublic budget transparency dashboard"),
    ]

    for i, (icon, title, price, desc) in enumerate(streams):
        y = Emu(2400000 + i * 820000)

        add_rounded_rect(slide, Emu(5000000), y, Emu(6800000), Emu(720000), fill_color=CARD_BG)

        add_text_box(slide, Emu(5200000), Emu(y + 55000), Emu(3500000), Emu(300000),
                     title, font_size=13, bold=True, color=WHITE)
        add_text_box(slide, Emu(9700000), Emu(y + 55000), Emu(1900000), Emu(300000),
                     price, font_size=13, bold=True, color=GREEN,
                     alignment=PP_ALIGN.RIGHT)
        add_text_box(slide, Emu(5200000), Emu(y + 340000), Emu(6400000), Emu(400000),
                     desc, font_size=10, color=MID_GRAY)

    add_page_number(slide, 10, total)


def slide_11_unit_economics(prs, total):
    """NEW: Unit Economics — cost per message is tiny."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "UNIT ECONOMICS",
                         "AI inference is cheap. Civic impact is priceless.")

    # Cost per message highlight
    add_rounded_rect(slide, LEFT_M, Emu(2103120), Emu(3657600), Emu(1645920),
                     fill_color=CARD_BG, border_color=GREEN, border_width=Pt(2))
    add_text_box(slide, Emu(731520 + 182880), Emu(2240000), Emu(3300000), Emu(365760),
                 "COST PER MESSAGE", font_size=12, bold=True, color=GREEN,
                 alignment=PP_ALIGN.CENTER)
    add_text_box(slide, Emu(731520 + 182880), Emu(2560000), Emu(3300000), Emu(640080),
                 "$0.0017", font_size=44, bold=True, color=WHITE,
                 alignment=PP_ALIGN.CENTER)
    add_text_box(slide, Emu(731520 + 182880), Emu(3200000), Emu(3300000), Emu(320040),
                 "Gemini 2.0 Flash  \u2014  ~\u20A62.30/msg", font_size=12, color=MID_GRAY,
                 alignment=PP_ALIGN.CENTER)

    # Scale scenarios
    add_rounded_rect(slide, Emu(4800000), Emu(2103120), Emu(6900000), Emu(1645920), fill_color=CARD_BG)
    add_text_box(slide, Emu(5000000), Emu(2200000), Emu(6500000), Emu(320040),
                 "MONTHLY COST BY SCALE", font_size=12, bold=True, color=AMBER)

    scenarios = [
        ("500 DAU", "$350/mo", "~\u20A6473K"),
        ("1,000 DAU", "$600/mo", "~\u20A6810K"),
        ("5,000 DAU", "$3,260/mo", "~\u20A64.4M"),
        ("10,000 DAU", "$6,520/mo", "~\u20A68.8M"),
    ]

    for i, (users, usd, ngn) in enumerate(scenarios):
        y = Emu(2560000 + i * 260000)
        add_text_box(slide, Emu(5000000), y, Emu(2000000), Emu(250000),
                     users, font_size=12, bold=True, color=WHITE)
        add_text_box(slide, Emu(7200000), y, Emu(1800000), Emu(250000),
                     usd, font_size=12, bold=True, color=GREEN)
        add_text_box(slide, Emu(9200000), y, Emu(2300000), Emu(250000),
                     ngn, font_size=12, color=MID_GRAY)

    # Path to sustainability
    add_text_box(slide, LEFT_M, Emu(4100000), Emu(10500000), Emu(365760),
                 "PATH TO SUSTAINABILITY", font_size=14, bold=True, color=WHITE)

    phases = [
        ("Phase 1 (Month 1\u20136)", "500 DAU", "$350/mo cost", "Self-fund + 1 small grant (\u2264$1,800 total gap)",
         "Apply to 5\u20138 grants. Onboard 3\u20135 media/NGO clients on free trials."),
        ("Phase 2 (Month 6\u201312)", "2,000 DAU", "$1,200/mo cost", "$500\u2013$1,500 revenue (institutional clients)",
         "Land Data API clients. Approach 2\u20133 state governments. Start CSR conversations."),
        ("Phase 3 (Year 2)", "5,000 DAU", "$3,260/mo cost", "$5,800/mo revenue \u2014 PROFITABLE",
         "Grants + institutional + API + 1 corporate sponsor = break-even and beyond."),
    ]

    card_w = Emu(3566160)
    x_positions = [LEFT_M, Emu(4480559), Emu(8229598)]

    for (phase, users, cost, rev, action), x in zip(phases, x_positions):
        add_rounded_rect(slide, x, Emu(4500000), card_w, Emu(2100000), fill_color=CARD_BG)

        add_text_box(slide, Emu(x + 137160), Emu(4560000), Emu(3300000), Emu(274320),
                     phase, font_size=12, bold=True, color=GREEN)
        add_text_box(slide, Emu(x + 137160), Emu(4840000), Emu(3300000), Emu(250000),
                     f"{users}  |  {cost}", font_size=11, bold=True, color=WHITE)
        add_text_box(slide, Emu(x + 137160), Emu(5100000), Emu(3300000), Emu(274320),
                     rev, font_size=11, bold=True, color=AMBER)
        add_text_box(slide, Emu(x + 137160), Emu(5400000), Emu(3300000), Emu(900000),
                     action, font_size=10, color=MID_GRAY)

    add_page_number(slide, 11, total)


def slide_12_revenue_mix(prs, total):
    """NEW: Revenue breakdown at sustainability."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "REVENUE AT SCALE",
                         "Target revenue mix at 5,000 DAU \u2014 fully sustainable")

    # Revenue bars (visual representation)
    revenue_items = [
        ("Grants & Foundations", "$2,000/mo", 35, GREEN),
        ("Institutional Subscriptions", "$1,500/mo", 26, BLUE),
        ("Data API & Licensing", "$1,000/mo", 17, AMBER),
        ("Corporate Sponsor", "$800/mo", 14, PURPLE),
        ("Gov Transparency Portals", "$300/mo", 5, GREEN_DARK),
        ("Donations", "$200/mo", 3, MID_GRAY),
    ]

    # Total headline
    add_rounded_rect(slide, LEFT_M, Emu(2000000), Emu(10500000), Emu(700000),
                     fill_color=CARD_BG, border_color=GREEN, border_width=Pt(2))
    add_text_box(slide, Emu(914400), Emu(2100000), Emu(3000000), Emu(500000),
                 "TOTAL MONTHLY REVENUE", font_size=14, bold=True, color=GREEN)
    add_text_box(slide, Emu(4500000), Emu(2050000), Emu(3000000), Emu(600000),
                 "$5,800", font_size=40, bold=True, color=WHITE)
    add_text_box(slide, Emu(7500000), Emu(2100000), Emu(3500000), Emu(500000),
                 "vs $3,260 cost  =  $2,540 margin", font_size=14, bold=True, color=GREEN)

    # Revenue stream breakdown
    for i, (name, amount, pct, color) in enumerate(revenue_items):
        y = Emu(2900000 + i * 620000)

        # Label
        add_text_box(slide, LEFT_M, y, Emu(3200000), Emu(300000),
                     name, font_size=13, bold=True, color=WHITE)
        add_text_box(slide, Emu(3900000), y, Emu(1600000), Emu(300000),
                     amount, font_size=13, bold=True, color=color,
                     alignment=PP_ALIGN.RIGHT)

        # Bar
        max_bar_w = 5000000
        bar_w = int(max_bar_w * pct / 35)  # scale relative to largest
        bar = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Emu(5800000), Emu(y + 50000),
            Emu(bar_w), Emu(200000)
        )
        bar.fill.solid()
        bar.fill.fore_color.rgb = color
        bar.line.fill.background()

        # Percentage label
        add_text_box(slide, Emu(5800000 + bar_w + 100000), y, Emu(800000), Emu(300000),
                     f"{pct}%", font_size=12, bold=True, color=color)

    # Key insight at bottom
    add_rounded_rect(slide, LEFT_M, Emu(6100000), Emu(10500000), Emu(500000), fill_color=CARD_BG)
    add_text_box(slide, Emu(914400), Emu(6170000), Emu(10058400), Emu(365760),
                 "Zero revenue from citizens. 100% from organizations that extract professional value from the data.",
                 font_size=13, bold=True, color=GREEN, alignment=PP_ALIGN.CENTER)

    add_page_number(slide, 12, total)


def slide_13_traction(prs, total):
    """Traction."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "TRACTION",
                         "What we have built \u2014 ready for launch")

    milestones = [
        ("Full Platform Built", "Production-ready web app, API, admin dashboard, Telegram bot, ingestion pipeline, and landing page."),
        ("800+ Documents Ingested", "Budget documents from all 36 states + FCT processed into 708,309+ searchable vector chunks."),
        ("6 Specialized AI Agents", "Router, Budget, Corruption, GovSpend, FAAC, and Impact analysts with streaming responses."),
        ("22 Interactive Chart Types", "Auto-generated data visualizations with Naira formatting, rendered inline within chat responses."),
        ("FAAC Pipeline (774 LGAs)", "84 months of federal revenue sharing data extracted, chunked, and indexed for LGA-level comparisons."),
        ("891K+ GovSpend Records", "Contractor payment records searchable by MDA, beneficiary, amount, and date range."),
        ("Telegram Bot Live", "@ournigeria_bot on Telegram \u2014 full AI chat capabilities, automatic user creation, webhook-based."),
        ("Docker Production Deploy", "Full Docker Compose stack with health checks, memory limits, and auto-migration on startup."),
    ]

    for i, (title, desc) in enumerate(milestones):
        col = i % 2
        row = i // 2
        x = LEFT_M if col == 0 else Emu(6400800)
        y = Emu(2103120 + row * 1097280)

        add_rounded_rect(slide, x, y, Emu(5394960), Emu(960120), fill_color=CARD_BG)
        add_text_box(slide, Emu(x + 182880), Emu(y + 73152), Emu(4114800), Emu(274320),
                     title, font_size=13, bold=True, color=WHITE)
        add_text_box(slide, Emu(x + 4663440), Emu(y + 73152), Emu(548640), Emu(274320),
                     "DONE", font_size=10, bold=True, color=GREEN,
                     alignment=PP_ALIGN.RIGHT)
        add_text_box(slide, Emu(x + 182880), Emu(y + 411480), Emu(5029200), Emu(502920),
                     desc, font_size=11, color=MID_GRAY)

    add_page_number(slide, 13, total)


def slide_14_competitive(prs, total):
    """Competitive Landscape."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "COMPETITIVE LANDSCAPE",
                         "No direct competitor combines AI + Nigerian budget data at this depth")

    # Comparison table
    headers = ["Feature", "Aje", "BudgIT", "GovSpend.ng", "Manual PDF"]
    header_colors = [WHITE, GREEN, WHITE, WHITE, WHITE]

    rows = [
        ["AI Conversational Search", "Yes", "No", "No", "No"],
        ["All 36 States + FCT", "Yes", "Partial", "Federal only", "Varies"],
        ["FAAC LGA-Level Tracking", "Yes", "No", "No", "No"],
        ["Corruption Case Tracking", "Yes", "No", "No", "No"],
        ["Real-Time GovSpend Data", "Yes", "No", "Yes", "No"],
        ["Pidgin English Support", "Yes", "No", "No", "No"],
        ["Interactive Charts (22 types)", "Yes", "Limited", "Limited", "No"],
        ["Telegram Bot", "Yes", "No", "No", "No"],
        ["Free & Unlimited", "Yes", "Partial", "Partial", "Free but hard"],
    ]

    col_widths = [Emu(2926080), Emu(1828800), Emu(1828800), Emu(1828800), Emu(1828800)]
    col_x = [LEFT_M]
    for w in col_widths[:-1]:
        col_x.append(col_x[-1] + w + Emu(182880))

    # Header row
    header_y = Emu(2194560)
    for j, (header, color) in enumerate(zip(headers, header_colors)):
        add_rounded_rect(slide, col_x[j], header_y, col_widths[j], Emu(411480), fill_color=CARD_BG)
        add_text_box(slide, col_x[j], header_y, col_widths[j], Emu(411480),
                     header, font_size=12, bold=True, color=color, alignment=PP_ALIGN.CENTER)

    # Data rows
    for i, row in enumerate(rows):
        y = Emu(2697480 + i * 384048)
        for j, cell in enumerate(row):
            bg = CARD_BG if i % 2 == 0 else RGBColor(0x16, 0x1F, 0x2E)
            add_rounded_rect(slide, col_x[j], y, col_widths[j], Emu(384048), fill_color=bg)

            if cell == "Yes":
                color = GREEN
                bold = True
            elif cell in ("No", "N/A"):
                color = MID_GRAY
                bold = False
            else:
                color = LIGHT_GRAY
                bold = False

            if j == 0:
                color = LIGHT_GRAY
                bold = False

            add_text_box(slide, col_x[j], y, col_widths[j], Emu(384048),
                         cell, font_size=11, bold=bold, color=color,
                         alignment=PP_ALIGN.CENTER)

    add_page_number(slide, 14, total)


def slide_15_grant_targets(prs, total):
    """NEW: Grant & Partnership Targets."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "GRANT & PARTNERSHIP TARGETS",
                         "Organizations actively funding civic tech in Africa")

    # Two columns of targets
    grant_targets = [
        ("MacArthur Foundation", "Governance & Accountability (Nigeria office)", "$50K\u2013$500K"),
        ("Google.org / AI for Good", "AI-powered civic tools", "$100K\u2013$2M"),
        ("Omidyar Network / Luminate", "Civic tech in the Global South", "$50K\u2013$1M"),
        ("Ford Foundation", "Technology in the Public Interest", "$50K\u2013$300K"),
        ("Open Society (OSIWA)", "Civic participation in West Africa", "$25K\u2013$200K"),
    ]

    partner_targets = [
        ("Premium Times / The Cable", "Newsroom", "$100/mo"),
        ("BudgIT / SERAP", "NGO / CSO", "$200\u2013$300/mo"),
        ("Agusto & Co / Fitch", "Credit rating agencies", "$500/mo API"),
        ("GTBank / MTN Foundation", "Corporate CSR sponsor", "$10K\u2013$20K/yr"),
        ("Edo / Lagos / Kaduna State", "Government transparency portal", "$5K\u2013$11K/yr"),
    ]

    # Grant column
    add_text_box(slide, LEFT_M, Emu(2000000), Emu(5000000), Emu(365760),
                 "GRANTS (Primary Revenue)", font_size=14, bold=True, color=GREEN)

    for i, (org, focus, amount) in enumerate(grant_targets):
        y = Emu(2400000 + i * 760000)
        add_rounded_rect(slide, LEFT_M, y, Emu(5200000), Emu(650000), fill_color=CARD_BG)
        add_text_box(slide, Emu(914400), Emu(y + 60000), Emu(3000000), Emu(274320),
                     org, font_size=13, bold=True, color=WHITE)
        add_text_box(slide, Emu(4000000), Emu(y + 60000), Emu(2000000), Emu(274320),
                     amount, font_size=12, bold=True, color=GREEN, alignment=PP_ALIGN.RIGHT)
        add_text_box(slide, Emu(914400), Emu(y + 340000), Emu(5000000), Emu(274320),
                     focus, font_size=11, color=MID_GRAY)

    # Partners column
    add_text_box(slide, Emu(6300000), Emu(2000000), Emu(5500000), Emu(365760),
                 "INSTITUTIONAL PARTNERS", font_size=14, bold=True, color=AMBER)

    for i, (org, org_type, amount) in enumerate(partner_targets):
        y = Emu(2400000 + i * 760000)
        add_rounded_rect(slide, Emu(6300000), y, Emu(5200000), Emu(650000), fill_color=CARD_BG)
        add_text_box(slide, Emu(6500000), Emu(y + 60000), Emu(2800000), Emu(274320),
                     org, font_size=13, bold=True, color=WHITE)
        add_text_box(slide, Emu(9500000), Emu(y + 60000), Emu(1800000), Emu(274320),
                     amount, font_size=12, bold=True, color=AMBER, alignment=PP_ALIGN.RIGHT)
        add_text_box(slide, Emu(6500000), Emu(y + 340000), Emu(5000000), Emu(274320),
                     org_type, font_size=11, color=MID_GRAY)

    # Bottom insight
    add_rounded_rect(slide, LEFT_M, Emu(6200000), Emu(10500000), Emu(450000), fill_color=CARD_BG)
    add_text_box(slide, Emu(914400), Emu(6270000), Emu(10058400), Emu(320040),
                 "A single $50K grant covers 2+ years of operation at 1,000 DAU. We apply to 5\u20138 simultaneously.",
                 font_size=13, bold=True, color=GREEN, alignment=PP_ALIGN.CENTER)

    add_page_number(slide, 15, total)


def slide_16_roadmap(prs, total):
    """Roadmap."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    build_section_header(slide, "ROADMAP", "From launch to pan-African scale")

    phases = [
        ("Q1\u2013Q2 2026", "LAUNCH", GREEN, [
            "Public launch: web + Telegram",
            "Apply to 5\u20138 grants simultaneously",
            "Onboard 3\u20135 newsroom/NGO partners",
            "500 DAU target",
            "WhatsApp bot integration",
        ]),
        ("Q3\u2013Q4 2026", "GROW", BLUE, [
            "Launch Data API for developers",
            "Land 2\u20133 state transparency portals",
            "Secure first corporate CSR sponsor",
            "2,000 DAU target",
            "Add Hausa, Yoruba, Igbo language support",
        ]),
        ("2027", "SCALE", AMBER, [
            "Expand to Ghana and Kenya",
            "White-label platform for other countries",
            "10,000 DAU target",
            "Break-even on recurring revenue",
            "Legislative tracking (Senate, House of Reps)",
        ]),
    ]

    x_positions = [LEFT_M, Emu(4480559), Emu(8229598)]
    card_w = Emu(3474720)

    for (period, label, color, items), x in zip(phases, x_positions):
        add_rounded_rect(slide, x, Emu(2103120), card_w, Emu(4200000), fill_color=CARD_BG)

        # Top accent line
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, x, Emu(2103120), card_w, Emu(38100)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
        shape.line.fill.background()

        add_text_box(slide, Emu(x + 182880), Emu(2250000), Emu(3000000), Emu(274320),
                     period, font_size=12, bold=True, color=color)
        add_text_box(slide, Emu(x + 182880), Emu(2530000), Emu(3000000), Emu(365760),
                     label, font_size=24, bold=True, color=WHITE)

        for j, item in enumerate(items):
            add_rich_text_box(
                slide, Emu(x + 182880), Emu(3000000 + j * 580000),
                Emu(3100000), Emu(550000),
                [("\u2022  ", 13, True, color), (item, 12, False, LIGHT_GRAY)]
            )

    add_page_number(slide, 16, total)


def slide_17_closing(prs, total):
    """Closing / CTA slide."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide)
    add_top_bar(slide)

    add_text_box(slide, LEFT_M, Emu(1500000), Emu(10500000), Emu(411480),
                 "AJE", font_size=14, bold=True, color=GREEN,
                 alignment=PP_ALIGN.CENTER)

    add_multi_para_box(slide, LEFT_M, Emu(2100000), Emu(10500000), Emu(2500000), [
        ("Na Our Money.", 52, True, WHITE),
        ("Na Our Right To Know.", 52, True, GREEN),
        ("", 20, False, WHITE),
        ("Free AI-powered transparency for every Nigerian.", 22, False, LIGHT_GRAY),
        ("Backed by data. Funded by institutions. Built for citizens.", 20, False, MID_GRAY),
    ], alignment=PP_ALIGN.CENTER)

    # Contact / links
    add_rounded_rect(slide, Emu(2500000), Emu(5000000), Emu(7200000), Emu(1200000),
                     fill_color=CARD_BG)

    add_multi_para_box(slide, Emu(2700000), Emu(5100000), Emu(6800000), Emu(1000000), [
        ("aje.ng", 20, True, GREEN),
        ("@ournigeria_bot on Telegram", 14, False, LIGHT_GRAY),
        ("", 10, False, WHITE),
        ("Built with AI  \u2022  Powered by public data  \u2022  Free forever", 13, False, MID_GRAY),
    ], alignment=PP_ALIGN.CENTER)

    add_page_number(slide, 17, total)


# ─── Main ───

def main():
    # Load template for theme/master slides
    prs = Presentation("/Users/arinzeogbonna/Work/personal/spending/docs/ournaija.pptx")

    # Remove all existing slides (we rebuild from scratch)
    while len(prs.slides) > 0:
        rId = prs.slides._sldIdLst[0].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[0]

    TOTAL = 17

    slide_01_title(prs, TOTAL)
    slide_02_problem(prs, TOTAL)
    slide_03_market(prs, TOTAL)
    slide_04_solution(prs, TOTAL)
    slide_05_how_it_works(prs, TOTAL)
    slide_06_features(prs, TOTAL)
    slide_07_data(prs, TOTAL)
    slide_08_technology(prs, TOTAL)
    slide_09_ai_architecture(prs, TOTAL)
    slide_10_business_model(prs, TOTAL)
    slide_11_unit_economics(prs, TOTAL)
    slide_12_revenue_mix(prs, TOTAL)
    slide_13_traction(prs, TOTAL)
    slide_14_competitive(prs, TOTAL)
    slide_15_grant_targets(prs, TOTAL)
    slide_16_roadmap(prs, TOTAL)
    slide_17_closing(prs, TOTAL)

    output = "/Users/arinzeogbonna/Work/personal/spending/docs/ournaija_v2.pptx"
    prs.save(output)
    print(f"Saved {TOTAL}-slide presentation to {output}")


if __name__ == "__main__":
    main()
