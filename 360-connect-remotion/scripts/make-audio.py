#!/usr/bin/env python3
"""Genera los efectos de sonido y la base musical del anuncio (100 % sintetizados,
sin muestras de terceros, asi que no hay derechos de autor que gestionar).

Salida:
  public/sfx/*.wav        efectos (whoosh, pop, tick, NFC, impacto, arcade...)
  public/music/base.wav   base instrumental de 64 s a 112,5 BPM (1 pulso = 16 fotogramas)

Uso: python3 scripts/make-audio.py
"""
import os
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(360)


# ----------------------------------------------------------------- utilidades
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def save(path, x, peak_db=-3.0):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    m = np.abs(x).max()
    if m > 0:
        x = x / m * 10 ** (peak_db / 20)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    w = wave.open(path, "wb")
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    w.close()


def fade(x, a=0.004, r=0.01):
    n = len(x)
    e = np.ones(n)
    na, nr = max(int(a * SR), 1), max(int(r * SR), 1)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e if x.ndim == 1 else x * e[:, None]


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x, axis=0)


def sweep_noise(dur, f_points, bw=1.2):
    """Ruido filtrado con una frecuencia central que se mueve (por bloques con solapamiento)."""
    n = int(dur * SR)
    noise = rng.standard_normal(n + SR)
    out = np.zeros(n)
    block, hop = 2048, 512
    win = np.hanning(block)
    pos = np.linspace(0, 1, len(f_points))
    for start in range(0, n - block, hop):
        u = (start + block / 2) / n
        fc = np.exp(np.interp(u, pos, np.log(f_points)))
        lo, hi = fc / 2 ** (bw / 2), min(fc * 2 ** (bw / 2), SR / 2 - 200)
        seg = bp(noise[start : start + block + 512], lo, hi)[256 : 256 + block]
        out[start : start + block] += seg * win
    return out / (np.abs(out).max() + 1e-9)


def pan(x, p):
    """p en [-1, 1] (escalar o vector)."""
    p = np.clip(p, -1, 1)
    ang = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(ang), x * np.sin(ang)], axis=1)


def square(freq, dur, duty=0.5):
    t = t_axis(dur)
    ph = np.cumsum(np.broadcast_to(freq, t.shape)) / SR
    return np.where((ph % 1.0) < duty, 1.0, -1.0)


def saw(freq, n, detune=0.0):
    ph = np.cumsum(np.broadcast_to(freq * (1 + detune), (n,))) / SR
    return 2 * (ph % 1.0) - 1


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


# ------------------------------------------------------------------- efectos
def sfx_whoosh(dur=0.5, f=(300, 3600, 900), pan_from=-0.7, pan_to=0.7):
    x = sweep_noise(dur, f)
    u = np.linspace(0, 1, len(x))
    env = np.sin(np.pi * u**0.8) ** 2
    return fade(pan(x * env, np.linspace(pan_from, pan_to, len(x))), 0.01, 0.05)


def sfx_pop():
    t = t_axis(0.16)
    f = 260 + 300 * np.exp(-t / 0.018)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.002) * 0.25
    return fade(x + click, 0.001, 0.02)


def sfx_tick():
    t = t_axis(0.07)
    x = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.009)
    x += hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.0015) * 0.3
    return fade(x, 0.0005, 0.01)


def beep(freq, dur, harm=0.18):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) + harm * np.sin(2 * np.pi * 2 * freq * t)
    return fade(x * np.exp(-t / (dur * 0.9)), 0.004, 0.03)


def sfx_nfc():
    gap = np.zeros(int(0.035 * SR))
    return np.concatenate([beep(1318.5, 0.10), gap, beep(1975.5, 0.26)])


def sfx_scan():
    t = t_axis(0.26)
    f = 900 * (2400 / 900) ** (t / t[-1])
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) ** 0.7
    x[: len(sfx_tick())] += sfx_tick() * 0.6
    return fade(x, 0.003, 0.03)


def sfx_riser(dur=1.25):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    noise = sweep_noise(dur, (350, 900, 6500), bw=1.0)
    f = 180 * (900 / 180) ** (u**1.3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    env = u**2.2
    x = (noise + tone) * env
    return fade(pan(x, 0.25 * np.sin(2 * np.pi * 3 * u)), 0.02, 0.012)


def sfx_impact():
    t = t_axis(1.0)
    f = 38 + 60 * np.exp(-t / 0.05)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    thump = lp(rng.standard_normal(len(t)), 240) * np.exp(-t / 0.06) * 0.6
    air_l = bp(rng.standard_normal(len(t)), 900, 7000) * np.exp(-t / 0.16) * 0.22
    air_r = bp(rng.standard_normal(len(t)), 900, 7000) * np.exp(-t / 0.16) * 0.22
    x = np.stack([sub + thump + air_l, sub + thump + air_r], axis=1)
    return fade(np.tanh(x * 1.6), 0.001, 0.2)


def chip_note(note, dur, duty=0.25, vib=0.0):
    t = t_axis(dur)
    f = midi(note) * (1 + vib * np.sin(2 * np.pi * 7 * t))
    x = square(f, dur, duty) * np.exp(-t / (dur * 1.6))
    return fade(lp(x, 6500), 0.002, 0.012)


def sfx_arcade_start():
    """Arpegio ascendente estilo 8 bits (generico, no imita ningun juego concreto)."""
    notes = [67, 72, 76, 79, 84, 88]
    parts = [chip_note(n, 0.062) for n in notes] + [chip_note(91, 0.34, vib=0.012)]
    return np.concatenate(parts)


def sfx_blip():
    return np.concatenate([chip_note(81, 0.045), chip_note(88, 0.075)])


def sfx_click():
    t = t_axis(0.09)
    x = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.0025) * 0.8
    x += np.sin(2 * np.pi * 170 * t) * np.exp(-t / 0.02)
    return fade(x, 0.0005, 0.02)


def bell(freq, dur, bright=1.0):
    t = t_axis(dur)
    partials = [(1.0, 1.0, 0.55), (2.0, 0.45, 0.32), (3.01, 0.22, 0.2), (4.18, 0.12 * bright, 0.12), (5.43, 0.07 * bright, 0.08)]
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (d * dur * 1.4)) for r, a, d in partials)
    return fade(x, 0.002, 0.1)


def sfx_ding():
    x = bell(1046.5, 1.3)
    y = bell(1568.0, 1.3) * 0.5
    y = np.concatenate([np.zeros(int(0.07 * SR)), y])[: len(x)]
    return x + y


def sfx_shimmer(dur=1.7):
    n = int(dur * SR)
    out = np.zeros((n, 2))
    scale = [84, 86, 88, 91, 93, 96, 98, 100, 103]
    for k in range(34):
        start = (k / 34) ** 0.85 * (dur - 0.5)
        note = scale[int(rng.integers(0, len(scale)))] + (12 if rng.random() < 0.25 else 0)
        g = bell(midi(note), 0.5, bright=0.4) * (0.25 + 0.5 * k / 34)
        i = int(start * SR)
        g2 = pan(g, rng.uniform(-0.8, 0.8))
        out[i : i + len(g2)] += g2[: n - i]
    chord_start = int((dur - 0.95) * SR)
    for note, a in [(72, 0.7), (76, 0.5), (79, 0.5), (86, 0.35)]:
        g = bell(midi(note), 0.95, bright=0.5) * a
        out[chord_start : chord_start + len(g)] += pan(g, 0)[: n - chord_start]
    air = sweep_noise(dur, (5000, 9000, 7000), bw=0.8) * np.linspace(0, 1, n) ** 1.5 * 0.08
    out += pan(air, 0)
    return fade(out, 0.01, 0.25)


def sfx_swish():
    x = sweep_noise(0.24, (1500, 6000, 3000), bw=1.0)
    u = np.linspace(0, 1, len(x))
    return fade(pan(x * np.sin(np.pi * u) ** 1.5, np.linspace(0.5, -0.5, len(x))), 0.005, 0.03)


# -------------------------------------------------------------------- musica
FPS = 30
BEAT = 16 / FPS          # 112,5 BPM
BAR = 4 * BEAT


def _timeline():
    """Lee src/edit/edl.json y devuelve el inicio de cada corte (fotogramas del montaje)."""
    import json
    edl = json.load(open(os.path.join(ROOT, "src/edit/edl.json")))
    pos, starts = 0, {}
    for item in edl["voice"]:
        starts[item["id"]] = (pos, item.get("in", 0))
        pos += item.get("gap") or item["out"] - item["in"]
    return starts, pos


_STARTS, _TOTAL_FRAMES = _timeline()
_from = lambda seg_id: _STARTS[seg_id][0]
_at = lambda seg_id, src_frame: _STARTS[seg_id][0] + src_frame - _STARTS[seg_id][1]

TOTAL = _TOTAL_FRAMES / FPS
# Secciones en fotogramas del montaje (se recalculan solas si cambian los cortes)
F_PROMESA = _from("promesa")
F_GROOVE = _from("marca")          # «...estamos creando 360 Connect»
F_DEMO = _from("pausa-demo")
_REVEAL = _at("demo-juegos", 1078)  # palabra «juegos»
F_BUILD = _REVEAL - 40
F_BREAK = _REVEAL - 6              # silencio + impacto + melodia arcade
F_ARCADE = _REVEAL + 16
F_OUT = _from("idea")
F_CTA = _from("cta-1")
F_END = _from("cierre")
OFFSET = (F_GROOVE % 64) / FPS     # un tiempo fuerte cae justo en «360 Connect»

CHORDS = [  # IV - V - vi - I en do mayor: (bajo, notas del acorde)
    (41, [65, 69, 72, 76]),   # Fmaj7
    (43, [67, 71, 74, 79]),   # G
    (45, [69, 72, 76, 79]),   # Am7
    (48, [67, 72, 76, 79]),   # C
]


def add(buf, x, at, gain=1.0, p=0.0):
    i = int(round(at * SR))
    if i >= len(buf) or i < 0:
        return
    x = x if x.ndim == 2 else pan(x, p)
    m = min(len(x), len(buf) - i)
    buf[i : i + m] += x[:m] * gain


def kick():
    t = t_axis(0.22)
    f = 46 + 95 * np.exp(-t / 0.028)
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.002) * 0.12, 0.0005, 0.03)


def clap():
    t = t_axis(0.16)
    x = bp(rng.standard_normal(len(t)), 900, 4200)
    env = np.exp(-t / 0.045)
    for d in (0.0, 0.011, 0.023):
        env += np.where(t >= d, np.exp(-(t - d) / 0.006), 0) * 0.6
    return fade(x * env, 0.0005, 0.03)


def hat(open_=False):
    t = t_axis(0.16 if open_ else 0.05)
    return fade(hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (0.05 if open_ else 0.012)), 0.0005, 0.01)


def pluck(note, dur=0.28, cutoff=2600):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(note)
    x = saw(f, n, 0.004) + saw(f, n, -0.004)
    x = lp(x, cutoff) * np.exp(-t / 0.085)
    return fade(x, 0.002, 0.03)


def bass_note(note, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * lp(saw(f, n), 420)
    return fade(x * np.exp(-t / (dur * 1.3)), 0.004, 0.03)


def pad_chord(notes, dur):
    n = int(dur * SR)
    x = np.zeros(n)
    for note in notes:
        f = midi(note - 12)
        x += saw(f, n, 0.006) + saw(f, n, -0.006) + saw(f * 2, n, 0.003) * 0.4
    x = lp(x, 850, order=2)
    u = np.linspace(0, 1, n)
    env = np.minimum(u / 0.18, 1) * np.minimum((1 - u) / 0.12, 1)
    return x * env


def woodblock(freq):
    t = t_axis(0.09)
    return fade(np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.014) + 0.3 * np.sin(2 * np.pi * freq * 2.4 * t) * np.exp(-t / 0.006), 0.0005, 0.02)


def music():
    n = int(TOTAL * SR)
    drums = np.zeros((n, 2))
    tonal = np.zeros((n, 2))
    duck = np.ones(n)
    k, c, h, ho = kick(), clap(), hat(), hat(True)
    sec = lambda frame: frame / FPS

    def section(tm):
        f = tm * FPS
        if f < F_GROOVE:
            return "intro"
        if f < F_DEMO:
            return "groove"
        if f < F_BUILD:
            return "demo"
        if f < F_BREAK:
            return "build"
        if f < F_ARCADE:
            return "break"
        if f < F_OUT:
            return "arcade"
        if f < F_CTA:
            return "groove2"
        if f < F_END:
            return "cta"
        return "end"

    # Reloj «tic-tac» del gancho (mientras llega el pedido...)
    tick, tock = woodblock(1750), woodblock(1250)
    b = 0
    tm = OFFSET - 3 * BEAT
    while tm < sec(F_GROOVE) - BEAT * 0.5:
        if tm >= 0:
            lvl = 0.5 if tm < sec(120) else 0.5 * max(0.0, 1 - (tm - sec(120)) / (sec(F_PROMESA) - sec(120)))
            add(tonal, tick if b % 2 == 0 else tock, tm, lvl, -0.3 if b % 2 == 0 else 0.3)
        tm += BEAT
        b += 1

    n_bars = int((TOTAL - OFFSET) / BAR) + 2
    for bar in range(-1, n_bars):
        t0 = OFFSET + bar * BAR
        root, notes = CHORDS[bar % 4]
        for beat in range(4):
            tb = t0 + beat * BEAT
            if tb < 0 or tb >= TOTAL:
                continue
            s = section(tb + 0.001)
            if s in ("break", "end"):
                continue
            # ---- bateria
            if s in ("groove", "arcade", "groove2") or (s == "demo" and beat in (0, 2)) or (s == "intro" and tb >= sec(F_PROMESA + 72) and beat == 0):
                add(drums, k, tb, 0.9 if s != "intro" else 0.55)
                i = int(tb * SR)
                d = np.minimum(1.0, 0.35 + np.arange(int(0.26 * SR)) / (0.26 * SR) * 0.65)
                duck[i : i + len(d)] = np.minimum(duck[i : i + len(d)], d[: max(0, n - i)])
            if s in ("groove", "arcade", "groove2") and beat in (1, 3):
                add(drums, c, tb, 0.34 if s != "arcade" else 0.42)
            if s in ("groove", "demo", "arcade", "groove2", "cta"):
                add(drums, h, tb + BEAT / 2, 0.22, 0.25)
                if s == "arcade":
                    add(drums, h, tb + BEAT / 4, 0.1, -0.3)
                    add(drums, h, tb + 3 * BEAT / 4, 0.1, 0.3)
                if beat == 3 and s != "cta":
                    add(drums, ho, tb + BEAT / 2, 0.14, 0.25)
            if s == "build":
                for q in range(4):  # redoble creciente
                    u = (tb + q * BEAT / 4 - sec(F_BUILD)) / (sec(F_BREAK) - sec(F_BUILD))
                    add(drums, c, tb + q * BEAT / 4, 0.1 + 0.3 * u)
            # ---- bajo
            if s in ("groove", "demo", "arcade", "groove2") or (s == "intro" and tb >= sec(F_PROMESA + 72)):
                add(tonal, bass_note(root, BEAT * 0.45), tb + BEAT / 2, 0.5)
                if s in ("arcade", "groove"):
                    add(tonal, bass_note(root + 12, BEAT * 0.22), tb + 3 * BEAT / 4, 0.26)
                if beat == 0:
                    add(tonal, bass_note(root, BEAT * 0.4), tb, 0.42)
            # ---- arpegio de plucks (corcheas)
            if s != "build" or True:
                for e in range(2):
                    te = tb + e * BEAT / 2
                    idx = (beat * 2 + e) % 8
                    pat = [0, 2, 1, 3, 2, 1, 3, 2]
                    note = notes[pat[idx]] + (12 if idx in (3, 6) else 0)
                    lvl = {"intro": 0.16 if te >= sec(F_PROMESA) else 0.0, "groove": 0.3, "demo": 0.27, "build": 0.2,
                           "arcade": 0.2, "groove2": 0.27, "cta": 0.3}.get(section(te + 0.001), 0)
                    if lvl:
                        add(tonal, pluck(note), te, lvl, 0.5 if idx % 2 else -0.5)
            # ---- arpegio chiptune en la zona de juegos (semicorcheas)
            if s == "arcade":
                for q in range(4):
                    seq = [0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 3, 2, 1, 0]
                    note = notes[seq[(beat * 4 + q) % 16]] + 12
                    add(tonal, chip_note(note, BEAT / 4 * 0.9, duty=0.25), tb + q * BEAT / 4, 0.11, 0.35 if q % 2 else -0.35)
        # ---- colchon (pad) por compas
        if t0 + BAR > 0 and t0 < TOTAL:
            s = section(max(t0, 0) + 0.001)
            lvl = {"intro": 0.16, "groove": 0.14, "demo": 0.15, "build": 0.16, "break": 0.0, "arcade": 0.12,
                   "groove2": 0.14, "cta": 0.2, "end": 0.0}[s]
            if lvl:
                add(tonal, pad_chord(notes, BAR * 1.02), max(t0, 0), lvl)

    # Acorde final + cola (tarjeta de cierre)
    te = sec(F_END)
    for note, a in [(48, 0.5), (60, 0.5), (67, 0.45), (72, 0.5), (76, 0.45), (86, 0.3)]:
        add(tonal, pluck(note, 1.25, cutoff=3200) * np.exp(-t_axis(1.25) / 0.6), te, a * 0.8)
    add(tonal, pad_chord([60, 64, 67, 74], max(1.3, TOTAL - te)), te, 0.3)  # el acorde cubre toda la tarjeta final
    add(drums, k, te, 0.9)

    tonal *= duck[:, None]            # efecto de bombeo suave con el bombo
    mix = drums * 0.8 + tonal
    # hueco para la voz: atenuar la zona 1,5-4 kHz
    sos = signal.iirpeak(2400, 0.8, fs=SR)
    presence = signal.lfilter(sos[0], sos[1], mix, axis=0)
    mix = mix - 0.42 * presence
    mix = hp(mix, 38)
    mix = np.tanh(mix * 1.15)
    fo = int(0.25 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
    return mix


def main():
    sfx = os.path.join(ROOT, "public/sfx")
    save(f"{sfx}/whoosh.wav", sfx_whoosh())
    save(f"{sfx}/whoosh-rev.wav", sfx_whoosh(0.42, (2600, 3200, 500), 0.7, -0.7))
    save(f"{sfx}/whoosh-short.wav", sfx_whoosh(0.3, (500, 4200, 1500), -0.4, 0.4))
    save(f"{sfx}/swish.wav", sfx_swish())
    save(f"{sfx}/pop.wav", sfx_pop())
    save(f"{sfx}/tick.wav", sfx_tick())
    save(f"{sfx}/nfc.wav", sfx_nfc())
    save(f"{sfx}/scan.wav", sfx_scan())
    save(f"{sfx}/riser.wav", sfx_riser())
    save(f"{sfx}/impact.wav", sfx_impact())
    save(f"{sfx}/arcade-start.wav", sfx_arcade_start())
    save(f"{sfx}/blip.wav", sfx_blip())
    save(f"{sfx}/click.wav", sfx_click())
    save(f"{sfx}/ding.wav", sfx_ding())
    save(f"{sfx}/shimmer.wav", sfx_shimmer())
    save(os.path.join(ROOT, "public/music/base.wav"), music(), peak_db=-4.0)
    print("ok")


if __name__ == "__main__":
    main()
