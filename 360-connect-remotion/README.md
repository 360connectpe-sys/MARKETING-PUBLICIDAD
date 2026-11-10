# 360 Connect · Anuncio «Casa Nativa (demo)»

Anuncio vertical para dueños de restaurantes y cafeterías, hecho con Remotion (React + TypeScript).

- Composición: `Connect360Demo` — 1080 × 1920, 30 fps, 2698 fotogramas (≈ 90 s). La duración sale sola de `src/edit/edl.json`.
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
| Gancho | 0–454 | «¿Qué hacen tus clientes mientras esperan su pedido? Instagram, TikTok, el celular…» + rótulo «Mientras llega el pedido» |
| Marca | 454–966 | «Estamos creando 360 Connect, una nueva forma de conectar tu restaurante con tus clientes», cómo funciona la placa NFC / QR, plano del teléfono en la mesa |
| Demo | 966–1811 | Casa Nativa dentro de un teléfono, con pausas para leer cada pantalla: menú, promos, Wi-Fi, redes, ranking y **Zona de Juegos** (elige 5 juegos, ranking, jugar con la mesa, «Crear sala») |
| Propuesta | 1811–2422 | «No es solo vender placas NFC…», página propia, promociones y juegos personalizados · «Somos 360 Connect» |
| Cierre | 2422–2620 | «¿Implementarías esta idea?» + «¿Lo probarías en tu local?» + tarjeta final con logo |

## Dónde cambiar cada cosa

| Qué | Archivo |
|---|---|
| Cortes de voz y pausas (`gap`) | `src/edit/edl.json` — todo lo demás (subtítulos, demo, rótulos, música) se recoloca solo; tras cambiarlo, ejecuta `python3 scripts/make-audio.py` para rehacer la música a la nueva duración |
| Texto y tiempos de los subtítulos | `src/edit/captions.json` (fotogramas del video original; `key: true` = palabra resaltada) |
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
