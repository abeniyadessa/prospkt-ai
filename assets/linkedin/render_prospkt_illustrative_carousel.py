from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


OUT_DIR = Path(__file__).parent
DESKTOP = Path("/Users/abeni/Desktop")
W, H = 1080, 1350

CANVAS = "#FAFAFA"
INK = "#0A0A0A"
SURFACE = "#FFFFFF"
ELEVATED = "#F6F6F5"
BORDER = "#E3E3E1"
HAIR = "#ECECEA"
MUTED = "#6B6B6B"
SUBTLE = "#9F9F9E"
GREEN = "#2E7D4F"
BLUE = "#315F77"
GOLD = "#B47A1F"
RED = "#C2352C"
SOFT_GREEN = "#E8F3EC"
SOFT_BLUE = "#E8ECFA"
SOFT_GOLD = "#F7ECD8"
SOFT_RED = "#FAE3E0"

FONT = "/System/Library/Fonts/SFNS.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def f(size: int, bold=False, black=False):
    return ImageFont.truetype(FONT_BLACK if black else FONT, size)


def text(d, xy, value, size, fill=INK, bold=False, black=False):
    d.text(xy, value, font=f(size, bold=bold, black=black), fill=fill)


def paragraph(d, x, y, lines, size=25, fill=MUTED, gap=10):
    for line in lines:
        text(d, (x, y), line, size, fill=fill)
        y += size + gap


def screenshots():
    paths = sorted(DESKTOP.glob("Screenshot 2026-05-11 at 2.*.png"))
    return {
        "home": paths[0],
        "campaigns": paths[1],
        "crm": paths[2],
        "pipeline": paths[3],
        "calls": paths[4],
        "bookings": paths[5],
        "settings": paths[6],
        "hero": paths[7],
        "stats": paths[8],
        "revenue": paths[9],
        "marketing_crm": paths[10],
    }


SCREENS = screenshots()


def viewport(path: Path, mode="page"):
    im = Image.open(path).convert("RGB")
    if mode == "browser":
        return im.crop((105, 74, 3145, 1888))
    if mode == "page":
        return im.crop((105, 252, 3145, 1888))
    if mode == "app":
        return im.crop((105, 252, 3145, 1888))
    if mode == "content":
        return im.crop((410, 252, 3145, 1888))
    return im


def cover(im: Image.Image, size):
    tw, th = size
    iw, ih = im.size
    scale = max(tw / iw, th / ih)
    im = im.resize((int(iw * scale), int(ih * scale)), Image.Resampling.LANCZOS)
    iw, ih = im.size
    return im.crop(((iw - tw) // 2, (ih - th) // 2, (iw + tw) // 2, (ih + th) // 2))


def contain(im: Image.Image, size):
    tw, th = size
    iw, ih = im.size
    scale = min(tw / iw, th / ih)
    return im.resize((int(iw * scale), int(ih * scale)), Image.Resampling.LANCZOS)


def shadow_layer(size, box, radius, alpha=38, blur=24, dy=18):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=(0, 0, 0, alpha))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def rounded_image(im: Image.Image, size, radius=28):
    im = cover(im, size).convert("RGBA")
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def paste_card(base: Image.Image, im: Image.Image, box, radius=30, rotate=0, border=BORDER, shadow=True):
    x0, y0, x1, y1 = box
    card = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=radius, fill=SURFACE, outline=border)
    shot = rounded_image(im, (card.width, card.height), radius=radius)
    card.alpha_composite(shot)
    d.rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=radius, outline=border, width=1)
    if rotate:
        card = card.rotate(rotate, expand=True, resample=Image.Resampling.BICUBIC)
    if shadow:
        sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle((12, 18, card.width - 12, card.height - 6), radius=radius, fill=(0, 0, 0, 38))
        sh = sh.filter(ImageFilter.GaussianBlur(22))
        base.alpha_composite(sh, (x0 - (card.width - (x1 - x0)) // 2, y0 - (card.height - (y1 - y0)) // 2))
    base.alpha_composite(card, (x0 - (card.width - (x1 - x0)) // 2, y0 - (card.height - (y1 - y0)) // 2))


def browser_mock(base: Image.Image, im: Image.Image, box, rotate=0):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=30, fill=SURFACE, outline=BORDER)
    d.rounded_rectangle((0, 0, w - 1, 56), radius=30, fill=ELEVATED)
    d.rectangle((0, 28, w, 56), fill=ELEVATED)
    for i, c in enumerate(["#E06055", "#E7B84F", "#59B472"]):
        d.ellipse((24 + i * 24, 20, 40 + i * 24, 36), fill=c)
    d.text((124, 19), "app.prospkt.ai", font=f(15), fill=SUBTLE)
    shot = cover(im, (w, h - 56)).convert("RGBA")
    mask = Image.new("L", (w, h - 56), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, w, h - 56), radius=20, fill=255)
    card.paste(shot, (0, 56), mask)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=30, outline=BORDER)
    if rotate:
        card = card.rotate(rotate, expand=True, resample=Image.Resampling.BICUBIC)
    sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle((16, 22, card.width - 16, card.height - 8), radius=30, fill=(0, 0, 0, 38))
    sh = sh.filter(ImageFilter.GaussianBlur(24))
    ox = x0 - (card.width - w) // 2
    oy = y0 - (card.height - h) // 2
    base.alpha_composite(sh, (ox, oy))
    base.alpha_composite(card, (ox, oy))


def label(base, x, y, copy, color=GREEN, fill=SURFACE):
    d = ImageDraw.Draw(base)
    face = f(21)
    bbox = d.textbbox((0, 0), copy, font=face)
    w = bbox[2] - bbox[0] + 58
    d.rounded_rectangle((x, y, x + w, y + 50), radius=25, fill=fill, outline=BORDER)
    d.ellipse((x + 18, y + 18, x + 30, y + 30), fill=color)
    d.text((x + 42, y + 13), copy, font=face, fill=INK)


def logo(d, dark=False):
    fg = SURFACE if dark else INK
    bg = SURFACE if dark else INK
    bolt = INK if dark else SURFACE
    d.rounded_rectangle((72, 64, 108, 100), radius=9, fill=bg)
    d.polygon([(90, 72), (97, 84), (92, 84), (95, 94), (83, 81), (89, 81)], fill=bolt)
    d.text((122, 69), "Prospkt", font=f(24), fill=fg)


def footer(d, n, dark=False):
    col = "#AFAFAF" if dark else SUBTLE
    d.text((72, 1244), "Built at YALID", font=f(17), fill=col)
    d.text((940, 1244), f"{n:02d}/06", font=f(17), fill=col)


def connector(d, points, color="#D8D8D4", width=3):
    for a, b in zip(points, points[1:]):
        d.line((a, b), fill=color, width=width)


def slide1():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    text(d, (72, 166), "Prospkt", 84, black=True)
    text(d, (72, 248), "is taking", 84, black=True)
    text(d, (72, 330), "shape.", 84, black=True)
    paragraph(d, 74, 452, ["A visual build log from the real", "marketing page and product app."], 28)
    hero = viewport(SCREENS["hero"], "page")
    browser_mock(img, hero, (134, 640, 996, 1114), rotate=-3)
    label(img, 128, 620, "Marketing system", GREEN, SOFT_GREEN)
    label(img, 650, 1092, "Product promise", BLUE, SURFACE)
    footer(d, 1)
    return img


def slide2():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    text(d, (72, 166), "The site", 84, black=True)
    text(d, (72, 248), "already tells", 84, black=True)
    text(d, (72, 330), "the story.", 84, black=True)
    stats = viewport(SCREENS["stats"], "page")
    revenue = viewport(SCREENS["revenue"], "page")
    crm = viewport(SCREENS["marketing_crm"], "page")
    browser_mock(img, stats, (76, 520, 1004, 746), rotate=0)
    browser_mock(img, revenue, (74, 812, 526, 1112), rotate=-2)
    browser_mock(img, crm, (552, 792, 1006, 1112), rotate=2)
    label(img, 118, 506, "Infrastructure + metrics", GREEN, SOFT_GREEN)
    label(img, 582, 774, "CRM narrative", BLUE, SURFACE)
    footer(d, 2)
    return img


def slide3():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    text(d, (72, 166), "The app", 84, black=True)
    text(d, (72, 248), "is becoming", 84, black=True)
    text(d, (72, 330), "the cockpit.", 84, black=True)
    home = viewport(SCREENS["home"], "app")
    settings = viewport(SCREENS["settings"], "app")
    browser_mock(img, home, (72, 514, 1010, 896), rotate=-2)
    browser_mock(img, settings, (154, 842, 942, 1130), rotate=2)
    label(img, 112, 496, "Run the rep", GREEN, SOFT_GREEN)
    label(img, 198, 822, "Workflow readiness", INK, SURFACE)
    footer(d, 3)
    return img


def slide4():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    text(d, (72, 166), "Leads turn", 84, black=True)
    text(d, (72, 248), "into motion.", 84, black=True)
    paragraph(d, 74, 364, ["CRM records feed the pipeline", "instead of sitting in a spreadsheet."], 27)
    crm = viewport(SCREENS["crm"], "app")
    pipeline = viewport(SCREENS["pipeline"], "app")
    browser_mock(img, crm, (72, 542, 1008, 794), rotate=1)
    browser_mock(img, pipeline, (72, 834, 1008, 1138), rotate=-1)
    label(img, 104, 522, "Find businesses", GREEN, SOFT_GREEN)
    label(img, 104, 814, "Track stages", BLUE, SOFT_BLUE)
    footer(d, 4)
    return img


def slide5():
    img = Image.new("RGBA", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    logo(d)
    text(d, (72, 166), "Playbooks", 84, black=True)
    text(d, (72, 248), "become", 84, black=True)
    text(d, (72, 330), "follow-up.", 84, black=True)
    campaigns = viewport(SCREENS["campaigns"], "app")
    calls = viewport(SCREENS["calls"], "app")
    bookings = viewport(SCREENS["bookings"], "app")
    browser_mock(img, campaigns, (72, 508, 1008, 760), rotate=-1)
    browser_mock(img, calls, (72, 824, 522, 1118), rotate=2)
    browser_mock(img, bookings, (558, 824, 1008, 1118), rotate=-2)
    label(img, 104, 490, "Campaign lanes", GOLD, SOFT_GOLD)
    label(img, 106, 804, "Call outcomes", BLUE, SURFACE)
    label(img, 590, 804, "Booking handoff", GREEN, SOFT_GREEN)
    footer(d, 5)
    return img


def slide6():
    img = Image.new("RGBA", (W, H), INK)
    d = ImageDraw.Draw(img)
    logo(d, dark=True)
    text(d, (72, 164), "Next:", 84, fill=SURFACE, black=True)
    text(d, (72, 246), "make it feel", 84, fill=SURFACE, black=True)
    text(d, (72, 328), "inevitable.", 84, fill=SURFACE, black=True)
    paragraph(d, 74, 460, ["Voice testing, tighter handoffs,", "and more polish across the", "lead → call → booked job loop."], 28, fill="#D8D8D4")
    shots = [
        viewport(SCREENS["hero"], "page"),
        viewport(SCREENS["home"], "app"),
        viewport(SCREENS["crm"], "app"),
        viewport(SCREENS["campaigns"], "app"),
    ]
    boxes = [(74, 704, 508, 912), (574, 704, 1008, 912), (74, 956, 508, 1164), (574, 956, 1008, 1164)]
    for i, (shot, box) in enumerate(zip(shots, boxes)):
        browser_mock(img, shot, box, rotate=[-2, 2, 2, -2][i])
    footer(d, 6, dark=True)
    return img


def main():
    slides = [slide1(), slide2(), slide3(), slide4(), slide5(), slide6()]
    rgb = []
    for i, slide in enumerate(slides, 1):
        out = OUT_DIR / f"prospkt-illustrative-carousel-{i:02d}.png"
        final = slide.convert("RGB")
        final.save(out, quality=96)
        rgb.append(final)
        print(out)
    pdf = OUT_DIR / "prospkt-illustrative-carousel.pdf"
    rgb[0].save(pdf, save_all=True, append_images=rgb[1:])
    print(pdf)


if __name__ == "__main__":
    main()
