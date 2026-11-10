#!/usr/bin/env python3
"""Arma hojas de contacto con los fotogramas de out/frames para revisarlos de un vistazo.
Uso: python3 scripts/contact-sheet.py out/frames out/sheets [columnas] [ancho_miniatura]"""
import os, re, sys
from PIL import Image, ImageDraw
src, dst = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 400
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.endswith((".jpeg", ".jpg", ".png")))
per = cols * 2
for s in range(0, len(files), per):
    batch = files[s:s + per]
    ims = [Image.open(os.path.join(src, f)).convert("RGB") for f in batch]
    th = int(tw * ims[0].height / ims[0].width)
    rows = (len(batch) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * th), "black")
    for i, (im, f) in enumerate(zip(ims, batch)):
        t = im.resize((tw, th))
        d = ImageDraw.Draw(t)
        n = re.findall(r"\d+", f)[-1].lstrip("0") or "0"
        d.rectangle([0, 0, 74, 26], fill="black"); d.text((6, 6), n, fill="yellow")
        sheet.paste(t, ((i % cols) * tw, (i // cols) * th))
    sheet.save(os.path.join(dst, f"sheet-{s // per:02d}.jpg"), quality=88)
print("ok")
