from PIL import ImageFont
import math

FONT = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
MAG, BLUE, WHITE, DARK = "&H7E00E6&", "&HE5881E&", "&HFFFFFF&", "&H3A0024&"
_fc = {}


def tw(text, size):
    f = _fc.setdefault(size, ImageFont.truetype(FONT, size))
    return f.getlength(text)


def t(sec):
    h = int(sec // 3600); m = int(sec % 3600 // 60); s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def rr(w, h, r):
    w, h, r = int(w), int(h), int(r)
    k = int(r * 0.45)
    return (f"m {r} 0 l {w-r} 0 b {w-k} 0 {w} {k} {w} {r} l {w} {h-r} b {w} {h-k} {w-k} {h} {w-r} {h} "
            f"l {r} {h} b {k} {h} 0 {h-k} 0 {h-r} l 0 {r} b 0 {k} {k} 0 {r} 0")


def paw(s):
    """paw print drawing scaled by s (approx 100*s wide)"""
    def circ(cx, cy, r):
        k = r * 0.552
        return (f"m {cx} {cy-r} b {cx+k} {cy-r} {cx+r} {cy-k} {cx+r} {cy} b {cx+r} {cy+k} {cx+k} {cy+r} {cx} {cy+r} "
                f"b {cx-k} {cy+r} {cx-r} {cy+k} {cx-r} {cy} b {cx-r} {cy-k} {cx-k} {cy-r} {cx} {cy-r} ")
    parts = [circ(50, 70, 28), circ(18, 30, 12), circ(40, 14, 12), circ(62, 14, 12), circ(84, 30, 12)]
    return "".join(parts).replace(" ", " ") , s


ev = []


def add(start, end, text, layer=1):
    ev.append(f"Dialogue: {layer},{t(start)},{t(end)},Base,,0,0,0,,{text}")


POP = r"\fscx30\fscy30\t(0,160,\fscx112\fscy112)\t(160,260,\fscx96\fscy96)\t(260,340,\fscx100\fscy100)"


def sticker(start, end, x, y, text, size, bg, fg, rot=0, padx=34, pady=18, delay=0, slide=0, wobble=True, out=True):
    w = tw(text, size) + padx * 2
    h = size * 1.18 + pady * 2
    st = start + delay
    anim = POP
    if slide:
        mv = rf"\move({x+slide},{y},{x},{y},0,260)"
    else:
        mv = rf"\pos({x},{y})"
    wob = ""
    if wobble:
        # gentle continuous tilt for life
        dur = int((end - st) * 1000)
        seq = ""
        tt = 400; flip = 1
        while tt + 900 < dur:
            seq += rf"\t({tt},{tt+900},\frz{rot + 1.6*flip})"
            tt += 900; flip *= -1
        wob = seq
    fad = r"\fad(0,180)" if out else ""
    shadow = rf"{{\an5{mv}\frz{rot}{anim}{wob}{fad}\bord0\shad0\1c&H000000&\1a&H90&\p1}}{rr(w, h, h/2)}"
    # shadow offset
    if slide:
        smv = rf"\move({x+slide+6},{y+8},{x+6},{y+8},0,260)"
    else:
        smv = rf"\pos({x+6},{y+8})"
    add(st, end, shadow.replace(mv, smv, 1), 1)
    add(st, end, rf"{{\an5{mv}\frz{rot}{anim}{wob}{fad}\bord0\shad0\1c{bg}\p1}}{rr(w, h, h/2)}", 2)
    add(st, end, rf"{{\an5{mv}\frz{rot}{anim}{wob}{fad}\fn Inter ExtraBold\fs{size}\bord0\shad0\1c{fg}}}{text}", 3)


def label(start, end, x, y, text, size, an=7):
    add(start, end, rf"{{\an{an}\pos({x},{y})\fn Inter ExtraBold\fs{size}\1c&HFFFFFF&\bord2\3c&H000000&\shad2\4a&H80&}}{text}", 3)


D = 32.36
END = D + 5.0

# persistent top labels
label(0, D, 60, 245, "RUTA A BONY CAN", 34)
label(0, D, 1020, 245, "@bonycan_ofc", 34, an=9)

# hook
sticker(0.10, 3.60, 540, 1160, "¿Cómo llegar a", 78, WHITE, MAG, rot=-3)
sticker(0.25, 3.60, 560, 1275, "BONY CAN?", 104, MAG, WHITE, rot=2)
sticker(0.70, 3.60, 540, 1400, "Te guiamos paso a paso", 46, BLUE, WHITE, rot=-1.5, slide=-700)

# services over cat scene
sticker(3.75, 6.75, 540, 1300, "Boutique & Spa", 70, MAG, WHITE, rot=-2)
sticker(3.95, 6.75, 560, 1405, "para tu engreído", 56, WHITE, MAG, rot=2, slide=700)

# steps
steps = [
    (6.90, 8.10, "PASO 1", "Frente a Sodimac"),
    (8.15, 14.10, "PASO 2", "Por Av. América Sur"),
    (14.15, 22.80, "PASO 3", "Nuestra Señora de la Correa"),
    (26.55, 31.80, "¡LLEGASTE!", "Carlos Wiesse 670"),
]
for i, (a, b, s1, s2) in enumerate(steps):
    sticker(a, b, 540, 1275, s1, 44, MAG, WHITE, rot=-3 if i % 2 == 0 else 3)
    size = 60 if len(s2) < 22 else 50
    sticker(a + 0.12, b, 540, 1375, s2, size, WHITE, MAG, rot=1.5 if i % 2 == 0 else -1.5,
            slide=(-700 if i % 2 == 0 else 700))

sticker(24.55, 26.45, 540, 1290, "Alimento premium", 62, WHITE, MAG, rot=-2)
sticker(24.70, 26.45, 560, 1395, "+ accesorios", 56, BLUE, WHITE, rot=2, slide=700)

# ===== END CARD =====
E = D
# floating paw prints
import random
random.seed(7)
pawpath, _ = paw(1)
paws = [(140, 420, -20, 0.9), (930, 360, 25, 0.7), (110, 1080, 15, 0.8), (960, 1000, -15, 1.0),
        (870, 1420, 30, 0.6), (180, 1460, -30, 0.7), (520, 200, 10, 0.5)]
for i, (px, py, rot, sc) in enumerate(paws):
    s0 = E + 0.1 + i * 0.12
    add(s0, END, rf"{{\an5\move({px},{py+40},{px},{py-60})\frz{rot}\t(\frz{rot+25})\fscx{int(sc*100)}\fscy{int(sc*100)}\bord0\shad0\1c&HFFFFFF&\1a&HB0&\fad(400,0)\p1}}{pawpath}", 1)

label_y = 330
add(E + 0.05, END, rf"{{\an5\pos(540,{label_y})\fn Inter ExtraBold\fs46\fsp6\1c&HFFFFFF&\bord0\shad0\fad(250,0)}}¡TE ESPERAMOS!", 3)
add(E + 0.15, END, rf"{{\an5\pos(540,450)\fn Inter ExtraBold\fs160\1c&HFFFFFF&\bord0\shad4\4c&H3A0024&\4a&H40&{POP}\t(600,1400,\frz-2)\t(1400,2200,\frz2)\t(2200,3000,\frz-1)\t(3000,3800,\frz1)}}Bony Can", 3)
add(E + 0.35, END, rf"{{\an5\pos(540,570)\fn Inter ExtraBold\fs40\fsp12\1c&HFFFFFF&\bord0\shad0\fad(250,0)}}BOUTIQUE & SPA", 3)

services = [("Spa y baño", 370, 680, -700), ("Veterinaria", 720, 680, 700),
            ("Alimento premium", 350, 790, -700), ("Accesorios", 760, 790, 700)]
for i, (txt, x, y, sl) in enumerate(services):
    sticker(E + 0.55 + i * 0.15, END, x, y, txt, 40, WHITE, MAG, rot=(-2 if i % 2 == 0 else 2),
            padx=26, pady=14, slide=sl, out=False)

sticker(E + 1.30, END, 540, 920, "Carlos Wiesse 670 · Trujillo", 50, BLUE, WHITE, rot=-1.5, out=False)
sticker(E + 1.55, END, 540, 1050, "WhatsApp 968 827 219", 64, WHITE, MAG, rot=1.5, out=False)
add(E + 1.85, END, rf"{{\an5\pos(540,1175)\fn Inter ExtraBold\fs42\1c&HFFFFFF&\bord0\shad0\fad(250,0)}}Síguenos en TikTok", 3)
add(E + 1.95, END, rf"{{\an5\pos(540,1245)\fn Inter ExtraBold\fs72\1c&HFFFFFF&\bord0\shad3\4c&H3A0024&\4a&H40&{POP}}}@bonycan_ofc", 3)
add(E + 2.30, END, rf"{{\an5\pos(540,1345)\fn Inter ExtraBold\fs36\1c&HFFFFFF&\1a&H30&\bord0\shad0\fad(300,0)}}Perros y gatos felices", 3)

head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Base,Inter ExtraBold,50,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open("overlay3.ass", "w").write(head + "\n".join(ev) + "\n")
print(len(ev), "events")
