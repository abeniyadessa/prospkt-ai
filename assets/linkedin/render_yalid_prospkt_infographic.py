from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


OUT = Path(__file__).with_name("yalid-prospkt-linkedin-infographic.png")
W, H = 1200, 1500

BLACK = "#0A0A0A"
CANVAS = "#FAFAFA"
SURFACE = "#FFFFFF"
ELEVATED = "#F5F5F2"
HAIRLINE = "#E4E4DF"
MUTED = "#666663"
SUBTLE = "#8B8B87"
SUCCESS = "#2E7D4F"
WARNING = "#B47A1F"
DANGER = "#C2352C"
BLUE = "#315F77"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"


def font(size: int, bold: bool = False, black: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    if mono:
        return ImageFont.truetype(FONT_MONO, size)
    if black:
        return ImageFont.truetype(FONT_BLACK, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def shadowed_round_rect(draw_img: Image.Image, xy, radius, fill, outline=None, shadow=18):
    layer = Image.new("RGBA", draw_img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = xy
    d.rounded_rectangle((x0, y0 + 10, x1, y1 + 10), radius=radius, fill=(0, 0, 0, 32))
    layer = layer.filter(ImageFilter.GaussianBlur(shadow))
    draw_img.alpha_composite(layer)
    d = ImageDraw.Draw(draw_img)
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=1 if outline else 0)


def pill(d: ImageDraw.ImageDraw, xy, text, fill, color, size=18, bold=True):
    x0, y0, x1, y1 = xy
    d.rounded_rectangle(xy, radius=(y1 - y0) // 2, fill=fill)
    bbox = d.textbbox((0, 0), text, font=font(size, bold=bold))
    d.text((x0 + (x1 - x0 - (bbox[2] - bbox[0])) / 2, y0 + (y1 - y0 - (bbox[3] - bbox[1])) / 2 - 2), text, font=font(size, bold=bold), fill=color)


def text_lines(d, xy, lines, size, fill=MUTED, bold=False, spacing=8):
    x, y = xy
    f = font(size, bold=bold)
    for line in lines:
        d.text((x, y), line, font=f, fill=fill)
        y += size + spacing
    return y


def mini_card(img, xy, title, body, footer_kind):
    d = ImageDraw.Draw(img)
    x, y, w, h = xy
    shadowed_round_rect(img, (x, y, x + w, y + h), 22, SURFACE, HAIRLINE, shadow=10)
    d.text((x + 28, y + 28), title, font=font(25, bold=True), fill=BLACK)
    text_lines(d, (x + 28, y + 68), body, 18, fill=MUTED, spacing=8)
    fy = y + 160
    if footer_kind == "score":
        d.rounded_rectangle((x + 28, fy, x + 94, fy + 42), radius=10, fill="#E8F3EC")
        d.text((x + 45, fy + 8), "9.2", font=font(22, bold=True), fill=SUCCESS)
        d.rounded_rectangle((x + 106, fy, x + 286, fy + 42), radius=10, fill=ELEVATED)
        d.text((x + 124, fy + 12), "high-fit lead", font=font(18, bold=True), fill=BLACK)
    elif footer_kind == "lanes":
        pill(d, (x + 28, fy, x + 114, fy + 34), "Ready", "#E8F3EC", SUCCESS, 16)
        pill(d, (x + 126, fy, x + 224, fy + 34), "Guarded", "#F7ECD8", "#9A6619", 16)
    else:
        d.rounded_rectangle((x + 28, fy, x + 260, fy + 42), radius=10, fill=BLACK)
        d.ellipse((x + 46, fy + 14, x + 60, fy + 28), fill=SUCCESS)
        d.text((x + 72, fy + 12), "guardrails first", font=font(18, bold=True), fill="#FFFFFF")


def draw_dashboard(img):
    d = ImageDraw.Draw(img)
    x, y, w, h = 72, 420, 1056, 520
    shadowed_round_rect(img, (x, y, x + w, y + h), 28, SURFACE, HAIRLINE, shadow=22)
    d.rounded_rectangle((x, y, x + w, y + 62), radius=28, fill=ELEVATED)
    d.rectangle((x, y + 34, x + w, y + 62), fill=ELEVATED)
    for i, c in enumerate(["#E06055", "#E7B84F", "#59B472"]):
        d.ellipse((x + 26 + i * 26, y + 23, x + 42 + i * 26, y + 39), fill=c)
    d.text((x + 132, y + 22), "app.prospkt.ai / dashboard", font=font(17, mono=True), fill=SUBTLE)
    d.rectangle((x, y + 62, x + 214, y + h), fill=ELEVATED)
    d.rounded_rectangle((x + 28, y + 98, x + 58, y + 128), radius=8, fill=BLACK)
    d.polygon([(x + 43, y + 105), (x + 50, y + 117), (x + 45, y + 117), (x + 48, y + 125), (x + 36, y + 112), (x + 42, y + 112)], fill="#FFFFFF")
    d.text((x + 70, y + 101), "Prospkt", font=font(24, bold=True), fill=BLACK)
    nav = ["Home", "Campaigns", "CRM", "Pipeline", "Calls", "Bookings"]
    for i, item in enumerate(nav):
        yy = y + 156 + i * 46
        if i == 0:
            d.rounded_rectangle((x + 22, yy - 8, x + 192, yy + 30), radius=10, fill=SURFACE)
            col = BLACK
        else:
            col = MUTED
        d.text((x + 52, yy), item, font=font(18, bold=True), fill=col)

    cx, cy = x + 250, y + 104
    d.text((cx, cy - 14), "Good afternoon, Abeni", font=font(34, bold=True), fill=BLACK)
    d.text((cx, cy + 28), "The agent is ready to qualify, call, follow up, and book.", font=font(22), fill=MUTED)

    stats = [("Total leads", "128"), ("Calls today", "24"), ("Booked this week", "7"), ("Conversion", "18%")]
    for i, (label, value) in enumerate(stats):
        sx = cx + i * 188
        d.rounded_rectangle((sx, cy + 70, sx + 170, cy + 174), radius=16, fill=SURFACE, outline=HAIRLINE)
        d.text((sx + 22, cy + 92), label, font=font(17), fill=MUTED)
        d.text((sx + 22, cy + 126), value, font=font(42, bold=True), fill=BLACK)

    ax, ay = cx, cy + 204
    d.rounded_rectangle((ax, ay, ax + 472, ay + 174), radius=18, fill=SURFACE, outline=HAIRLINE)
    d.text((ax + 24, ay + 22), "Agent activity", font=font(25, bold=True), fill=BLACK)
    events = [
        ("#E8F3EC", "Queued 18 high-fit service leads", SUCCESS),
        ("#F7ECD8", "Skipped consumer records without consent", BLACK),
        ("#E8ECFA", "Booked HVAC estimate for Tuesday", BLACK),
    ]
    for i, (dot, label, color) in enumerate(events):
        yy = ay + 65 + i * 40
        d.ellipse((ax + 24, yy, ax + 42, yy + 18), fill=dot)
        d.text((ax + 58, yy - 1), label, font=font(18, bold=True), fill=BLACK)
        if i == 0:
            d.text((ax + 392, yy - 1), "live", font=font(18, bold=True), fill=color)

    vx, vy = cx + 502, cy + 204
    d.rounded_rectangle((vx, vy, vx + 232, vy + 174), radius=18, fill=BLACK)
    d.text((vx + 24, vy + 22), "Voice demo", font=font(25, bold=True), fill="#FFFFFF")
    for i, line in enumerate(["Sales-receptionist opener", "Human-paced replies", "Qualifies, then books"]):
        d.text((vx + 24, vy + 60 + i * 31), line, font=font(17), fill="#D8D8D4")
    d.rectangle((vx + 24, vy + 144, vx + 152, vy + 146), fill="#676763")


def main():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)

    for yy in range(0, H, 44):
        d.line((0, yy, W, yy), fill="#ECECE8", width=1)
    for xx in range(0, W, 44):
        d.line((xx, 0, xx, H), fill="#ECECE8", width=1)
    d.rectangle((0, 0, W, 440), fill="#F7F7F3")

    pill(d, (72, 64, 196, 104), "YALID", BLACK, "#FFFFFF", 18)
    pill(d, (212, 64, 386, 104), "product preview", SURFACE, MUTED, 18)

    d.text((72, 142), "Prospkt.ai", font=font(78, black=True), fill=BLACK)
    d.text((72, 226), "AI sales rep dashboard", font=font(42, bold=True), fill=MUTED)
    pill(d, (72, 302, 226, 346), "Lead engine", "#E8F3EC", SUCCESS, 18)
    pill(d, (242, 302, 430, 346), "Campaign lanes", "#F7ECD8", "#9A6619", 18)
    pill(d, (446, 302, 610, 346), "Voice calls", "#E8ECFA", BLUE, 18)

    shadowed_round_rect(img, (820, 94, 1128, 314), 28, BLACK, None, shadow=10)
    d.text((848, 134), "FEATURE AREAS", font=font(18, bold=True), fill="#BFBFBA")
    for i, item in enumerate(["Discover", "Qualify", "Call", "Book"]):
        yy = 176 + i * 32
        d.ellipse((848, yy + 2, 862, yy + 16), fill=[SUCCESS, WARNING, BLUE, "#FFFFFF"][i])
        d.text((876, yy - 3), item, font=font(24, bold=True), fill="#FFFFFF")

    draw_dashboard(img)

    d.text((72, 990), "KEY APP AREAS", font=font(18, bold=True), fill=SUBTLE)
    mini_card(img, (72, 1022, 330, 238), "CRM + scoring", ["Lead list", "Fit score", "Website status"], "score")
    mini_card(img, (435, 1022, 330, 238), "Playbooks", ["Warm recovery", "Cold B2B", "Guarded outreach"], "lanes")
    mini_card(img, (798, 1022, 330, 238), "Voice agent", ["Call queue", "Outcome logging", "Booking handoff"], "guard")

    d.rounded_rectangle((72, 1312, 1128, 1428), radius=24, fill=BLACK)
    d.text((106, 1342), "Find leads. Run playbooks. Call. Book. Track everything.", font=font(30, bold=True), fill="#FFFFFF")
    d.text((106, 1380), "AI sales workflow for local service businesses", font=font(22), fill="#D8D8D4")
    d.text((1018, 1380), "YALID ->", font=font(26, bold=True), fill="#FFFFFF")

    img.convert("RGB").save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
