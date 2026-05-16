from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


DIR = Path(__file__).parent
W, H = 1080, 1350

BLACK = "#080808"
INK = "#050816"
CREAM = "#FAFAF4"
PAPER = "#FFFFFF"
GRID = "#DCDDD6"
MUTED = "#666663"
SUBTLE = "#8A8A84"
GREEN = "#2E7D4F"
LIME = "#D8FF00"
BLUE = "#315F77"
GOLD = "#B47A1F"
RED = "#C2352C"
HAIR = "#E4E4DF"
SOFT_GREEN = "#E8F3EC"
SOFT_GOLD = "#F7ECD8"
SOFT_BLUE = "#E8ECFA"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"


def f(size: int, bold: bool = False, black: bool = False, mono: bool = False):
    if mono:
        return ImageFont.truetype(FONT_MONO, size)
    if black:
        return ImageFont.truetype(FONT_BLACK, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def bg(draw: ImageDraw.ImageDraw, fill=CREAM, dots=True):
    draw.rectangle((0, 0, W, H), fill=fill)
    if dots:
        for x in range(36, W, 32):
            for y in range(36, H, 32):
                draw.ellipse((x, y, x + 2, y + 2), fill=GRID)


def nav(d: ImageDraw.ImageDraw, idx: int, total: int = 5, dark: bool = False, label="PROSPKT.AI"):
    col = PAPER if dark else INK
    d.text((84, 80), "YALID", font=f(22, bold=True), fill=col)
    d.text((84, 112), label, font=f(14, bold=True), fill=col)
    d.rounded_rectangle((906, 78, 984, 118), radius=20, outline=col, width=2)
    d.line((930, 98, 962, 98), fill=col, width=2)
    d.line((952, 88, 962, 98), fill=col, width=2)
    d.line((952, 108, 962, 98), fill=col, width=2)
    d.rounded_rectangle((84, 1226, 232, 1264), radius=19, outline=col, width=2)
    d.text((111, 1235), "PRODUCT", font=f(16, bold=True), fill=col)
    d.rounded_rectangle((900, 1226, 986, 1264), radius=19, outline=col, width=2)
    d.text((919, 1235), f"{idx:02d}/{total:02d}", font=f(16, bold=True), fill=col)


def shadow(img: Image.Image, box, radius=24, alpha=34, blur=18, dy=14):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def round_rect(img: Image.Image, box, fill, radius=24, outline=None, width=1, sh=False):
    if sh:
        shadow(img, box, radius=radius)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width if outline else 1)


def text_block(d, xy, lines, size, fill, bold=False, black=False, leading=1.05):
    x, y = xy
    font = f(size, bold=bold, black=black)
    for line in lines:
        d.text((x, y), line, font=font, fill=fill)
        y += int(size * leading)
    return y


def pill(d, box, text, fill=PAPER, color=INK, outline=INK, size=26):
    d.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=fill, outline=outline, width=2 if outline else 1)
    bbox = d.textbbox((0, 0), text, font=f(size, bold=True))
    tx = box[0] + (box[2] - box[0] - bbox[2] + bbox[0]) / 2
    ty = box[1] + (box[3] - box[1] - bbox[3] + bbox[1]) / 2 - 3
    d.text((tx, ty), text, font=f(size, bold=True), fill=color)


def browser_chrome(d, x, y, w, title="app.prospkt.ai / dashboard"):
    d.rounded_rectangle((x, y, x + w, y + 58), radius=22, fill="#F3F3EF")
    d.rectangle((x, y + 28, x + w, y + 58), fill="#F3F3EF")
    for i, c in enumerate(["#E06055", "#E7B84F", "#59B472"]):
        d.ellipse((x + 26 + i * 24, y + 22, x + 42 + i * 24, y + 38), fill=c)
    d.text((x + 126, y + 20), title, font=f(15, mono=True), fill=SUBTLE)


def dashboard_panel(img, box):
    d = ImageDraw.Draw(img)
    x, y, w, h = box
    round_rect(img, (x, y, x + w, y + h), PAPER, radius=28, outline=HAIR, sh=True)
    browser_chrome(d, x, y, w)
    d.rectangle((x, y + 58, x + 196, y + h), fill="#F4F4F0")
    d.rounded_rectangle((x + 26, y + 92, x + 58, y + 124), radius=8, fill=BLACK)
    d.text((x + 72, y + 96), "Prospkt", font=f(23, bold=True), fill=INK)
    for i, item in enumerate(["Home", "Campaigns", "CRM", "Pipeline", "Calls", "Bookings"]):
        yy = y + 156 + i * 48
        if i == 0:
            d.rounded_rectangle((x + 24, yy - 10, x + 172, yy + 30), radius=12, fill=PAPER)
            color = INK
        else:
            color = MUTED
        d.text((x + 54, yy), item, font=f(17, bold=True), fill=color)

    cx, cy = x + 236, y + 104
    d.text((cx, cy), "Good afternoon, Abeni", font=f(30, bold=True), fill=INK)
    d.text((cx, cy + 38), "Agent ready: qualify, call, follow up, book.", font=f(19), fill=MUTED)
    stats = [("Leads", "128"), ("Calls", "24"), ("Booked", "7"), ("Conv.", "18%")]
    for i, (a, b) in enumerate(stats):
        sx = cx + i * 145
        d.rounded_rectangle((sx, cy + 78, sx + 126, cy + 166), radius=16, fill=PAPER, outline=HAIR)
        d.text((sx + 18, cy + 97), a, font=f(15), fill=MUTED)
        d.text((sx + 18, cy + 123), b, font=f(34, bold=True), fill=BLACK)
    d.rounded_rectangle((cx, cy + 196, cx + 396, cy + 352), radius=18, fill=PAPER, outline=HAIR)
    d.text((cx + 22, cy + 220), "Agent activity", font=f(23, bold=True), fill=INK)
    for i, line in enumerate(["Queued 18 high-fit leads", "Skipped no-consent records", "Booked HVAC estimate"]):
        yy = cy + 268 + i * 34
        d.ellipse((cx + 22, yy, cx + 38, yy + 16), fill=[SOFT_GREEN, SOFT_GOLD, SOFT_BLUE][i])
        d.text((cx + 52, yy - 3), line, font=f(16, bold=True), fill=INK)
    d.rounded_rectangle((cx + 420, cy + 196, cx + 626, cy + 352), radius=18, fill=BLACK)
    d.text((cx + 442, cy + 220), "Voice demo", font=f(23, bold=True), fill=PAPER)
    for i, line in enumerate(["Natural opener", "Qualifies", "Books"]):
        d.text((cx + 442, cy + 260 + i * 30), line, font=f(16), fill="#D8D8D4")


def app_tile(img, box, title, lines, accent=GREEN):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    round_rect(img, box, PAPER, radius=24, outline=HAIR, sh=True)
    d.ellipse((x0 + 28, y0 + 28, x0 + 48, y0 + 48), fill=accent)
    d.text((x0 + 64, y0 + 22), title, font=f(28, bold=True), fill=INK)
    for i, line in enumerate(lines):
        d.text((x0 + 32, y0 + 78 + i * 34), line, font=f(24), fill=MUTED)


def slide1():
    img = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    bg(d)
    nav(d, 1)
    text_block(d, (84, 238), ["AI sales rep", "starter pack"], 88, INK, black=True, leading=0.94)
    d.text((88, 430), "for local service businesses", font=f(37, bold=True), fill=MUTED)
    d.rounded_rectangle((112, 644, 968, 944), radius=4, fill=PAPER, outline=HAIR)
    d.polygon([(112, 644), (540, 500), (968, 644)], fill="#ECEDE9", outline=HAIR)
    app_tile(img, (152, 520, 410, 686), "Leads", ["Score", "Source"], GREEN)
    app_tile(img, (456, 488, 736, 672), "Calls", ["Queue", "Voice"], BLUE)
    app_tile(img, (648, 662, 912, 830), "Bookings", ["Calendar", "CRM"], GOLD)
    d.text((184, 1008), "Prospkt.ai", font=f(72, black=True), fill=INK)
    d.text((188, 1088), "built at YALID", font=f(42, bold=True), fill=MUTED)
    nav(d, 1)
    return img


def slide2():
    img = Image.new("RGBA", (W, H), BLACK)
    d = ImageDraw.Draw(img)
    bg(d, fill="#070A1F")
    for y in range(0, H):
        shade = int(18 + 42 * (y / H))
        d.line((0, y, W, y), fill=(4, 8, shade))
    for x in range(40, W, 32):
        for y in range(40, H, 32):
            d.ellipse((x, y, x + 2, y + 2), fill="#26305C")
    nav(d, 2, dark=True)
    text_block(d, (96, 250), ["Are you", "losing jobs", "to slow", "follow-up?"], 84, PAPER, black=True, leading=0.94)
    pill(d, (100, 762, 458, 830), "Missed calls", PAPER, BLUE, None, 30)
    pill(d, (500, 762, 900, 830), "Unworked leads", PAPER, BLUE, None, 30)
    pill(d, (154, 862, 548, 930), "Manual chasing", PAPER, BLUE, None, 30)
    pill(d, (590, 862, 930, 930), "No CRM memory", PAPER, BLUE, None, 30)
    d.rounded_rectangle((124, 1020, 956, 1122), radius=48, fill=PAPER)
    d.text((164, 1044), "Prospkt turns the follow-up motion into a workflow.", font=f(31, bold=True), fill=INK)
    nav(d, 2, dark=True)
    return img


def slide3():
    img = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    bg(d)
    nav(d, 3)
    d.text((84, 190), "Key areas", font=f(76, black=True), fill=INK)
    d.text((84, 268), "inside the app", font=f(44, bold=True), fill=MUTED)
    dashboard_panel(img, (84, 374, 912, 522))
    callouts = [
        (112, 994, "Lead scoring", "Priority, website status, source", GREEN),
        (396, 994, "Campaign lanes", "Warm, cold B2B, guarded", GOLD),
        (680, 994, "Voice agent", "Test, call, log, book", BLUE),
    ]
    for x, y, title, line, color in callouts:
        round_rect(img, (x, y, x + 252, y + 146), PAPER, radius=24, outline=HAIR, sh=True)
        d.ellipse((x + 24, y + 26, x + 44, y + 46), fill=color)
        d.text((x + 56, y + 20), title, font=f(25, bold=True), fill=INK)
        d.text((x + 24, y + 74), line, font=f(18), fill=MUTED)
    nav(d, 3)
    return img


def slide4():
    img = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    bg(d)
    nav(d, 4)
    d.text((84, 196), "Not just", font=f(76, black=True), fill=INK)
    d.text((84, 278), "another CRM", font=f(76, black=True), fill=INK)
    pill(d, (100, 378, 492, 456), "AI follow-up layer", PAPER, INK, INK, 32)
    cards = [
        ("Find", "Discover service leads", GREEN),
        ("Qualify", "Score and route them", GOLD),
        ("Call", "Voice agent outreach", BLUE),
        ("Book", "Calendar handoff", INK),
        ("Remember", "CRM activity history", GREEN),
        ("Control", "Budgets and guardrails", RED),
    ]
    for i, (title, line, color) in enumerate(cards):
        x = 84 + (i % 2) * 462
        y = 556 + (i // 2) * 178
        round_rect(img, (x, y, x + 410, y + 132), PAPER, radius=26, outline=HAIR, sh=True)
        d.ellipse((x + 28, y + 32, x + 54, y + 58), fill=color)
        d.text((x + 76, y + 24), title, font=f(34, bold=True), fill=INK)
        d.text((x + 76, y + 74), line, font=f(23), fill=MUTED)
    nav(d, 4)
    return img


def slide5():
    img = Image.new("RGBA", (W, H), LIME)
    d = ImageDraw.Draw(img)
    nav(d, 5)
    text_block(d, (88, 222), ["Built so", "follow-up", "actually", "happens."], 92, BLACK, black=True, leading=0.88)
    d.rounded_rectangle((86, 616, 868, 718), radius=20, fill=PAPER, outline=BLACK, width=3)
    d.text((122, 637), "Prospkt.ai", font=f(56, black=True), fill=BLACK)
    d.rotate if False else None
    d.text((88, 826), "Lead engine", font=f(34, bold=True), fill=BLACK)
    d.text((88, 884), "Campaign playbooks", font=f(34, bold=True), fill=BLACK)
    d.text((88, 942), "Voice calls", font=f(34, bold=True), fill=BLACK)
    d.text((88, 1000), "Booking handoff", font=f(34, bold=True), fill=BLACK)
    d.text((88, 1058), "Owner controls", font=f(34, bold=True), fill=BLACK)
    d.text((388, 1238), "YALID", font=f(18, bold=True), fill=BLACK)
    nav(d, 5)
    return img


def main():
    slides = [slide1(), slide2(), slide3(), slide4(), slide5()]
    for i, img in enumerate(slides, start=1):
        out = DIR / f"yalid-prospkt-carousel-{i:02d}.png"
        img.convert("RGB").save(out, quality=96)
        print(out)


if __name__ == "__main__":
    main()
