from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


OUT_DIR = Path(__file__).parent
W, H = 1080, 1350

CANVAS = "#FAFAFA"
SURFACE = "#FFFFFF"
ELEVATED = "#F6F6F5"
SIDEBAR = "#F5F5F4"
INK = "#0A0A0A"
MUTED = "#6B6B6B"
SUBTLE = "#9F9F9E"
HAIR = "#ECECEA"
BORDER = "#E3E3E1"
GREEN = "#2E7D4F"
BLUE = "#315F77"
GOLD = "#B47A1F"
RED = "#C2352C"
PURPLE = "#7752B8"
SOFT_GREEN = "#E8F3EC"
SOFT_BLUE = "#E8ECFA"
SOFT_GOLD = "#F7ECD8"
SOFT_RED = "#FAE3E0"
SOFT_PURPLE = "#EFE7FA"
SOFT_PEACH = "#FFE5DB"

FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_BLACK = "/System/Library/Fonts/Avenir Next.ttc"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"


def f(size: int, black=False, mono=False):
    return ImageFont.truetype(FONT_MONO if mono else FONT_BLACK if black else FONT, size)


def text(d, xy, value, size, fill=INK, black=False, mono=False):
    d.text(xy, value, font=f(size, black=black, mono=mono), fill=fill)


def paragraph(d, x, y, lines, size=25, fill=MUTED, gap=11):
    for line in lines:
        text(d, (x, y), line, size, fill=fill)
        y += size + gap


def bg():
    img = Image.new("RGBA", (W, H), CANVAS)
    return img


def shadow(img, box, radius=28, blur=24, alpha=30, dy=14):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def rr(img, box, fill=SURFACE, radius=24, outline=BORDER, width=1, do_shadow=False):
    if do_shadow:
        shadow(img, box, radius)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def pill(d, box, label, fill=ELEVATED, color=INK, dot=None):
    d.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=fill, outline=BORDER)
    x = box[0] + 18
    if dot:
        d.ellipse((x, box[1] + 18, x + 12, box[1] + 30), fill=dot)
        x += 28
    text(d, (x, box[1] + 13), label, 20, fill=color)


def logo(d, dark=False):
    fg = SURFACE if dark else INK
    bgc = SURFACE if dark else INK
    bolt = INK if dark else SURFACE
    d.rounded_rectangle((72, 64, 108, 100), radius=9, fill=bgc)
    d.polygon([(90, 72), (97, 84), (92, 84), (95, 94), (83, 81), (89, 81)], fill=bolt)
    text(d, (122, 69), "Prospkt", 24, fill=fg)


def footer(d, n, dark=False):
    col = "#AFAFAF" if dark else SUBTLE
    text(d, (72, 1244), "Built at YALID", 17, fill=col)
    text(d, (940, 1244), f"{n:02d}/06", 17, fill=col)


def headline(d, lines, y=164, dark=False):
    fill = SURFACE if dark else INK
    for i, line in enumerate(lines):
        text(d, (72, y + i * 78), line, 78, fill=fill, black=True)


def card(img, box, title, body, color=GREEN, fill=SURFACE):
    d = ImageDraw.Draw(img)
    rr(img, box, fill, 24, BORDER, do_shadow=True)
    x0, y0, x1, y1 = box
    d.ellipse((x0 + 28, y0 + 30, x0 + 50, y0 + 52), fill=color)
    text(d, (x0 + 68, y0 + 22), title, 28, fill=INK)
    if isinstance(body, str):
        paragraph(d, x0 + 28, y0 + 78, [body], 20)
    else:
        paragraph(d, x0 + 28, y0 + 78, body, 20)


def mini_window(img, box, title="Agent command center"):
    d = ImageDraw.Draw(img)
    rr(img, box, SURFACE, 28, BORDER, do_shadow=True)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0, x1, y0 + 58), radius=28, fill=ELEVATED)
    d.rectangle((x0, y0 + 28, x1, y0 + 58), fill=ELEVATED)
    for i, c in enumerate(["#E06055", "#E7B84F", "#59B472"]):
        d.ellipse((x0 + 26 + i * 24, y0 + 20, x0 + 42 + i * 24, y0 + 36), fill=c)
    text(d, (x0 + 126, y0 + 19), title, 16, fill=SUBTLE, mono=True)


def draw_agent_network(img, center=(540, 744)):
    d = ImageDraw.Draw(img)
    cx, cy = center
    nodes = [
        ("Campaigns", "Choose playbook", SOFT_PEACH, "#D55B50", 260, 560),
        ("Qualifier", "Check source", SOFT_PURPLE, PURPLE, 760, 560),
        ("Caller", "Follow up", "#E8F0DC", "#5C7A2E", 260, 930),
        ("Booking", "Book jobs", "#FCEFD1", GOLD, 760, 930),
    ]
    for _, _, _, fg, x, y in nodes:
        d.line((cx, cy, x + 88, y + 38), fill=fg, width=2)
    for r, alpha in [(154, 22), (122, 30), (92, 38)]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(10, 10, 10, alpha), width=2)
    rr(img, (cx - 102, cy - 102, cx + 102, cy + 102), SURFACE, 102, BORDER, do_shadow=True)
    d.rounded_rectangle((cx - 28, cy - 54, cx + 28, cy + 2), radius=15, fill=INK)
    d.polygon([(cx, cy - 43), (cx + 10, cy - 25), (cx + 2, cy - 25), (cx + 7, cy - 10), (cx - 12, cy - 30), (cx - 2, cy - 30)], fill=SURFACE)
    text(d, (cx - 66, cy + 22), "Prospkt Agent", 20)
    text(d, (cx - 64, cy + 52), "Guarded AI rep", 15, fill=MUTED)
    for title, label, bgc, fg, x, y in nodes:
        rr(img, (x, y, x + 210, y + 76), SURFACE, 18, BORDER, do_shadow=True)
        d.rounded_rectangle((x + 18, y + 18, x + 58, y + 58), radius=12, fill=bgc)
        d.ellipse((x + 32, y + 32, x + 44, y + 44), fill=fg)
        text(d, (x + 74, y + 17), title, 18)
        text(d, (x + 74, y + 42), label, 14, fill=MUTED)


def slide1():
    img = bg()
    d = ImageDraw.Draw(img)
    logo(d)
    headline(d, ["An AI rep", "with a real", "workflow."])
    paragraph(d, 74, 432, ["Built from campaigns, guardrails,", "voice calls, bookings, and CRM memory."], 28)
    draw_agent_network(img, (540, 770))
    pill(d, (348, 1118, 510, 1166), "20 calls", SOFT_GREEN, GREEN, GREEN)
    pill(d, (530, 1118, 680, 1166), "$5 cap", SOFT_GOLD, GOLD, GOLD)
    pill(d, (700, 1118, 852, 1166), "DNC", ELEVATED, INK, INK)
    footer(d, 1)
    return img


def slide2():
    img = bg()
    d = ImageDraw.Draw(img)
    logo(d)
    headline(d, ["Campaigns", "become", "playbooks."])
    mini_window(img, (90, 516, 990, 1118), "campaign lanes / playbooks")
    lanes = [
        ("Warm recovery", "Missed calls, forms, estimates, past customers", GREEN, SOFT_GREEN, "Ready"),
        ("Cold B2B", "Commercial accounts and local business buyers", BLUE, SOFT_BLUE, "Ready"),
        ("Cold consumer", "Locked until stricter consent controls", GOLD, SOFT_GOLD, "Guarded"),
    ]
    for i, (title, desc, color, fill, status) in enumerate(lanes):
        y = 610 + i * 138
        rr(img, (128, y, 952, y + 104), ELEVATED, 18, HAIR)
        d.ellipse((154, y + 38, 178, y + 62), fill=color)
        text(d, (202, y + 24), title, 26)
        text(d, (202, y + 60), desc, 18, fill=MUTED)
        pill(d, (814, y + 32, 930, y + 72), status, fill, color)
    rr(img, (128, 1014, 952, 1108), SURFACE, 24, BORDER, do_shadow=True)
    d.ellipse((154, 1046, 178, 1070), fill=INK)
    text(d, (202, 1038), "Default path", 27)
    text(d, (202, 1072), "Source rules + scripts + guardrails before the call.", 18, fill=MUTED)
    footer(d, 2)
    return img


def slide3():
    img = bg()
    d = ImageDraw.Draw(img)
    logo(d)
    headline(d, ["Leads are", "ranked before", "they dial."])
    mini_window(img, (88, 526, 992, 1118), "lead engine / Michigan queue")
    headers = ["Record", "Score", "Value", "Status"]
    xs = [136, 612, 730, 840]
    for x, h in zip(xs, headers):
        text(d, (x, 622), h, 16, fill=MUTED)
    rows = [
        ("Missed call: Miller HVAC", "9/10", GREEN, "Queued", SOFT_PURPLE, PURPLE),
        ("Old estimate: A1 Roofing", "8/10", GOLD, "Called", ELEVATED, MUTED),
        ("Past customer: Westside Plumbing", "8/10", GOLD, "Voicemail", SOFT_GOLD, GOLD),
        ("Property manager list", "7/10", RED, "New", SOFT_BLUE, BLUE),
        ("Booking confirmation", "7/10", GREEN, "Booked", SOFT_GREEN, GREEN),
    ]
    for i, row in enumerate(rows):
        y = 670 + i * 76
        d.line((118, y - 18, 962, y - 18), fill=HAIR, width=1)
        text(d, (136, y), row[0], 20)
        text(d, (612, y), row[1], 19)
        d.ellipse((746, y + 8, 758, y + 20), fill=row[2])
        pill(d, (824, y - 2, 956, y + 36), row[3], row[4], row[5])
    label_y = 1084
    pill(d, (140, label_y, 300, label_y + 48), "source", ELEVATED, INK, INK)
    pill(d, (320, label_y, 466, label_y + 48), "score", SOFT_GREEN, GREEN, GREEN)
    pill(d, (486, label_y, 650, label_y + 48), "timezone", SOFT_BLUE, BLUE, BLUE)
    footer(d, 3)
    return img


def slide4():
    img = bg()
    d = ImageDraw.Draw(img)
    logo(d)
    headline(d, ["Guardrails", "run before", "every call."])
    paragraph(d, 74, 432, ["The caller does not dial until the", "record passes safety checks."], 28)
    mini_window(img, (112, 562, 968, 1096), "guardrail evaluator")
    checks = [
        ("8am-9pm local", "timezone inferred from city/state", GREEN),
        ("Weekend pause", "optional workspace setting", GOLD),
        ("DNC scrub", "global and workspace-level opt-outs", RED),
        ("Source note", "required for warm recovery", BLUE),
        ("Consumer lock", "cold consumer requires acknowledgement", RED),
        ("Daily cap", "calls and spend checked before queue", GOLD),
    ]
    for i, (title, desc, color) in enumerate(checks):
        x = 150 + (i % 2) * 390
        y = 650 + (i // 2) * 126
        rr(img, (x, y, x + 342, y + 88), ELEVATED, 18, HAIR)
        d.ellipse((x + 24, y + 30, x + 48, y + 54), fill=color)
        text(d, (x + 68, y + 20), title, 21)
        text(d, (x + 68, y + 50), desc, 14, fill=MUTED)
    footer(d, 4)
    return img


def slide5():
    img = bg()
    d = ImageDraw.Draw(img)
    logo(d)
    headline(d, ["Calls write", "back to CRM", "memory."])
    mini_window(img, (94, 520, 986, 1118), "agent run / activity log")
    events = [
        ("08:31", "Budget check passed", "success", GREEN),
        ("08:32", "Qualified 41 active CRM records", "info", BLUE),
        ("08:33", "Miller HVAC queued for call", "success", GREEN),
        ("08:34", "Skipped consumer record: consent missing", "warning", GOLD),
        ("08:36", "Call outcome saved to CRM", "success", GREEN),
    ]
    for i, (time, msg, sev, color) in enumerate(events):
        y = 626 + i * 84
        rr(img, (132, y, 948, y + 58), ELEVATED, 14, HAIR)
        text(d, (154, y + 18), time, 16, fill=SUBTLE, mono=True)
        d.ellipse((248, y + 22, 262, y + 36), fill=color)
        text(d, (284, y + 17), msg, 20)
        pill(d, (790, y + 10, 920, y + 48), sev, SOFT_GREEN if color == GREEN else SOFT_GOLD if color == GOLD else SOFT_BLUE, color)
    rr(img, (246, 1060, 834, 1132), INK, 22, INK, do_shadow=True)
    text(d, (282, 1084), "lead → call → note → next step", 24, fill=SURFACE)
    footer(d, 5)
    return img


def slide6():
    img = Image.new("RGBA", (W, H), INK)
    d = ImageDraw.Draw(img)
    logo(d, dark=True)
    headline(d, ["What we’re", "building at", "YALID."], dark=True)
    paragraph(d, 74, 432, ["A service-sales workflow where", "the AI rep finds the next best lead,", "calls with guardrails, and remembers", "every outcome."], 28, fill="#D8D8D4")
    features = [
        ("Campaign playbooks", GOLD),
        ("Lead scoring", GREEN),
        ("Guarded voice calls", BLUE),
        ("Booking handoff", GREEN),
        ("CRM memory", SURFACE),
    ]
    for i, (label, color) in enumerate(features):
        y = 730 + i * 82
        d.ellipse((88, y + 12, 114, y + 38), fill=color)
        text(d, (138, y), label, 34, fill=SURFACE)
    rr(img, (72, 1134, 1008, 1214), SURFACE, 26, SURFACE)
    text(d, (112, 1156), "Prospkt.ai", 34, fill=INK)
    text(d, (318, 1163), "AI sales workflow for service businesses", 24, fill=MUTED)
    footer(d, 6, dark=True)
    return img


def main():
    slides = [slide1(), slide2(), slide3(), slide4(), slide5(), slide6()]
    rgb = []
    for i, slide in enumerate(slides, 1):
        out = OUT_DIR / f"prospkt-code-illustration-carousel-{i:02d}.png"
        final = slide.convert("RGB")
        final.save(out, quality=96)
        rgb.append(final)
        print(out)
    pdf = OUT_DIR / "prospkt-code-illustration-carousel.pdf"
    rgb[0].save(pdf, save_all=True, append_images=rgb[1:])
    print(pdf)


if __name__ == "__main__":
    main()
