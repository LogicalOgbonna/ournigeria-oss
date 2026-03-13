#!/usr/bin/env python3
"""Generate a professional TechPoint partnership proposal presentation."""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ── Brand Colors ──
DARK_BG = RGBColor(0x0F, 0x17, 0x2A)       # Deep navy
CARD_BG = RGBColor(0x16, 0x20, 0x3A)       # Slightly lighter navy
ACCENT_GREEN = RGBColor(0x00, 0xC9, 0x7B)  # Primary green accent
ACCENT_TEAL = RGBColor(0x00, 0xB4, 0xD8)   # Teal blue
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY = RGBColor(0xA0, 0xAE, 0xC0)    # Muted text
MID_GRAY = RGBColor(0x6B, 0x7B, 0x93)
DARK_TEXT = RGBColor(0x0A, 0x0F, 0x1E)
RED_ACCENT = RGBColor(0xFF, 0x4D, 0x6A)    # For warnings/problems
GOLD_ACCENT = RGBColor(0xFF, 0xB8, 0x00)   # For highlights
CARD_BORDER = RGBColor(0x25, 0x33, 0x55)   # Subtle border
GREEN_SOFT = RGBColor(0x0A, 0x2E, 0x1F)    # Dark green background
RED_SOFT = RGBColor(0x2E, 0x0A, 0x12)      # Dark red background
BLUE_SOFT = RGBColor(0x0A, 0x1A, 0x2E)     # Dark blue background

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


def set_slide_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_shape(slide, shape_type, left, top, width, height, fill_color=None, line_color=None, line_width=None):
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    shape.fill.background()
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(line_width or 1)
    else:
        shape.line.fill.background()
    return shape


def add_text_box(slide, left, top, width, height, text, font_size=14, color=WHITE,
                 bold=False, alignment=PP_ALIGN.LEFT, font_name="Segoe UI", anchor=MSO_ANCHOR.TOP):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    txBox.text_frame.word_wrap = True
    txBox.text_frame.auto_size = None
    p = txBox.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    txBox.text_frame.paragraphs[0].space_before = Pt(0)
    txBox.text_frame.paragraphs[0].space_after = Pt(0)
    return txBox


def add_multi_text(slide, left, top, width, height, runs, alignment=PP_ALIGN.LEFT, line_spacing=1.2):
    """Add textbox with multiple styled runs. runs = [(text, size, color, bold, font_name), ...]"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    txBox.text_frame.word_wrap = True
    tf = txBox.text_frame
    # Clear default paragraph
    p = tf.paragraphs[0]
    for i, (text, size, color, bold, font_name) in enumerate(runs):
        if i == 0:
            run = p.add_run()
        else:
            if text.startswith("\n"):
                p = tf.add_paragraph()
                p.alignment = alignment
                text = text[1:]
                run = p.add_run()
            else:
                run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.color.rgb = color
        run.font.bold = bold
        run.font.name = font_name or "Segoe UI"
    p.alignment = alignment
    return txBox


def add_rounded_rect(slide, left, top, width, height, fill_color, line_color=None, radius=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape


def add_circle(slide, left, top, size, fill_color, text=None, text_color=WHITE, text_size=14):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, size, size)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    if text:
        tf = shape.text_frame
        tf.word_wrap = False
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(text_size)
        p.font.color.rgb = text_color
        p.font.bold = True
        p.font.name = "Segoe UI"
        p.alignment = PP_ALIGN.CENTER
        tf.paragraphs[0].space_before = Pt(0)
        tf.paragraphs[0].space_after = Pt(0)
    return shape


def add_line(slide, x1, y1, x2, y2, color=CARD_BORDER, width=1):
    from pptx.util import Emu as E
    connector = slide.shapes.add_connector(1, x1, y1, x2, y2)  # MSO_CONNECTOR.STRAIGHT
    connector.line.color.rgb = color
    connector.line.width = Pt(width)
    return connector


def add_stat_block(slide, left, top, number, label, color=ACCENT_GREEN):
    add_text_box(slide, left, top, Inches(1.8), Inches(0.5), number,
                 font_size=32, color=color, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, left, top + Inches(0.45), Inches(1.8), Inches(0.3), label,
                 font_size=11, color=LIGHT_GRAY, alignment=PP_ALIGN.CENTER)


def add_icon_shape(slide, left, top, size, icon_type, fill_color):
    """Add a professional geometric icon shape."""
    shape_map = {
        "clock": MSO_SHAPE.DONUT,
        "cross": MSO_SHAPE.CROSS,
        "search": MSO_SHAPE.OVAL,
        "document": MSO_SHAPE.FOLDED_CORNER,
        "chart": MSO_SHAPE.PENTAGON,
        "shield": MSO_SHAPE.CHEVRON,
        "arrow_right": MSO_SHAPE.RIGHT_ARROW,
        "diamond": MSO_SHAPE.DIAMOND,
        "hexagon": MSO_SHAPE.HEXAGON,
        "lightning": MSO_SHAPE.LIGHTNING_BOLT,
        "star": MSO_SHAPE.STAR_4_POINT,
        "target": MSO_SHAPE.DONUT,
        "flag": MSO_SHAPE.FLOWCHART_MANUAL_INPUT,
        "globe": MSO_SHAPE.OVAL,
        "up_arrow": MSO_SHAPE.UP_ARROW,
        "check": MSO_SHAPE.STAR_4_POINT,
        "block": MSO_SHAPE.NO_SYMBOL,
        "calendar": MSO_SHAPE.FOLDED_CORNER,
        "runner": MSO_SHAPE.RIGHT_ARROW,
        "briefcase": MSO_SHAPE.ROUNDED_RECTANGLE,
    }
    shape_type = shape_map.get(icon_type, MSO_SHAPE.OVAL)
    shape = slide.shapes.add_shape(shape_type, left, top, size, size)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    return shape


# ════════════════════════════════════════════
# SLIDE 1: TITLE
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank
set_slide_bg(slide, DARK_BG)

# Accent bar at top
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_GREEN)

# OurNigeria wordmark
add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.5), "OURNIGERIA",
             font_size=14, color=ACCENT_GREEN, bold=True, font_name="Segoe UI")
add_text_box(slide, Inches(0.8), Inches(0.85), Inches(4), Inches(0.3), "Do More. Know More. Earn More.",
             font_size=10, color=LIGHT_GRAY, font_name="Segoe UI")

# Tag
add_rounded_rect(slide, Inches(0.8), Inches(2.0), Inches(2.6), Inches(0.4), CARD_BG, CARD_BORDER)
add_text_box(slide, Inches(0.8), Inches(2.05), Inches(2.6), Inches(0.35), "PARTNERSHIP PROPOSAL",
             font_size=10, color=ACCENT_GREEN, bold=True, alignment=PP_ALIGN.CENTER, font_name="Segoe UI")

# Main title
add_text_box(slide, Inches(0.8), Inches(2.8), Inches(7), Inches(1.2), "OurNigeria  x  TechPoint",
             font_size=44, color=WHITE, bold=True, font_name="Segoe UI")

# Subtitle
txBox = slide.shapes.add_textbox(Inches(0.8), Inches(4.3), Inches(7.5), Inches(1.0))
txBox.text_frame.word_wrap = True
p = txBox.text_frame.paragraphs[0]
p.text = "How structured government fiscal data transforms TechPoint's policy coverage into a differentiated revenue engine."
p.font.size = Pt(18)
p.font.color.rgb = LIGHT_GRAY
p.font.name = "Segoe UI"
p.line_spacing = Pt(26)

# Stat boxes at bottom
stat_data = [("700+", "Budget Documents"), ("37", "States Covered"), ("708K+", "Data Points")]
for i, (num, label) in enumerate(stat_data):
    x = Inches(0.8 + i * 2.8)
    y = Inches(5.6)
    add_rounded_rect(slide, x, y, Inches(2.4), Inches(1.1), CARD_BG, CARD_BORDER)
    add_text_box(slide, x, y + Inches(0.15), Inches(2.4), Inches(0.5), num,
                 font_size=28, color=ACCENT_GREEN, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, x, y + Inches(0.6), Inches(2.4), Inches(0.3), label,
                 font_size=11, color=LIGHT_GRAY, alignment=PP_ALIGN.CENTER)

# Decorative right side element - abstract grid pattern
for row in range(6):
    for col in range(4):
        opacity_color = RGBColor(0x16 + col * 4, 0x20 + col * 4, 0x3A + col * 3)
        add_shape(slide, MSO_SHAPE.RECTANGLE,
                  Inches(9.5 + col * 0.9), Inches(1.5 + row * 0.9),
                  Inches(0.75), Inches(0.75), fill_color=opacity_color, line_color=CARD_BORDER, line_width=0.5)

# Footer
add_text_box(slide, Inches(0.8), Inches(7.0), Inches(6), Inches(0.3),
             "March 2026  |  Confidential", font_size=10, color=MID_GRAY)


# ════════════════════════════════════════════
# SLIDE 2: THE PROBLEM
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=RED_ACCENT)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.3), "THE PROBLEM",
             font_size=12, color=RED_ACCENT, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "Policy Coverage Without Fiscal Data",
             font_size=36, color=WHITE, bold=True)
add_text_box(slide, Inches(0.8), Inches(2.1), Inches(9), Inches(0.5),
             "TechPoint writes about policy impact on tech \u2014 but every number comes from manually found PDFs.",
             font_size=16, color=LIGHT_GRAY)

# Three problem cards
problems = [
    ("clock", "Hours Wasted", "Manual PDF Scraping",
     "Journalists spend hours hunting through scattered government PDFs for a single allocation figure. No API. No database. Just Google and hope."),
    ("cross", "No Verification", "Can't Cross-Check Data",
     "When the government says \"\u20A6X allocated,\" there's no way to verify against actual disbursements across 37 states and 774 LGAs."),
    ("document", "Commodity Content", "Same As Every Competitor",
     "TechCabal, Stears, The Cable \u2014 they all have the same data blind spot. Everyone's rewriting the same press releases."),
]

for i, (icon, title, subtitle, desc) in enumerate(problems):
    x = Inches(0.8 + i * 4.0)
    y = Inches(3.0)
    # Card background
    add_rounded_rect(slide, x, y, Inches(3.6), Inches(4.0), CARD_BG, CARD_BORDER)
    # Icon circle
    add_icon_shape(slide, x + Inches(0.3), y + Inches(0.4), Inches(0.55), icon, RED_SOFT)
    # Number indicator
    add_text_box(slide, x + Inches(1.0), y + Inches(0.4), Inches(2.3), Inches(0.35), f"0{i+1}",
                 font_size=12, color=RED_ACCENT, bold=True)
    # Title
    add_text_box(slide, x + Inches(0.3), y + Inches(1.2), Inches(3.0), Inches(0.35), title,
                 font_size=18, color=WHITE, bold=True)
    # Subtitle
    add_text_box(slide, x + Inches(0.3), y + Inches(1.6), Inches(3.0), Inches(0.3), subtitle,
                 font_size=12, color=RED_ACCENT)
    # Divider line
    add_shape(slide, MSO_SHAPE.RECTANGLE, x + Inches(0.3), y + Inches(2.1), Inches(2.0), Pt(1), fill_color=CARD_BORDER)
    # Description
    txBox = add_text_box(slide, x + Inches(0.3), y + Inches(2.3), Inches(3.0), Inches(1.5), desc,
                         font_size=12, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(18)


# ════════════════════════════════════════════
# SLIDE 3: THE SOLUTION
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_GREEN)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.3), "THE SOLUTION",
             font_size=12, color=ACCENT_GREEN, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "Structured Government Data, Instantly",
             font_size=36, color=WHITE, bold=True)
add_text_box(slide, Inches(0.8), Inches(2.1), Inches(9), Inches(0.5),
             "OurNigeria's AI pipeline turns 700+ budget documents into queryable, structured intelligence.",
             font_size=16, color=LIGHT_GRAY)

# Four solution cards - 2x2 grid
solutions = [
    ("chart", "FAAC Allocations", "Monthly federal transfers to every state and LGA. Historical trends. Compare across regions and time periods.", ACCENT_GREEN),
    ("document", "Budget Line Items", "What each of 37 states allocated to tech, digital economy, science & innovation. Searchable by ministry.", ACCENT_TEAL),
    ("search", "Spending vs. Allocation", "Where budgeted money actually went \u2014 or didn't go. The accountability layer that no one else provides.", GOLD_ACCENT),
    ("shield", "Corruption Flags", "Documented cases tied to specific budget lines, agencies, and amounts. Cross-referenced with public records.", RED_ACCENT),
]

for i, (icon, title, desc, color) in enumerate(solutions):
    col = i % 2
    row = i // 2
    x = Inches(0.8 + col * 5.8)
    y = Inches(2.9 + row * 2.0)

    # Card
    add_rounded_rect(slide, x, y, Inches(5.4), Inches(1.7), CARD_BG, CARD_BORDER)
    # Colored left strip
    add_shape(slide, MSO_SHAPE.RECTANGLE, x, y, Inches(0.06), Inches(1.7), fill_color=color)
    # Icon
    add_icon_shape(slide, x + Inches(0.35), y + Inches(0.35), Inches(0.5), icon, color)
    # Title
    add_text_box(slide, x + Inches(1.1), y + Inches(0.25), Inches(4.0), Inches(0.35), title,
                 font_size=16, color=WHITE, bold=True)
    # Description
    txBox = add_text_box(slide, x + Inches(1.1), y + Inches(0.7), Inches(4.0), Inches(0.8), desc,
                         font_size=11, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(17)

# Bottom stats bar
stats_bar = [("700+", "Documents"), ("37", "States"), ("774", "LGAs"), ("708K+", "Data Points"), ("AI", "Natural Language")]
bar_y = Inches(6.7)
add_rounded_rect(slide, Inches(0.8), bar_y, Inches(11.7), Inches(0.65), CARD_BG, CARD_BORDER)
for i, (num, label) in enumerate(stats_bar):
    sx = Inches(1.0 + i * 2.34)
    add_text_box(slide, sx, bar_y + Inches(0.08), Inches(1.0), Inches(0.3), num,
                 font_size=16, color=ACCENT_GREEN, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, sx + Inches(1.0), bar_y + Inches(0.12), Inches(1.2), Inches(0.3), label,
                 font_size=10, color=LIGHT_GRAY)


# ════════════════════════════════════════════
# SLIDE 4: THE OPPORTUNITY
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_GREEN)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.3), "THE OPPORTUNITY",
             font_size=12, color=ACCENT_GREEN, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "6 Revenue Multipliers for TechPoint",
             font_size=36, color=WHITE, bold=True)

# 6 cards in 3x2 grid
multipliers = [
    ("Ad Revenue", "Higher CPMs from data-exclusive content", ACCENT_GREEN),
    ("Sponsored Content", "Premium \"Policy Intelligence\" tier", ACCENT_TEAL),
    ("Newsletter", "Exclusive data \u2192 higher open rates", GOLD_ACCENT),
    ("Events", "New sponsor category unlocked", RGBColor(0xA7, 0x5C, 0xFF)),
    ("IntelPoint", "Reports in hours not days", RED_ACCENT),
    ("Competitive Moat", "First mover advantage", RGBColor(0xFF, 0x8C, 0x42)),
]

for i, (title, desc, color) in enumerate(multipliers):
    col = i % 3
    row = i // 3
    x = Inches(0.8 + col * 4.0)
    y = Inches(2.2 + row * 2.5)

    # Card
    add_rounded_rect(slide, x, y, Inches(3.6), Inches(2.1), CARD_BG, CARD_BORDER)
    # Top color accent
    add_shape(slide, MSO_SHAPE.RECTANGLE, x, y, Inches(3.6), Inches(0.06), fill_color=color)

    # Number circle
    add_circle(slide, x + Inches(0.3), y + Inches(0.35), Inches(0.5), color, f"0{i+1}", WHITE, 14)

    # Title
    add_text_box(slide, x + Inches(1.0), y + Inches(0.37), Inches(2.3), Inches(0.35), title,
                 font_size=18, color=WHITE, bold=True)

    # Description
    add_text_box(slide, x + Inches(0.3), y + Inches(1.1), Inches(3.0), Inches(0.8), desc,
                 font_size=13, color=LIGHT_GRAY)


# ════════════════════════════════════════════
# SLIDE 5: REVENUE DRIVER 01
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_GREEN)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.3), "REVENUE DRIVER 01",
             font_size=12, color=ACCENT_GREEN, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "Higher-Value Ad Inventory",
             font_size=36, color=WHITE, bold=True)
add_text_box(slide, Inches(0.8), Inches(2.1), Inches(9), Inches(0.4),
             "How data-exclusive content drives ad revenue:",
             font_size=15, color=LIGHT_GRAY)

# Flow: 4 connected steps
steps = [
    ("01", "Exclusive Data", "Government fiscal data\nno competitor has"),
    ("02", "Better Content", "Data-backed articles rank\nhigher, get shared more"),
    ("03", "Premium Audience", "High-intent readers:\nfintech + enterprise"),
    ("04", "Higher CPMs", "Advertisers pay more\nfor this demographic"),
]

for i, (num, title, desc) in enumerate(steps):
    x = Inches(0.8 + i * 3.1)
    y = Inches(2.4)

    add_rounded_rect(slide, x, y, Inches(2.7), Inches(1.8), CARD_BG, CARD_BORDER)
    add_circle(slide, x + Inches(0.2), y + Inches(0.2), Inches(0.45), ACCENT_GREEN, num, WHITE, 13)
    add_text_box(slide, x + Inches(0.8), y + Inches(0.25), Inches(1.7), Inches(0.3), title,
                 font_size=14, color=WHITE, bold=True)
    txBox = add_text_box(slide, x + Inches(0.2), y + Inches(0.85), Inches(2.3), Inches(0.8), desc,
                         font_size=11, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(16)

    # Arrow connector between cards
    if i < 3:
        add_icon_shape(slide, x + Inches(2.8), y + Inches(0.65), Inches(0.22), "arrow_right", ACCENT_GREEN)

# Before / After comparison
y_comp = Inches(4.6)
# BEFORE
add_rounded_rect(slide, Inches(0.8), y_comp, Inches(5.8), Inches(2.5), RED_SOFT, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0.8), y_comp, Inches(0.06), Inches(2.5), fill_color=RED_ACCENT)
add_text_box(slide, Inches(1.1), y_comp + Inches(0.2), Inches(5.2), Inches(0.3),
             "BEFORE \u2014 Generic Policy Coverage", font_size=13, color=RED_ACCENT, bold=True)
txBox = add_text_box(slide, Inches(1.1), y_comp + Inches(0.65), Inches(5.2), Inches(0.4),
             "\"Nigeria's digital economy plans look promising\"",
             font_size=14, color=WHITE, bold=True)
desc_lines = "Reads like a press release rewrite\nLow search ranking, low social sharing\nGeneric audience, standard CPMs"
for j, line in enumerate(desc_lines.split("\n")):
    add_icon_shape(slide, Inches(1.1), y_comp + Inches(1.25 + j * 0.35), Inches(0.15), "cross", RED_ACCENT)
    add_text_box(slide, Inches(1.4), y_comp + Inches(1.2 + j * 0.35), Inches(4.8), Inches(0.3),
                 line, font_size=11, color=LIGHT_GRAY)

# AFTER
add_rounded_rect(slide, Inches(6.9), y_comp, Inches(5.8), Inches(2.5), GREEN_SOFT, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(6.9), y_comp, Inches(0.06), Inches(2.5), fill_color=ACCENT_GREEN)
add_text_box(slide, Inches(7.2), y_comp + Inches(0.2), Inches(5.2), Inches(0.3),
             "AFTER \u2014 Data-Backed Exclusive", font_size=13, color=ACCENT_GREEN, bold=True)
txBox = add_text_box(slide, Inches(7.2), y_comp + Inches(0.6), Inches(5.2), Inches(0.5),
             "\"Lagos received \u20A684.7B from FAAC in January \u2014 but only \u20A62.1B reached its digital economy ministry\"",
             font_size=13, color=WHITE, bold=True)
txBox.text_frame.paragraphs[0].line_spacing = Pt(18)
after_lines = "Exclusive data = high organic search ranking\nShareable insight drives social traffic\nFintech/enterprise readers = premium ad CPMs"
for j, line in enumerate(after_lines.split("\n")):
    add_icon_shape(slide, Inches(7.2), y_comp + Inches(1.35 + j * 0.35), Inches(0.15), "check", ACCENT_GREEN)
    add_text_box(slide, Inches(7.5), y_comp + Inches(1.3 + j * 0.35), Inches(4.8), Inches(0.3),
                 line, font_size=11, color=LIGHT_GRAY)


# ════════════════════════════════════════════
# SLIDE 6: REVENUE DRIVER 02
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_TEAL)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(5), Inches(0.3), "REVENUE DRIVER 02",
             font_size=12, color=ACCENT_TEAL, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "Premium \"Policy Intelligence\" Tier",
             font_size=36, color=WHITE, bold=True)
txBox = add_text_box(slide, Inches(0.8), Inches(2.1), Inches(10), Inches(0.5),
             "Data-backed sponsored content commands premium pricing because it's more credible and has a longer shelf life.",
             font_size=15, color=LIGHT_GRAY)

# Scenario header
add_rounded_rect(slide, Inches(0.8), Inches(2.7), Inches(11.7), Inches(0.5), BLUE_SOFT, CARD_BORDER)
add_text_box(slide, Inches(1.1), Inches(2.78), Inches(10), Inches(0.35),
             "EXAMPLE SCENARIO: Moniepoint Sponsored Series",
             font_size=13, color=ACCENT_TEAL, bold=True)

# Three cards
scenario_cards = [
    ("document", "The Content",
     "Monthly \"State of Digital Payments Infrastructure\" report using actual government allocation data showing which states invest in payment infrastructure.",
     ACCENT_TEAL),
    ("target", "Brand Value",
     "Moniepoint reaches state government readers and enterprise decision-makers who are actively researching government tech spending. Qualified leads, not impressions.",
     GOLD_ACCENT),
    ("up_arrow", "TechPoint Revenue",
     "Premium pricing because the content has original, exclusive data. Not branded thought leadership \u2014 real fiscal intelligence. Longer shelf life = sustained traffic per piece.",
     ACCENT_GREEN),
]

for i, (icon, title, desc, color) in enumerate(scenario_cards):
    x = Inches(0.8 + i * 4.0)
    y = Inches(3.5)

    add_rounded_rect(slide, x, y, Inches(3.6), Inches(3.5), CARD_BG, CARD_BORDER)
    add_shape(slide, MSO_SHAPE.RECTANGLE, x, y, Inches(3.6), Inches(0.06), fill_color=color)
    add_icon_shape(slide, x + Inches(0.3), y + Inches(0.4), Inches(0.5), icon, color)
    add_text_box(slide, x + Inches(1.0), y + Inches(0.4), Inches(2.3), Inches(0.35), title,
                 font_size=16, color=WHITE, bold=True)
    add_shape(slide, MSO_SHAPE.RECTANGLE, x + Inches(0.3), y + Inches(1.1), Inches(2.5), Pt(1), fill_color=CARD_BORDER)
    txBox = add_text_box(slide, x + Inches(0.3), y + Inches(1.35), Inches(3.0), Inches(2.0), desc,
                         font_size=12, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(18)


# ════════════════════════════════════════════
# SLIDE 7: REVENUE DRIVER 03 — INTELPOINT
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=GOLD_ACCENT)

add_rounded_rect(slide, Inches(8.5), Inches(0.5), Inches(2.2), Inches(0.35), RED_SOFT, RED_ACCENT)
add_text_box(slide, Inches(8.5), Inches(0.53), Inches(2.2), Inches(0.3), "HIGHEST IMPACT",
             font_size=10, color=RED_ACCENT, bold=True, alignment=PP_ALIGN.CENTER)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(5), Inches(0.3),
             "REVENUE DRIVER 03", font_size=12, color=GOLD_ACCENT, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "IntelPoint: More Reports, Better Margins",
             font_size=36, color=WHITE, bold=True)
add_text_box(slide, Inches(0.8), Inches(2.1), Inches(9), Inches(0.4),
             "The most direct revenue impact. Research that took days now takes hours.",
             font_size=15, color=LIGHT_GRAY)

# WITHOUT column
add_rounded_rect(slide, Inches(0.8), Inches(2.8), Inches(5.6), Inches(4.5), RED_SOFT, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.8), Inches(5.6), Inches(0.06), fill_color=RED_ACCENT)
add_text_box(slide, Inches(1.1), Inches(3.05), Inches(5.0), Inches(0.35),
             "WITHOUT OurNigeria", font_size=14, color=RED_ACCENT, bold=True)

without_items = [
    ("clock", "Days of manual PDF scraping per report"),
    ("globe", "Limited to states where data is findable"),
    ("diamond", "High labor cost erodes report margins"),
    ("clock", "Slow RFP responses \u2014 \"give us 3 weeks\""),
    ("block", "Gov fiscal reports often not worth the effort"),
]
for i, (icon, text) in enumerate(without_items):
    iy = Inches(3.65 + i * 0.65)
    add_icon_shape(slide, Inches(1.3), iy, Inches(0.3), icon, RED_ACCENT)
    add_text_box(slide, Inches(1.8), iy + Inches(0.02), Inches(4.3), Inches(0.35), text,
                 font_size=12, color=LIGHT_GRAY)

# WITH column
add_rounded_rect(slide, Inches(6.8), Inches(2.8), Inches(5.6), Inches(4.5), GREEN_SOFT, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(2.8), Inches(5.6), Inches(0.06), fill_color=ACCENT_GREEN)
add_text_box(slide, Inches(7.1), Inches(3.05), Inches(5.0), Inches(0.35),
             "WITH OurNigeria API", font_size=14, color=ACCENT_GREEN, bold=True)

with_items = [
    ("lightning", "Data pulls in minutes, not days"),
    ("globe", "Full coverage: all 37 states, 774 LGAs"),
    ("up_arrow", "Lower cost per report = better margins"),
    ("check", "\"Kano's tech spending?\" \u2192 Yes, today."),
    ("star", "New product: Gov Fiscal Intelligence reports"),
]
for i, (icon, text) in enumerate(with_items):
    iy = Inches(3.65 + i * 0.65)
    add_icon_shape(slide, Inches(7.3), iy, Inches(0.3), icon, ACCENT_GREEN)
    add_text_box(slide, Inches(7.8), iy + Inches(0.02), Inches(4.3), Inches(0.35), text,
                 font_size=12, color=LIGHT_GRAY)


# ════════════════════════════════════════════
# SLIDE 8: REVENUE DRIVERS 04 & 05
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=RGBColor(0xA7, 0x5C, 0xFF))

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(5), Inches(0.3),
             "REVENUE DRIVERS 04 & 05", font_size=12, color=RGBColor(0xA7, 0x5C, 0xFF), bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "Events & Newsletter Revenue", font_size=36, color=WHITE, bold=True)

# LEFT: Events section
add_rounded_rect(slide, Inches(0.8), Inches(2.0), Inches(5.8), Inches(5.0), CARD_BG, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.8), Inches(0.06),
          fill_color=RGBColor(0xA7, 0x5C, 0xFF))
add_text_box(slide, Inches(1.2), Inches(2.3), Inches(5.0), Inches(0.4),
             "Techpoint Build & Inspired Events", font_size=18, color=WHITE, bold=True)
add_text_box(slide, Inches(1.2), Inches(2.8), Inches(5.0), Inches(0.5),
             "A \"Civic Tech & Government Spending\" data track unlocks an entirely new sponsor category:",
             font_size=12, color=LIGHT_GRAY)

sponsors = [
    ("01", "Government Agencies", "Federal and state digital economy ministries"),
    ("02", "Development Orgs", "World Bank, USAID, GIZ, AfDB"),
    ("03", "Enterprise IT", "Oracle, Microsoft, local IT vendors selling to government"),
]
for i, (num, title, desc) in enumerate(sponsors):
    sy = Inches(3.6 + i * 0.85)
    add_circle(slide, Inches(1.3), sy, Inches(0.4), RGBColor(0xA7, 0x5C, 0xFF), num, WHITE, 11)
    add_text_box(slide, Inches(1.9), sy + Inches(0.0), Inches(4.0), Inches(0.3), title,
                 font_size=14, color=WHITE, bold=True)
    add_text_box(slide, Inches(1.9), sy + Inches(0.32), Inches(4.0), Inches(0.3), desc,
                 font_size=11, color=LIGHT_GRAY)

add_rounded_rect(slide, Inches(1.2), Inches(6.2), Inches(5.0), Inches(0.45), BLUE_SOFT, CARD_BORDER)
add_text_box(slide, Inches(1.4), Inches(6.27), Inches(4.6), Inches(0.3),
             "One additional \u20A65-10M sponsor per event is meaningful.",
             font_size=12, color=RGBColor(0xA7, 0x5C, 0xFF), bold=True)

# RIGHT: Newsletter section
add_rounded_rect(slide, Inches(7.0), Inches(2.0), Inches(5.6), Inches(5.0), CARD_BG, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(7.0), Inches(2.0), Inches(5.6), Inches(0.06),
          fill_color=GOLD_ACCENT)
add_text_box(slide, Inches(7.4), Inches(2.3), Inches(5.0), Inches(0.4),
             "Techpoint Digest Newsletter", font_size=18, color=WHITE, bold=True)

# Newsletter mockup
add_rounded_rect(slide, Inches(7.4), Inches(3.0), Inches(4.8), Inches(2.2), DARK_BG, CARD_BORDER)
add_rounded_rect(slide, Inches(7.4), Inches(3.0), Inches(4.8), Inches(0.4), BLUE_SOFT, CARD_BORDER)
add_text_box(slide, Inches(7.6), Inches(3.05), Inches(4.4), Inches(0.3),
             "GOVERNMENT DATA SPOTLIGHT", font_size=10, color=GOLD_ACCENT, bold=True)
txBox = add_text_box(slide, Inches(7.6), Inches(3.5), Inches(4.4), Inches(1.0),
             "This week: Ogun State's FAAC allocation dropped 23% month-over-month while Lagos saw a 12% increase. What's driving the divergence?",
             font_size=12, color=WHITE)
txBox.text_frame.paragraphs[0].line_spacing = Pt(18)
add_text_box(slide, Inches(7.6), Inches(4.65), Inches(4.4), Inches(0.3),
             "Powered by OurNigeria  |  Read full analysis",
             font_size=10, color=ACCENT_GREEN)

# Revenue mechanism
add_text_box(slide, Inches(7.4), Inches(5.5), Inches(4.8), Inches(0.3),
             "The revenue mechanism:", font_size=12, color=WHITE, bold=True)
mechanism = ["Exclusive number-driven content", "Higher open rates", "Higher newsletter sponsorship pricing"]
for i, text in enumerate(mechanism):
    my = Inches(5.9 + i * 0.35)
    add_icon_shape(slide, Inches(7.5), my, Inches(0.18), "arrow_right", GOLD_ACCENT)
    add_text_box(slide, Inches(7.85), my - Inches(0.02), Inches(4.0), Inches(0.3), text,
                 font_size=11, color=LIGHT_GRAY)


# ════════════════════════════════════════════
# SLIDE 9: COMPETITIVE ADVANTAGE
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=RED_ACCENT)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(5), Inches(0.3),
             "COMPETITIVE ADVANTAGE", font_size=12, color=RED_ACCENT, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "The Window Is Open \u2014 But Closing Fast",
             font_size=36, color=WHITE, bold=True)

# Warning banner
add_rounded_rect(slide, Inches(0.8), Inches(2.2), Inches(11.7), Inches(0.7), RED_SOFT, RED_ACCENT)
txBox = add_text_box(slide, Inches(1.2), Inches(2.3), Inches(11.0), Inches(0.5),
             "If TechCabal or Stears gets structured government data first, TechPoint's policy content becomes second-tier. This is about protecting revenue, not just growing it.",
             font_size=13, color=WHITE)
txBox.text_frame.paragraphs[0].line_spacing = Pt(19)

# Three competitive cards
comp_cards = [
    ("calendar", "2025 Budget Cycle",
     "Peak interest in government fiscal data. Tinubu's digital economy policies are generating massive coverage demand. The moment is now.",
     GOLD_ACCENT),
    ("runner", "Competitor Movement",
     "BudgIT, Dataphyte, and others are building similar capabilities. First tech publication to have structured fiscal data wins the positioning.",
     RED_ACCENT),
    ("briefcase", "Advertiser Stakes",
     "Brands sponsor the publication with the most credible policy coverage. Data authority equals advertising dollars. Second place gets leftovers.",
     ACCENT_TEAL),
]

for i, (icon, title, desc, color) in enumerate(comp_cards):
    x = Inches(0.8 + i * 4.0)
    y = Inches(3.3)

    add_rounded_rect(slide, x, y, Inches(3.6), Inches(3.5), CARD_BG, CARD_BORDER)
    add_shape(slide, MSO_SHAPE.RECTANGLE, x, y, Inches(0.06), Inches(3.5), fill_color=color)

    add_icon_shape(slide, x + Inches(0.4), y + Inches(0.5), Inches(0.55), icon, color)
    add_text_box(slide, x + Inches(0.3), y + Inches(1.3), Inches(3.0), Inches(0.35), title,
                 font_size=18, color=WHITE, bold=True)
    add_shape(slide, MSO_SHAPE.RECTANGLE, x + Inches(0.3), y + Inches(1.8), Inches(1.5), Pt(1), fill_color=color)
    txBox = add_text_box(slide, x + Inches(0.3), y + Inches(2.1), Inches(3.0), Inches(1.5), desc,
                         font_size=12, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(19)


# ════════════════════════════════════════════
# SLIDE 10: PARTNERSHIP MODEL
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_GREEN)

add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.3), "PARTNERSHIP MODEL",
             font_size=12, color=ACCENT_GREEN, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1.0),
             "How We Work Together", font_size=36, color=WHITE, bold=True)

# 5 partnership tiers
tiers = [
    ("01", "Free", "Embedded\nData Widgets", "Allocation tracker on policy pages", "Time-on-page\nReturn visits", ACCENT_GREEN),
    ("02", "Free", "Co-Branded\nMonthly Report", "TechPoint analysis + OurNigeria data", "Sponsorship\nopportunity", ACCENT_TEAL),
    ("03", "Paid", "IntelPoint\nAPI Access", "Programmatic access for research", "More reports,\nbetter margins", GOLD_ACCENT),
    ("04", "Co-invest", "Event\nData Track", "Civic Tech track at Techpoint Build", "New sponsor\ncategory", RGBColor(0xA7, 0x5C, 0xFF)),
    ("05", "Free", "Newsletter\nData Segment", "Weekly fiscal data for Digest", "Higher open rates\n= higher pricing", RGBColor(0xFF, 0x8C, 0x42)),
]

for i, (num, pricing, title, desc, benefit, color) in enumerate(tiers):
    x = Inches(0.5 + i * 2.5)
    y = Inches(2.0)

    add_rounded_rect(slide, x, y, Inches(2.2), Inches(4.8), CARD_BG, CARD_BORDER)
    add_shape(slide, MSO_SHAPE.RECTANGLE, x, y, Inches(2.2), Inches(0.06), fill_color=color)

    # Number
    add_circle(slide, x + Inches(0.1), y + Inches(0.3), Inches(0.45), color, num, WHITE, 13)

    # Pricing tag
    tag_color = GREEN_SOFT if pricing == "Free" else (BLUE_SOFT if pricing == "Paid" else RGBColor(0x2A, 0x1A, 0x3E))
    add_rounded_rect(slide, x + Inches(0.7), y + Inches(0.33), Inches(1.2), Inches(0.35), tag_color, color)
    add_text_box(slide, x + Inches(0.7), y + Inches(0.35), Inches(1.2), Inches(0.3), pricing,
                 font_size=10, color=color, bold=True, alignment=PP_ALIGN.CENTER)

    # Title
    txBox = add_text_box(slide, x + Inches(0.15), y + Inches(1.0), Inches(1.9), Inches(0.7), title,
                         font_size=14, color=WHITE, bold=True)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(20)

    # Divider
    add_shape(slide, MSO_SHAPE.RECTANGLE, x + Inches(0.15), y + Inches(1.9), Inches(1.5), Pt(1), fill_color=CARD_BORDER)

    # Description
    txBox = add_text_box(slide, x + Inches(0.15), y + Inches(2.1), Inches(1.9), Inches(1.0), desc,
                         font_size=11, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(16)

    # Benefit
    add_shape(slide, MSO_SHAPE.RECTANGLE, x + Inches(0.15), y + Inches(3.3), Inches(1.5), Pt(1), fill_color=CARD_BORDER)
    add_icon_shape(slide, x + Inches(0.15), y + Inches(3.55), Inches(0.22), "up_arrow", color)
    txBox = add_text_box(slide, x + Inches(0.15), y + Inches(3.85), Inches(1.9), Inches(0.7), benefit,
                         font_size=10, color=color)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(15)

# Footer note
add_text_box(slide, Inches(0.8), Inches(7.0), Inches(11), Inches(0.3),
             "A flexible model: start with free content partnerships, scale into paid API access as value is proven.",
             font_size=12, color=LIGHT_GRAY)


# ════════════════════════════════════════════
# SLIDE 11: CLOSING / CTA
# ════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, DARK_BG)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.06), fill_color=ACCENT_GREEN)

add_text_box(slide, Inches(0.8), Inches(0.8), Inches(12), Inches(0.7),
             "Let's Build This Together", font_size=40, color=WHITE, bold=True)

# Quote
add_rounded_rect(slide, Inches(0.8), Inches(1.7), Inches(11.7), Inches(0.9), CARD_BG, CARD_BORDER)
add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.7), Inches(0.06), Inches(0.9), fill_color=ACCENT_GREEN)
txBox = add_text_box(slide, Inches(1.2), Inches(1.85), Inches(11.0), Inches(0.6),
             "\"TechPoint already covers policy better than any Nigerian tech publication. We can make that coverage impossible to replicate.\"",
             font_size=15, color=WHITE)
txBox.text_frame.paragraphs[0].font.italic = True
txBox.text_frame.paragraphs[0].line_spacing = Pt(22)

# Four step CTA cards
cta_steps = [
    ("15 min", "Live Demo", "See OurNigeria's data capabilities in action with real government fiscal data", ACCENT_GREEN),
    ("30 min", "IntelPoint Deep-Dive", "Explore API integration for faster, more comprehensive research reports", ACCENT_TEAL),
    ("Pilot", "Proof of Concept", "One co-branded data article to prove the traffic and engagement impact", GOLD_ACCENT),
    ("Scale", "Full Partnership", "Embedded widgets, event track, newsletter integration, API access", RGBColor(0xA7, 0x5C, 0xFF)),
]

for i, (time_label, title, desc, color) in enumerate(cta_steps):
    x = Inches(0.8 + i * 3.1)
    y = Inches(3.1)

    add_rounded_rect(slide, x, y, Inches(2.8), Inches(3.0), CARD_BG, CARD_BORDER)
    add_shape(slide, MSO_SHAPE.RECTANGLE, x, y, Inches(2.8), Inches(0.06), fill_color=color)

    # Time/stage label
    add_rounded_rect(slide, x + Inches(0.25), y + Inches(0.35), Inches(1.0), Inches(0.4), color)
    add_text_box(slide, x + Inches(0.25), y + Inches(0.37), Inches(1.0), Inches(0.35), time_label,
                 font_size=13, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

    # Title
    add_text_box(slide, x + Inches(0.25), y + Inches(1.0), Inches(2.3), Inches(0.4), title,
                 font_size=16, color=WHITE, bold=True)

    # Description
    txBox = add_text_box(slide, x + Inches(0.25), y + Inches(1.5), Inches(2.3), Inches(1.3), desc,
                         font_size=11, color=LIGHT_GRAY)
    txBox.text_frame.paragraphs[0].line_spacing = Pt(17)

    # Connector arrow between cards
    if i < 3:
        add_icon_shape(slide, x + Inches(2.88), y + Inches(1.3), Inches(0.2), "arrow_right", color)

# Contact bar
add_rounded_rect(slide, Inches(0.8), Inches(6.5), Inches(11.7), Inches(0.6), CARD_BG, CARD_BORDER)
add_text_box(slide, Inches(1.2), Inches(6.58), Inches(11.0), Inches(0.4),
             "Contact: Warm introduction via Timi \u2192 Director of Sales    |    ournigeria.ng    |    March 2026",
             font_size=12, color=LIGHT_GRAY, alignment=PP_ALIGN.CENTER)


# ── Save ──
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "techpoint_professional.pptx")
prs.save(output_path)
print(f"Saved to: {output_path}")
