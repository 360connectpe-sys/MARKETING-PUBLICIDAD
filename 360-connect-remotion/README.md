# 360 Connect · Anuncio «Casa Nativa (demo)»

Anuncio vertical para dueños de restaurantes y cafeterías, hecho con Remotion (React + TypeScript).

- Composición: `Connect360Demo` — 1080 × 1920, 30 fps, 1920 fotogramas (64 s).
- Salida: `out/360_Connect_Casa_Nativa_Demo.mp4`.

## Abrir y editar

```bash
cd 360-connect-remotion
npm install
npx remotion studio src/index.ts
```

En Studio, el panel de props permite apagar subtítulos, música o efectos y cambiar volúmenes.

## Exportar

```bash
npx remotion render src/index.ts Connect360Demo out/360_Connect_Casa_Nativa_Demo.mp4 --codec=h264 --audio-codec=aac --sample-rate=48000
```

## Estructura del montaje

| Tramo | Fotogramas | Contenido |
|---|---|---|
| Gancho | 0–313 | «¿Qué hacen tus clientes mientras esperan su pedido?» + rótulo «Mientras llega el pedido» |
| Marca | 313–697 | «Estamos creando 360 Connect», cómo funciona la placa NFC / QR, plano del teléfono en la mesa |
| Demo | 697–1323 | Casa Nativa dentro de un teléfono: menú, promos, Wi-Fi, redes, ranking y **Zona de Juegos** (ranking, premios, jugar con la mesa, «Crear sala») |
| Propuesta | 1323–1744 | Página propia, promociones y juegos personalizados · «Somos 360 Connect» |
| Cierre | 1744–1920 | «¿Implementarías esta idea?» + «¿Lo probarías en tu local?» + tarjeta final con logo |

## Dónde cambiar cada cosa

| Qué | Archivo |
|---|---|
| Cortes de voz (video de origen y rango de fotogramas) | `src/edit/edl.json` — todo lo demás se recoloca solo |
| Texto y tiempos de los subtítulos | `src/edit/captions.json` (`*` palabras clave = `key: true`) |
| Planos a cámara, zoom, espejo, plano de apoyo | `src/layers/CameraTrack.tsx` |
| Pantallas de la demo, rótulos, resaltados, stickers | `src/layers/DemoScene.tsx` (`SHOTS`, `STICKERS`) |
| Rótulos, logo, pregunta final, tarjeta de cierre | `src/layers/Titles.tsx` |
| Voz, música y efectos (volúmenes y momentos) | `src/layers/Sound.tsx` (`CUES`, `musicCurve`) |
| Colores y tipografías | `src/theme.ts` |

## Recursos

- `public/media/*.mp4` — copias de trabajo de los videos originales (HDR → SDR, 1080 × 1920, 30 fps). No se suben a Git por su tamaño; los originales se conservan aparte.
- `public/media/voice/*.wav` — voz limpia (FFmpeg: pasa-altos, reducción leve de ruido, ecualización, de-esser, compresión suave) generada con `scripts/build-voice.py`.
- `public/sfx/`, `public/music/base.wav` — efectos y base musical sintetizados con `scripts/make-audio.py` (sin derechos de terceros).
- `public/brand/` — logo limpio (`scripts/clean-logo.py`): versión clara, versión para fondo oscuro e isotipo.
- `public/fonts/` — Poppins y Press Start 2P (licencia SIL OFL).

### Regenerar las copias de trabajo

Los videos de `public/media/*.mp4` salen de los originales con este filtro de FFmpeg (iPhone HLG → SDR):

```bash
ffmpeg -i IMG_0319.MOV -map 0:v:0 -map 0:a:0 \
  -vf "fps=30,scale=1080:1920:flags=lanczos,zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=260,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,hqdn3d=2:2:6:6,unsharp=5:5:0.45:5:5:0.0" \
  -c:v libx264 -preset slow -crf 22 -g 30 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 public/media/IMG_0319.mp4
```

La grabación de pantalla solo se pasa a 30 fps (`-vf "fps=30,format=yuv420p" -crf 20`).
