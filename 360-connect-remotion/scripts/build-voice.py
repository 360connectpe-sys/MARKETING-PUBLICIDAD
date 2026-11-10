#!/usr/bin/env python3
"""Limpia y nivela la voz de cada video original con FFmpeg.

Para cada fuente usada en src/edit/edl.json:
  1. Extrae el audio a mono 48 kHz.
  2. Mide el espectro medio de los tramos usados y calcula una ecualizacion suave
     hacia una curva de voz comun (para que el micro de solapa y el del telefono
     suenen parecidos).
  3. Aplica: pasa-altos, reduccion leve de ruido, ecualizacion, de-esser,
     compresion suave y limitador.
  4. Ajusta la ganancia para que los tramos usados queden al mismo volumen (LUFS).

Salida: public/media/voice/<fuente>.wav  (misma duracion que el video original,
asi los fotogramas del EDL sirven tal cual).

Uso: python3 scripts/build-voice.py <carpeta_con_los_originales>
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDL = json.load(open(os.path.join(ROOT, "src/edit/edl.json")))
FPS = EDL["fps"]
SR = 48000
OUT_DIR = os.path.join(ROOT, "public/media/voice")
TARGET_LUFS = -17.0  # la mezcla final (voz + musica + efectos) se ajusta a -16 LUFS
BANDS = [125, 250, 500, 1000, 2000, 4000, 8000]
# Curva objetivo por octavas, relativa a la media de las bandas 500/1k/2k (dB)
TARGET = {125: 1.8, 250: 4.8, 500: 4.8, 1000: -0.2, 2000: -4.7, 4000: -7.5, 8000: -11.5}


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def find_original(folder, name):
    for ext in (".MOV", ".mov", ".mp4", ".MP4"):
        p = os.path.join(folder, name + ext)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(name)


def read_wav(path):
    w = wave.open(path)
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0


def used_audio(x, ranges):
    spf = SR // FPS
    return np.concatenate([x[a * spf : b * spf] for a, b in ranges])


def band_levels(x):
    n = 4096
    segs = [x[i : i + n] * np.hanning(n) for i in range(0, len(x) - n, n // 2)]
    ps = np.mean([np.abs(np.fft.rfft(s)) ** 2 for s in segs], axis=0)
    fr = np.fft.rfftfreq(n, 1 / SR)
    lv = {}
    for b in BANDS:
        m = (fr >= b / 2**0.5) & (fr < b * 2**0.5)
        lv[b] = 10 * np.log10(ps[m].sum() + 1e-20)
    ref = np.mean([lv[500], lv[1000], lv[2000]])
    return {b: lv[b] - ref for b in BANDS}


def lufs(path):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    return i, tp


def write_used(src_wav, ranges, dst):
    parts = ";".join(
        f"[0:a]atrim=start={a / FPS}:end={b / FPS},asetpts=PTS-STARTPTS[p{i}]" for i, (a, b) in enumerate(ranges)
    )
    labels = "".join(f"[p{i}]" for i in range(len(ranges)))
    run(["ffmpeg", "-v", "error", "-y", "-i", src_wav, "-filter_complex",
         f"{parts};{labels}concat=n={len(ranges)}:v=0:a=1[o]", "-map", "[o]", dst])


def main():
    originals = sys.argv[1]
    os.makedirs(OUT_DIR, exist_ok=True)
    used = {}
    for v in EDL["voice"]:
        if "src" in v:
            used.setdefault(v["src"], []).append((v["in"], v["out"]))

    report = {}
    with tempfile.TemporaryDirectory() as tmp:
        for key, ranges in used.items():
            name = EDL["sources"][key]
            phone_mic = key == "RP"  # grabacion de pantalla: micro del telefono
            raw = os.path.join(tmp, f"{key}_raw.wav")
            run(["ffmpeg", "-v", "error", "-y", "-i", find_original(originals, name), "-vn", "-ac", "1",
                 "-ar", str(SR), "-c:a", "pcm_s16le", raw])
            x = used_audio(read_wav(raw), ranges)
            meas = band_levels(x)
            strength, lo, hi = (0.9, -7.0, 4.0) if phone_mic else (0.5, -4.0, 5.0)
            gains = {b: float(np.clip((TARGET[b] - meas[b]) * strength, lo, hi)) for b in BANDS}

            pre_gain = -22.0 - 20 * np.log10(np.sqrt((x**2).mean()) + 1e-9)
            eq = [f"equalizer=f={b}:t=o:w=1:g={gains[b]:.2f}" for b in BANDS[:-1] if abs(gains[b]) >= 0.3]
            eq.append(f"highshelf=f=6500:t=s:w=0.7:g={gains[8000]:.2f}")
            chain = [
                f"highpass=f={100 if phone_mic else 80}:p=2",
                f"afftdn=nr={10 if phone_mic else 4}:nf={-52 if phone_mic else -60}",
                f"volume={pre_gain:.2f}dB",
                *eq,
                "deesser=i=0.35:m=0.5:f=0.5:s=o",
                "acompressor=threshold=-24dB:ratio=3:attack=10:release=150:knee=6:makeup=2",
                "alimiter=limit=-3dB:attack=3:release=60:level=false",
            ]
            stage = os.path.join(tmp, f"{key}_stage.wav")
            run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", ",".join(chain), "-ar", str(SR),
                 "-c:a", "pcm_s16le", stage])

            probe = os.path.join(tmp, f"{key}_used.wav")
            write_used(stage, ranges, probe)
            i_lufs, _ = lufs(probe)
            trim = TARGET_LUFS - i_lufs
            out = os.path.join(OUT_DIR, f"{name}.wav")
            run(["ffmpeg", "-v", "error", "-y", "-i", stage, "-af",
                 f"volume={trim:.2f}dB,alimiter=limit=-3dB:attack=2:release=50:level=false",
                 "-ar", str(SR), "-c:a", "pcm_s16le", out])
            write_used(out, ranges, probe)
            f_lufs, f_tp = lufs(probe)
            post = band_levels(used_audio(read_wav(out), ranges))
            report[key] = {
                "eq_db": {str(b): round(g, 1) for b, g in gains.items()},
                "lufs_tramos_usados": f_lufs,
                "pico_real_dbtp": f_tp,
                "espectro_antes": {str(b): round(v, 1) for b, v in meas.items()},
                "espectro_despues": {str(b): round(v, 1) for b, v in post.items()},
            }
            print(f"{key:9s} EQ {report[key]['eq_db']}  ->  {f_lufs:.1f} LUFS, pico {f_tp:.1f} dBTP")
    json.dump(report, open(os.path.join(OUT_DIR, "informe-voz.json"), "w"), indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
