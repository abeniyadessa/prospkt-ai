from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


DIR = Path(__file__).parent
W, H = 1080, 1350

CANVAS = "#FAFAFA"
SURFACE = "#FFFFFF"
ELEVATED = "#F6F6F5"
SIDEBAR = "#F5F5F4"
INK = "#0A0A0A"
MUTED = "#6B6B6B"
SUBTLE = "#9F9F9E"
HAIRLINE = "#ECECEA"
BORDER = "#E3E3E1"
SUCCESS = "#2E7D4F"
WARNING = "#B47A1F"
DANGER = "#C2352C"
BLUE = "#315F77"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"


def font(size: int, bold: bool = False, black: bool = False, mono: bool = False):
    if mono:
        return ImageFont.truetype(FONT_MONO, size)
    if black:
        return ImageFont.truetype(FONT_BLACK, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def draw_text_lines(draw, x, y, lines, size, fill=INK, bold=False, black=False, gap=10):
    face = font(size, bold=bold, black=black)
    for line in lines:
        draw.text((x, y), line, font=face, fill=fill)
        y += size + gap
    return y


def shadow(img, box, radius=24, blur=18, alpha=22, dy=12):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=(10, 10, 10, alpha))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def rr(img, box, fill=SURFACE, radius=20, outline=HAIRLINE, width=1, with_shadow=False):
    if with_shadow:
        shadow(img, box, radius=radius)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def header(draw, label="Prospkt.ai"):
    draw.text((72, 64), label, font=font(24, bold=True), fill=INK)
    draw.text((72, 96), "AI sales workflow", font=font(17), fill=MUTED)


def pill(draw, box, text, fill=ELEVATED, color=INK, size=20):
    draw.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=fill, outline=BORDER)
    bbox = draw.textbbox((0, 0), text, font=font(size, bold=True))
    draw.text(
        (
            box[0] + (box[2] - box[0] - bbox[2] + bbox[0]) / 2,
            box[1] + (box[3] - box[1] - bbox[3] + bbox[1]) / 2 - 2,
        ),
        text,
        font=font(size, bold=True),
        fill=color,
    )


def browser_bar(draw, x, y, w, title="app.prospkt.ai"):
    draw.rounded_rectangle((x, y, x + w, y + 56), radius=20, fill=ELEVATED)
    draw.rectangle((x, y + 28, x + w, y + 56), fill=ELEVATED)
    for i, c in enumerate(["#E06055", "#E7B84F", "#59B472"]):
        draw.ellipse((x + 24 + i * 24, y + 20, x + 40 + i * 24, y + 36), fill=c)
    draw.text((x + 122, y + 19), title, font=font(15, mono=True), fill=SUBTLE)


def dashboard(img, x, y, w, h, compact=False):
    d = ImageDraw.Draw(img)
    rr(img, (x, y, x + w, y + h), SURFACE, 28, BORDER, with_shadow=True)
    browser_bar(d, x, y, w, "app.prospkt.ai / dashboard")
    side_w = 190 if not compact else 158
    d.rectangle((x, y + 56, x + side_w, y + h), fill=SIDEBAR)
    d.rounded_rectangle((x + 24, y + 88, x + 56, y + 120), radius=8, fill=INK)
    d.text((x + 70, y + 92), "Prospkt", font=font(22, bold=True), fill=INK)

    nav_items = ["Home", "Campaigns", "CRM", "Pipeline", "Calls", "Bookings"]
    for i, item in enumerate(nav_items):
        yy = y + 150 + i * (43 if compact else 48)
        if i == 0:
            d.rounded_rectangle((x + 22, yy - 9, x + side_w - 22, yy + 28), radius=10, fill=SURFACE)
            color = INK
        else:
            color = MUTED
        d.text((x + 48, yy), item, font=font(16, bold=True), fill=color)

    cx, cy = x + side_w + 38, y + 94
    d.text((cx, cy), "Good afternoon, Abeni", font=font(30 if not compact else 24, bold=True), fill=INK)
    d.text((cx, cy + 38), "Agent ready: qualify, call, follow up, book.", font=font(19 if not compact else 16), fill=MUTED)

    stats = [("Leads", "128"), ("Calls", "24"), ("Booked", "7"), ("Conv.", "18%")]
    stat_w = (w - side_w - 96) // 4
    for i, (label, value) in enumerate(stats):
        sx = cx + i * (stat_w + 14)
        sy = cy + 82
        rr(img, (sx, sy, sx + stat_w, sy + 92), SURFACE, 14, BORDER)
        d.text((sx + 16, sy + 18), label, font=font(15), fill=MUTED)
        d.text((sx + 16, sy + 46), value, font=font(32 if not compact else 26, bold=True), fill=INK)

    activity_w = int((w - side_w - 104) * 0.63)
    ax, ay = cx, cy + 208
    rr(img, (ax, ay, ax + activity_w, ay + 150), SURFACE, 16, BORDER)
    d.text((ax + 22, ay + 22), "Agent activity", font=font(23, bold=True), fill=INK)
    rows = [
        ("Queued 18 high-fit leads", "#E8F3EC"),
        ("Skipped no-consent records", "#F7ECD8"),
        ("Booked HVAC estimate", "#E8ECFA"),
    ]
    for i, (text, dot) in enumerate(rows):
        yy = ay + 66 + i * 34
        d.ellipse((ax + 22, yy, ax + 38, yy + 16), fill=dot)
        d.text((ax + 52, yy - 3), text, font=font(16, bold=True), fill=INK)

    vx = ax + activity_w + 24
    rr(img, (vx, ay, x + w - 36, ay + 150), INK, 16, INK)
    d.text((vx + 22, ay + 22), "Voice demo", font=font(22, bold=True), fill=SURFACE)
    for i, line in enumerate(["Natural opener", "Qualifies", "Books"]):
        d.text((vx + 22, ay + 62 + i * 28), line, font=font(15), fill="#D8D8D4")


def feature_card(img, box, title, desc, color=SUCCESS):
    d = ImageDraw.Draw(img)
    rr(img, box, SURFACE, 18, BORDER, with_shadow=True)
    x0, y0, x1, _ = box
    d.ellipse((x0 + 28, y0 + 30, x0 + 48, y0 + 50), fill=color)
    d.text((x0 + 66, y0 + 24), title, font=font(26, bold=True), fill=INK)
    d.text((x0 + 28, y0 + 76), desc, font=font(20), fill=MUTED)


def slide_01():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    header(d)
    d.text((72, 218), "An AI sales rep", font=font(72, black=True), fill=INK)
    d.text((72, 296), "for local service", font=font(72, black=True), fill=INK)
    d.text((72, 374), "businesses.", font=font(72, black=True), fill=INK)
    d.text((74, 472), "Find leads. Follow up. Book jobs. Keep control.", font=font(27), fill=MUTED)
    dashboard(img, 72, 582, 936, 532)
    pill(d, (72, 1188, 232, 1238), "Lead engine", "#E8F3EC", SUCCESS)
    pill(d, (252, 1188, 442, 1238), "Campaigns", "#F7ECD8", WARNING)
    pill(d, (462, 1188, 626, 1238), "Voice calls", "#E8ECFA", BLUE)
    d.text((812, 1198), "Built at YALID", font=font(20, bold=True), fill=MUTED)
    return img


def slide_02():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    header(d)
    d.text((72, 210), "From lead", font=font(76, black=True), fill=INK)
    d.text((72, 290), "to booked job", font=font(76, black=True), fill=INK)

    y = 474
    cards = [
        ("Find", "Discover local service leads", SUCCESS),
        ("Qualify", "Score, filter, and route", WARNING),
        ("Call", "Start voice follow-up", BLUE),
        ("Book", "Log outcome and hand off", INK),
    ]
    for i, (title, desc, color) in enumerate(cards):
        x = 72 + (i % 2) * 486
        cy = y + (i // 2) * 230
        feature_card(img, (x, cy, x + 450, cy + 156), title, desc, color)

    d.line((522, 552, 558, 552), fill=BORDER, width=3)
    d.line((294, 630, 294, 704), fill=BORDER, width=3)
    d.line((786, 630, 786, 704), fill=BORDER, width=3)
    d.line((522, 782, 558, 782), fill=BORDER, width=3)

    rr(img, (72, 1008, 1008, 1136), SURFACE, 22, BORDER)
    d.text((104, 1036), "The workflow stays visible.", font=font(30, bold=True), fill=INK)
    d.text((104, 1086), "Controls, limits, opt-outs, and CRM memory remain visible.", font=font(20), fill=MUTED)
    return img


def slide_03():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    header(d)
    d.text((72, 206), "Workspace", font=font(76, black=True), fill=INK)
    d.text((72, 286), "command center", font=font(76, black=True), fill=INK)
    dashboard(img, 72, 420, 936, 528)
    feature_card(img, (72, 1026, 366, 1168), "Activity", "Live agent events", BLUE)
    feature_card(img, (393, 1026, 687, 1168), "Budget", "Daily call limits", WARNING)
    feature_card(img, (714, 1026, 1008, 1168), "Memory", "CRM history", SUCCESS)
    return img


def slide_04():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    header(d)
    d.text((72, 214), "What’s inside", font=font(76, black=True), fill=INK)
    d.text((74, 304), "Core areas we’ve been building.", font=font(28), fill=MUTED)
    items = [
        ("Lead scoring", "Priority, source, website status", SUCCESS),
        ("Campaign lanes", "Warm recovery and cold B2B", WARNING),
        ("Voice demo", "Test the rep before launch", BLUE),
        ("Call outcomes", "Transcripts, notes, next steps", INK),
        ("Guardrails", "DNC, opt-outs, calling windows", DANGER),
        ("Bookings", "Calendar handoff and follow-up", SUCCESS),
    ]
    for i, (title, desc, color) in enumerate(items):
        x = 72 + (i % 2) * 486
        y = 442 + (i // 2) * 188
        feature_card(img, (x, y, x + 450, y + 138), title, desc, color)
    rr(img, (72, 1084, 1008, 1196), INK, 24, INK)
    d.text((108, 1118), "Prospkt.ai", font=font(34, bold=True), fill=SURFACE)
    d.text((108, 1160), "AI sales workflow for local service businesses", font=font(21), fill="#D8D8D4")
    return img


def main():
    slides = [slide_01(), slide_02(), slide_03(), slide_04()]
    for i, img in enumerate(slides, start=1):
        out = DIR / f"yalid-prospkt-clean-carousel-{i:02d}.png"
        img.convert("RGB").save(out, quality=96)
        print(out)


if __name__ == "__main__":
    main()
