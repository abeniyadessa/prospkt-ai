from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


OUT_DIR = Path(__file__).parent
DESKTOP = Path("/Users/abeni/Desktop")
W, H = 1080, 1350

CANVAS = "#FAFAFA"
SURFACE = "#FFFFFF"
INK = "#0A0A0A"
MUTED = "#6B6B6B"
SUBTLE = "#9F9F9E"
BORDER = "#E3E3E1"
HAIR = "#ECECEA"
GREEN = "#2E7D4F"
GOLD = "#B47A1F"
BLUE = "#315F77"
RED = "#C2352C"
SOFT_GREEN = "#E8F3EC"
SOFT_GOLD = "#F7ECD8"
SOFT_BLUE = "#E8ECFA"

FONT = "/System/Library/Fonts/SFNS.ttf"
FONT_BOLD = "/System/Library/Fonts/SFNS.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def screenshot_paths():
    return sorted(DESKTOP.glob("Screenshot 2026-05-11 at 2.*.png"))


PATHS = screenshot_paths()
SCREENS = {
    "home": PATHS[0],
    "campaigns_app": PATHS[1],
    "crm_app": PATHS[2],
    "pipeline_app": PATHS[3],
    "calls_app": PATHS[4],
    "bookings_app": PATHS[5],
    "settings_app": PATHS[6],
    "marketing_hero": PATHS[7],
    "marketing_stats": PATHS[8],
    "marketing_revenue": PATHS[9],
    "marketing_crm": PATHS[10],
}


def ft(size: int, bold=False, black=False):
    if black:
        return ImageFont.truetype(FONT_BLACK, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def draw_text(d, xy, value, size, fill=INK, bold=False, black=False):
    d.text(xy, value, font=ft(size, bold=bold, black=black), fill=fill)


def fit_text(d, xy, value, max_width, size, fill=INK, bold=False, black=False):
    while size > 16 and d.textbbox((0, 0), value, font=ft(size, bold=bold, black=black))[2] > max_width:
        size -= 2
    draw_text(d, xy, value, size, fill, bold, black)


def paragraph(d, x, y, lines, size=28, fill=MUTED, gap=12):
    for line in lines:
        draw_text(d, (x, y), line, size, fill=fill)
        y += size + gap
    return y


def crop_viewport(path: Path, mode="page"):
    im = Image.open(path).convert("RGB")
    if mode == "window":
        return im.crop((105, 74, 3145, 1888))
    if mode == "page":
        return im.crop((105, 252, 3145, 1888))
    if mode == "app":
        return im.crop((105, 252, 3145, 1888))
    if mode == "content":
        return im.crop((410, 252, 3145, 1888))
    return im


def cover_crop(im: Image.Image, size):
    tw, th = size
    iw, ih = im.size
    scale = max(tw / iw, th / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def contain(im: Image.Image, size):
    tw, th = size
    iw, ih = im.size
    scale = min(tw / iw, th / ih)
    return im.resize((int(iw * scale), int(ih * scale)), Image.Resampling.LANCZOS)


def shadow(img, box, radius=28, blur=26, alpha=36, dy=18):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def rounded_paste(base, im, box, radius=28, border=BORDER, bg=SURFACE, do_shadow=True):
    x0, y0, x1, y1 = box
    if do_shadow:
        shadow(base, box, radius=radius)
    w, h = x1 - x0, y1 - y0
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=bg, outline=border, width=1)
    im = cover_crop(im, (w, h))
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    base.paste(im, (x0, y0), mask)
    d.rounded_rectangle(box, radius=radius, outline=border, width=1)


def floating_label(base, x, y, label, fill=SURFACE, color=INK):
    d = ImageDraw.Draw(base)
    font = ft(21, bold=True)
    b = d.textbbox((0, 0), label, font=font)
    w = b[2] - b[0] + 44
    d.rounded_rectangle((x, y, x + w, y + 48), radius=24, fill=fill, outline=BORDER)
    d.ellipse((x + 18, y + 17, x + 30, y + 29), fill=color)
    d.text((x + 42, y + 12), label, font=font, fill=INK)


def logo(d, dark=False):
    col = SURFACE if dark else INK
    d.rounded_rectangle((72, 64, 108, 100), radius=9, fill=col)
    d.polygon([(90, 73), (97, 85), (92, 85), (95, 94), (83, 82), (89, 82)], fill=INK if dark else SURFACE)
    draw_text(d, (120, 69), "Prospkt", 25, fill=col, bold=True)


def footer(d, idx):
    draw_text(d, (72, 1244), "YALID build log", 18, fill=SUBTLE, bold=True)
    draw_text(d, (940, 1244), f"{idx:02d}/06", 18, fill=SUBTLE, bold=True)


def slide1():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    draw_text(d, (72, 172), "A real look at", 78, black=True)
    draw_text(d, (72, 252), "what we’re", 78, black=True)
    draw_text(d, (72, 332), "building.", 78, black=True)
    paragraph(d, 74, 448, ["Prospkt is becoming an AI sales workflow", "for service businesses: leads, calls,", "bookings, and CRM memory."], 27)
    hero = crop_viewport(SCREENS["marketing_hero"], "page")
    rounded_paste(img, hero, (72, 650, 1008, 1128), 30)
    floating_label(img, 100, 684, "Marketing hero", SOFT_GREEN, GREEN)
    floating_label(img, 100, 752, "Agent system", SURFACE, BLUE)
    footer(d, 1)
    return img


def slide2():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    draw_text(d, (72, 168), "The product", 78, black=True)
    draw_text(d, (72, 248), "story is already", 78, black=True)
    draw_text(d, (72, 328), "on the site.", 78, black=True)
    stats = crop_viewport(SCREENS["marketing_stats"], "page")
    revenue = crop_viewport(SCREENS["marketing_revenue"], "page")
    crm = crop_viewport(SCREENS["marketing_crm"], "page")
    rounded_paste(img, stats, (72, 510, 1008, 744), 26)
    rounded_paste(img, revenue, (72, 788, 532, 1118), 26)
    rounded_paste(img, crm, (560, 788, 1008, 1118), 26)
    floating_label(img, 104, 544, "3 lanes / 20 calls per day", SURFACE, GREEN)
    floating_label(img, 592, 822, "CRM memory", SURFACE, BLUE)
    footer(d, 2)
    return img


def slide3():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    draw_text(d, (72, 170), "The live app", 78, black=True)
    draw_text(d, (72, 250), "is catching up", 78, black=True)
    draw_text(d, (72, 330), "to the vision.", 78, black=True)
    home = crop_viewport(SCREENS["home"], "app")
    settings = crop_viewport(SCREENS["settings_app"], "app")
    rounded_paste(img, home, (72, 514, 1008, 888), 28)
    rounded_paste(img, settings, (168, 834, 912, 1132), 28)
    floating_label(img, 104, 548, "Agent control", SOFT_GREEN, GREEN)
    floating_label(img, 200, 868, "Workflow readiness", SURFACE, INK)
    footer(d, 3)
    return img


def slide4():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    draw_text(d, (72, 168), "Leads become", 78, black=True)
    draw_text(d, (72, 248), "a pipeline,", 78, black=True)
    draw_text(d, (72, 328), "not a list.", 78, black=True)
    crm = crop_viewport(SCREENS["crm_app"], "app")
    pipeline = crop_viewport(SCREENS["pipeline_app"], "app")
    rounded_paste(img, crm, (72, 500, 1008, 788), 28)
    rounded_paste(img, pipeline, (72, 826, 1008, 1132), 28)
    floating_label(img, 104, 532, "Find businesses", SURFACE, GREEN)
    floating_label(img, 104, 860, "Track each stage", SOFT_BLUE, BLUE)
    footer(d, 4)
    return img


def slide5():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    draw_text(d, (72, 168), "Playbooks,", 78, black=True)
    draw_text(d, (72, 248), "calls, and", 78, black=True)
    draw_text(d, (72, 328), "bookings.", 78, black=True)
    campaigns = crop_viewport(SCREENS["campaigns_app"], "app")
    calls = crop_viewport(SCREENS["calls_app"], "app")
    bookings = crop_viewport(SCREENS["bookings_app"], "app")
    rounded_paste(img, campaigns, (72, 498, 1008, 754), 26)
    rounded_paste(img, calls, (72, 792, 522, 1130), 26)
    rounded_paste(img, bookings, (558, 792, 1008, 1130), 26)
    floating_label(img, 104, 532, "Campaign lanes", SURFACE, GOLD)
    floating_label(img, 104, 826, "Call outcomes", SURFACE, BLUE)
    floating_label(img, 590, 826, "Booking handoff", SOFT_GREEN, GREEN)
    footer(d, 5)
    return img


def slide6():
    img = Image.new("RGBA", (W, H), INK)
    d = ImageDraw.Draw(img)
    logo(d, dark=True)
    draw_text(d, (72, 178), "What’s next:", 78, fill=SURFACE, black=True)
    draw_text(d, (72, 258), "make the rep", 78, fill=SURFACE, black=True)
    draw_text(d, (72, 338), "feel inevitable.", 78, fill=SURFACE, black=True)
    paragraph(d, 74, 474, ["More polish on the sales workflow,", "real voice testing, and tighter handoffs", "from lead → call → booked job."], 28, fill="#D8D8D4")
    shots = [
        crop_viewport(SCREENS["marketing_hero"], "page"),
        crop_viewport(SCREENS["home"], "app"),
        crop_viewport(SCREENS["crm_app"], "app"),
        crop_viewport(SCREENS["campaigns_app"], "app"),
    ]
    boxes = [(72, 710, 510, 912), (570, 710, 1008, 912), (72, 952, 510, 1154), (570, 952, 1008, 1154)]
    for shot, box in zip(shots, boxes):
        rounded_paste(img, shot, box, 22, border="#2A2A2A", bg="#111111", do_shadow=False)
    draw_text(d, (72, 1244), "Built at YALID", 18, fill="#AFAFAF", bold=True)
    draw_text(d, (940, 1244), "06/06", 18, fill="#AFAFAF", bold=True)
    return img


def main():
    slides = [slide1(), slide2(), slide3(), slide4(), slide5(), slide6()]
    rgb = []
    for i, slide in enumerate(slides, 1):
        out = OUT_DIR / f"prospkt-real-screenshot-carousel-{i:02d}.png"
        final = slide.convert("RGB")
        final.save(out, quality=96)
        rgb.append(final)
        print(out)
    pdf = OUT_DIR / "prospkt-real-screenshot-carousel.pdf"
    rgb[0].save(pdf, save_all=True, append_images=rgb[1:])
    print(pdf)


if __name__ == "__main__":
    main()
