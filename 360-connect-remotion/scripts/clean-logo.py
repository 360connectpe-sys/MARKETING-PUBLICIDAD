"""Limpia el logo de 360 Connect (PNG con halo en los bordes) y genera:
  public/brand/logo.png        -> fondo transparente, para fondos claros
  public/brand/logo-white.png  -> «CONNECT» en blanco, para fondos oscuros
  public/brand/logo-icon.png   -> solo el isotipo (anillo + placa QR)
Uso: python3 scripts/clean-logo.py <logo-original.png>
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src = Image.open(sys.argv[1]).convert("RGBA")
out_dir = sys.argv[2] if len(sys.argv) > 2 else "public/brand"

# 1) Componer sobre blanco: asi el logo se ve limpio (el halo es blanco semitransparente).
white = Image.new("RGBA", src.size, (255, 255, 255, 255))
white.alpha_composite(src)
rgb = np.asarray(white.convert("RGB")).astype(np.float64) / 255.0
H, W = rgb.shape[:2]

# 2) «Color a alfa» contra blanco: recupera bordes suaves sin halo.
alpha = 1.0 - rgb.min(axis=2)
safe = np.maximum(alpha, 1e-6)[..., None]
color = np.clip((rgb - (1.0 - alpha[..., None])) / safe, 0, 1)

# 3) Las zonas blancas encerradas dentro del isotipo (la placa con el QR) deben seguir siendo blancas.
near_white = rgb.min(axis=2) > 0.92
labels, n = ndimage.label(near_white)
border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
icon_right = int(W * 0.285)
keep = np.zeros((H, W), bool)
for i, sl in enumerate(ndimage.find_objects(labels), start=1):
    if i in border or sl is None:
        continue
    if sl[1].stop <= icon_right:  # solo dentro del isotipo, no los huecos de las letras
        keep[sl] |= labels[sl] == i
keep = ndimage.binary_dilation(keep, iterations=2) & (rgb.min(axis=2) > 0.55) & (np.arange(W)[None, :] < icon_right)
# suavizar la mezcla en el borde de la placa
k = ndimage.gaussian_filter(keep.astype(np.float64), 0.8)
alpha2 = np.maximum(alpha, k)
color2 = color * (1 - k[..., None]) + 1.0 * k[..., None] * 0  # placeholder
# color final: donde es placa blanca, el color visible es el del compuesto original
color2 = np.where(k[..., None] > 0, (color * alpha[..., None] + (1 - alpha[..., None])) , color)
color2 = np.where(k[..., None] > 0, color2 * 1.0, color)
alpha2 = np.where(k > 0, np.maximum(alpha, k) , alpha)
# en la placa: pixel = mezcla de tinta (color, alpha) sobre blanco, opaco en proporcion k
vis = color * alpha[..., None] + (1 - alpha[..., None])  # como se ve sobre blanco
a_final = alpha + (1 - alpha) * k
c_final = np.where(a_final[..., None] > 1e-6,
                   (color * alpha[..., None] + (1 - alpha[..., None]) * k[..., None]) / np.maximum(a_final[..., None], 1e-6),
                   color)

def save(c, a, name, box=None):
    arr = np.dstack([np.clip(c, 0, 1), np.clip(a, 0, 1)[..., None]])
    im = Image.fromarray((arr * 255 + 0.5).astype(np.uint8), "RGBA")
    bbox = box or im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    pad = 24
    bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, W), min(bbox[3] + pad, H))
    im = im.crop(bbox)
    im.save(f"{out_dir}/{name}")
    print(name, im.size)

save(c_final, a_final, "logo.png")

# 4) Version para fondo oscuro: la tinta azul marino del texto «CONNECT» pasa a blanco.
lum = c_final.max(axis=2)
sat = c_final.max(axis=2) - c_final.min(axis=2)
navy = (lum < 0.45) & (sat < 0.40)  # azul marino #021d3e aprox.
text_zone = np.zeros((H, W), bool)
text_zone[:, icon_right:] = True
c_white = c_final.copy()
c_white[navy & text_zone] = 1.0
save(c_white, a_final, "logo-white.png")

# 5) Isotipo solo
a_icon = a_final.copy(); a_icon[:, icon_right:] = 0
save(c_final, a_icon, "logo-icon.png")
