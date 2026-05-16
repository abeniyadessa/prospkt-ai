from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


DIR = Path(__file__).parent
W, H = 1080, 1350

CANVAS = "#FAFAFA"
SURFACE = "#FFFFFF"
SIDEBAR = "#F5F5F4"
ELEVATED = "#F6F6F5"
INK = "#0A0A0A"
MUTED = "#6B6B6B"
SUBTLE = "#9F9F9E"
HAIR = "#ECECEA"
BORDER = "#E3E3E1"
SUCCESS = "#2E7D4F"
WARNING = "#B47A1F"
DANGER = "#C2352C"
BLUE = "#315F77"
SOFT_GREEN = "#E8F3EC"
SOFT_WARN = "#F7ECD8"
SOFT_BLUE = "#E8ECFA"
SOFT_RED = "#FAE3E0"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"


def ft(size: int, bold=False, black=False, mono=False):
    if mono:
        return ImageFont.truetype(FONT_MONO, size)
    if black:
        return ImageFont.truetype(FONT_BLACK, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def text(draw, xy, value, size, fill=INK, bold=False, black=False, mono=False):
    draw.text(xy, value, font=ft(size, bold=bold, black=black, mono=mono), fill=fill)


def paragraph(draw, x, y, lines, size=28, fill=MUTED, gap=10, bold=False):
    for line in lines:
        text(draw, (x, y), line, size, fill=fill, bold=bold)
        y += size + gap
    return y


def card_shadow(img, box, radius=28, blur=20, alpha=24, dy=14):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def rr(img, box, fill=SURFACE, radius=24, outline=BORDER, shadow=False, width=1):
    if shadow:
        card_shadow(img, box, radius=radius)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def top_label(draw, label="Prospkt.ai"):
    text(draw, (80, 72), label, 24, bold=True)
    text(draw, (80, 104), "AI sales workflow", 18, fill=MUTED)


def pill(draw, box, value, fill=ELEVATED, color=INK):
    draw.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=fill, outline=BORDER)
    f = ft(20, bold=True)
    b = draw.textbbox((0, 0), value, font=f)
    draw.text(
        (box[0] + (box[2] - box[0] - b[2] + b[0]) / 2, box[1] + (box[3] - box[1] - b[3] + b[1]) / 2 - 2),
        value,
        font=f,
        fill=color,
    )


def browser(draw, x, y, w, title="app.prospkt.ai"):
    draw.rounded_rectangle((x, y, x + w, y + 56), radius=22, fill=ELEVATED)
    draw.rectangle((x, y + 28, x + w, y + 56), fill=ELEVATED)
    for i, c in enumerate(["#E06055", "#E7B84F", "#59B472"]):
        draw.ellipse((x + 26 + i * 24, y + 20, x + 42 + i * 24, y + 36), fill=c)
    text(draw, (x + 128, y + 19), title, 15, fill=SUBTLE, mono=True)


def dashboard_mock(img, x, y, w, h):
    d = ImageDraw.Draw(img)
    rr(img, (x, y, x + w, y + h), SURFACE, 30, BORDER, shadow=True)
    browser(d, x, y, w, "app.prospkt.ai / dashboard")
    side = int(w * 0.22)
    d.rectangle((x, y + 56, x + side, y + h), fill=SIDEBAR)
    d.rounded_rectangle((x + 24, y + 92, x + 56, y + 124), radius=8, fill=INK)
    text(d, (x + 72, y + 95), "Prospkt", 22, bold=True)
    nav = ["Home", "Campaigns", "CRM", "Pipeline", "Calls", "Bookings"]
    for i, item in enumerate(nav):
        yy = y + 160 + i * 50
        if i == 0:
            d.rounded_rectangle((x + 22, yy - 10, x + side - 22, yy + 30), radius=10, fill=SURFACE)
            col = INK
        else:
            col = MUTED
        text(d, (x + 50, yy), item, 16, fill=col, bold=True)

    cx, cy = x + side + 42, y + 104
    text(d, (cx, cy), "Good afternoon, Abeni", 30, bold=True)
    text(d, (cx, cy + 42), "Agent ready: qualify, call, follow up, book.", 19, fill=MUTED)
    stat_w = (w - side - 108) // 4
    for i, (label, val) in enumerate([("Leads", "128"), ("Calls", "24"), ("Booked", "7"), ("Conv.", "18%")]):
        sx, sy = cx + i * (stat_w + 14), cy + 88
        rr(img, (sx, sy, sx + stat_w, sy + 92), SURFACE, 14, BORDER)
        text(d, (sx + 16, sy + 18), label, 15, fill=MUTED)
        text(d, (sx + 16, sy + 47), val, 32, bold=True)

    ax, ay = cx, cy + 220
    rr(img, (ax, ay, ax + 410, ay + 158), SURFACE, 16, BORDER)
    text(d, (ax + 22, ay + 22), "Agent activity", 24, bold=True)
    for i, (copy, fill) in enumerate([
        ("Queued 18 high-fit leads", SOFT_GREEN),
        ("Skipped no-consent records", SOFT_WARN),
        ("Booked HVAC estimate", SOFT_BLUE),
    ]):
        yy = ay + 70 + i * 34
        d.ellipse((ax + 22, yy, ax + 38, yy + 16), fill=fill)
        text(d, (ax + 52, yy - 3), copy, 16, bold=True)

    vx = ax + 434
    rr(img, (vx, ay, x + w - 36, ay + 158), INK, 16, INK)
    text(d, (vx + 22, ay + 22), "Voice demo", 23, fill=SURFACE, bold=True)
    for i, copy in enumerate(["Natural opener", "Qualifies", "Books"]):
        text(d, (vx + 22, ay + 64 + i * 30), copy, 15, fill="#D8D8D4")


def lead_table_mock(img, x, y, w, h):
    d = ImageDraw.Draw(img)
    rr(img, (x, y, x + w, y + h), SURFACE, 28, BORDER, shadow=True)
    browser(d, x, y, w, "app.prospkt.ai / crm")
    text(d, (x + 36, y + 96), "Leads", 34, bold=True)
    text(d, (x + 36, y + 138), "Prioritized by fit, source, and status.", 20, fill=MUTED)
    headers = ["Business", "Score", "Website", "Lane", "Status"]
    col = [36, 378, 500, 650, 810]
    ty = y + 206
    d.rectangle((x + 28, ty - 24, x + w - 28, ty + 28), fill=ELEVATED)
    for i, htxt in enumerate(headers):
        text(d, (x + col[i], ty - 8), htxt, 15, fill=MUTED, bold=True)
    rows = [
        ("Miller HVAC", "9.2", "Outdated", "Cold B2B", "Queued"),
        ("A1 Roofing", "8.7", "None", "Warm", "Follow-up"),
        ("Grand Rapids Plumbing", "7.9", "Outdated", "Cold B2B", "New"),
        ("Bright Cleaners", "6.8", "Modern", "Cold B2B", "Called"),
    ]
    for r, row in enumerate(rows):
        yy = ty + 58 + r * 62
        d.line((x + 28, yy - 20, x + w - 28, yy - 20), fill=HAIR, width=1)
        for i, value in enumerate(row):
            fill = INK if i in (0, 1) else MUTED
            bold = i in (0, 1)
            text(d, (x + col[i], yy), value, 17, fill=fill, bold=bold)
        d.rounded_rectangle((x + col[1] - 8, yy - 8, x + col[1] + 54, yy + 24), radius=8, fill=SOFT_GREEN if r < 2 else ELEVATED)


def campaign_mock(img, x, y, w, h):
    d = ImageDraw.Draw(img)
    rr(img, (x, y, x + w, y + h), SURFACE, 28, BORDER, shadow=True)
    text(d, (x + 36, y + 34), "Campaign lanes", 34, bold=True)
    lanes = [
        ("Warm recovery", "Missed calls and old estimates", SUCCESS, "Ready"),
        ("Cold B2B", "Local businesses with service need", BLUE, "Ready"),
        ("Consumer outreach", "Strict consent and opt-out rules", WARNING, "Guarded"),
    ]
    for i, (title, desc, color, status) in enumerate(lanes):
        yy = y + 104 + i * 130
        rr(img, (x + 32, yy, x + w - 32, yy + 104), ELEVATED, 16, HAIR)
        d.ellipse((x + 58, yy + 34, x + 82, yy + 58), fill=color)
        text(d, (x + 104, yy + 24), title, 24, bold=True)
        text(d, (x + 104, yy + 58), desc, 18, fill=MUTED)
        pill(d, (x + w - 158, yy + 30, x + w - 58, yy + 66), status, SOFT_GREEN if status == "Ready" else SOFT_WARN, SUCCESS if status == "Ready" else WARNING)


def guardrail_mock(img, x, y, w, h):
    d = ImageDraw.Draw(img)
    rr(img, (x, y, x + w, y + h), SURFACE, 28, BORDER, shadow=True)
    text(d, (x + 36, y + 34), "Guardrails", 34, bold=True)
    checks = [
        ("Calling window", "Only inside allowed hours", SUCCESS),
        ("Daily caps", "Budget and call volume limits", WARNING),
        ("Opt-outs", "STOP and DNC are enforced", DANGER),
        ("AI disclosure", "Rep identifies as AI", BLUE),
    ]
    for i, (title, desc, color) in enumerate(checks):
        col = i % 2
        row = i // 2
        xx = x + 42 + col * 430
        yy = y + 104 + row * 78
        d.ellipse((xx, yy + 8, xx + 24, yy + 32), fill=color)
        text(d, (xx + 44, yy), title, 21, bold=True)
        text(d, (xx + 44, yy + 30), desc, 15, fill=MUTED)


def slide_base():
    return Image.new("RGBA", (W, H), CANVAS)


def slide1():
    img = slide_base()
    d = ImageDraw.Draw(img)
    top_label(d)
    text(d, (80, 220), "Building the", 78, black=True)
    text(d, (80, 304), "AI sales rep", 78, black=True)
    text(d, (80, 388), "for service teams.", 78, black=True)
    paragraph(d, 82, 500, ["A product preview of the Prospkt app:", "lead discovery, voice follow-up, bookings, and control."], 28)
    dashboard_mock(img, 80, 660, 920, 500)
    text(d, (80, 1232), "Built at YALID", 20, fill=MUTED, bold=True)
    return img


def slide2():
    img = slide_base()
    d = ImageDraw.Draw(img)
    top_label(d)
    text(d, (80, 218), "The workflow", 78, black=True)
    text(d, (80, 302), "we’re solving.", 78, black=True)
    stages = [
        ("Find", "Local leads worth contacting", SUCCESS),
        ("Qualify", "Fit, status, source, and rules", WARNING),
        ("Call", "AI voice follow-up with context", BLUE),
        ("Book", "Outcome, next step, appointment", INK),
    ]
    for i, (title, desc, color) in enumerate(stages):
        x = 80 + (i % 2) * 470
        y = 500 + (i // 2) * 220
        rr(img, (x, y, x + 410, y + 150), SURFACE, 22, BORDER, shadow=True)
        d.ellipse((x + 30, y + 34, x + 54, y + 58), fill=color)
        text(d, (x + 76, y + 28), title, 31, bold=True)
        text(d, (x + 30, y + 88), desc, 21, fill=MUTED)
    rr(img, (80, 1014, 1000, 1128), INK, 24, INK)
    text(d, (118, 1048), "Keep the motion visible. Automate the repetition.", 30, fill=SURFACE, bold=True)
    text(d, (118, 1090), "Owner controls stay in the interface.", 21, fill="#D8D8D4")
    return img


def slide3():
    img = slide_base()
    d = ImageDraw.Draw(img)
    top_label(d)
    text(d, (80, 214), "Lead engine", 82, black=True)
    paragraph(d, 82, 318, ["Find and prioritize local businesses before", "a campaign ever starts calling."], 28)
    lead_table_mock(img, 80, 500, 920, 500)
    pill(d, (80, 1078, 250, 1128), "Fit score", SOFT_GREEN, SUCCESS)
    pill(d, (270, 1078, 492, 1128), "Website status", ELEVATED, INK)
    pill(d, (512, 1078, 706, 1128), "Source rules", SOFT_BLUE, BLUE)
    return img


def slide4():
    img = slide_base()
    d = ImageDraw.Draw(img)
    top_label(d)
    text(d, (80, 214), "Campaigns", 82, black=True)
    paragraph(d, 82, 318, ["Different sales motions need different", "playbooks, scripts, and guardrails."], 28)
    campaign_mock(img, 80, 500, 920, 470)
    guardrail_mock(img, 80, 1010, 920, 280)
    return img


def slide5():
    img = slide_base()
    d = ImageDraw.Draw(img)
    top_label(d)
    text(d, (80, 214), "Voice follow-up", 82, black=True)
    paragraph(d, 82, 318, ["Test the rep, place calls, log outcomes,", "and hand off booked jobs."], 28)
    rr(img, (80, 506, 1000, 828), INK, 30, INK, shadow=True)
    text(d, (122, 550), "Voice demo", 38, fill=SURFACE, bold=True)
    for i, line in enumerate(["Natural opener", "Human-paced turn taking", "Qualifies before booking"]):
        y = 634 + i * 54
        d.ellipse((124, y + 8, 146, y + 30), fill=[SUCCESS, BLUE, WARNING][i])
        text(d, (166, y), line, 28, fill=SURFACE, bold=True)
    rr(img, (80, 902, 1000, 1088), SURFACE, 26, BORDER, shadow=True)
    text(d, (122, 942), "Call outcome", 31, bold=True)
    paragraph(d, 122, 994, ["Interested → appointment proposed", "Follow-up note saved to CRM"], 24)
    pill(d, (122, 1138, 316, 1188), "Transcript", ELEVATED, INK)
    pill(d, (336, 1138, 526, 1188), "Summary", ELEVATED, INK)
    pill(d, (546, 1138, 770, 1188), "Next step", SOFT_GREEN, SUCCESS)
    return img


def slide6():
    img = slide_base()
    d = ImageDraw.Draw(img)
    top_label(d)
    text(d, (80, 224), "What we’ve", 82, black=True)
    text(d, (80, 312), "been building.", 82, black=True)
    items = [
        ("Lead discovery", SUCCESS),
        ("Campaign playbooks", WARNING),
        ("AI voice calls", BLUE),
        ("Booking handoff", INK),
        ("CRM memory", SUCCESS),
        ("Owner guardrails", DANGER),
    ]
    for i, (label, color) in enumerate(items):
        y = 508 + i * 86
        d.ellipse((88, y + 12, 114, y + 38), fill=color)
        text(d, (138, y), label, 38, bold=True)
    rr(img, (80, 1084, 1000, 1212), INK, 28, INK)
    text(d, (120, 1122), "Prospkt.ai", 42, fill=SURFACE, bold=True)
    text(d, (120, 1172), "AI sales workflow for local service businesses", 24, fill="#D8D8D4")
    text(d, (80, 1258), "YALID", 18, fill=MUTED, bold=True)
    return img


def main():
    slides = [slide1(), slide2(), slide3(), slide4(), slide5(), slide6()]
    rgb = []
    for i, img in enumerate(slides, 1):
        out = DIR / f"prospkt-product-carousel-{i:02d}.png"
        final = img.convert("RGB")
        final.save(out, quality=96)
        rgb.append(final)
        print(out)
    pdf = DIR / "prospkt-product-carousel.pdf"
    rgb[0].save(pdf, save_all=True, append_images=rgb[1:])
    print(pdf)


if __name__ == "__main__":
    main()
