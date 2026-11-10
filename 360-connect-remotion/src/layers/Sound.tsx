import { Audio } from "@remotion/media";
import React from "react";
import { interpolate, Sequence, staticFile } from "remotion";
import { at, MARKS, seg, SEGMENTS, TOTAL_FRAMES, voiceFile } from "../edit/timeline";
import { CLAMP } from "../theme";
import { DEMO_TIMES as T } from "./DemoScene";

/**
 * SONIDO — tres pistas separadas: dialogo, musica y efectos.
 */

// ------------------------------------------------------------------ dialogo
/** Un solo corte de voz suena a la vez; cada uno entra y sale con una rampa de 2 fotogramas. */
export const Dialogue: React.FC<{ readonly gain: number }> = ({ gain }) => {
  return (
    <>
      {SEGMENTS.filter((s) => s.src).map((s) => (
        <Sequence key={s.id} name={`Voz · ${s.id}`} from={s.from} durationInFrames={s.duration} layout="none">
          <Audio
            src={voiceFile(s.src!)}
            trimBefore={s.in}
            volume={(f) =>
              gain *
              interpolate(f, [0, 1, s.duration - 2, s.duration - 1], [0.5, 1, 1, 0.45], CLAMP)
            }
          />
        </Sequence>
      ))}
    </>
  );
};

// ------------------------------------------------------------------- musica
/** La musica va siempre por debajo de la voz y sube solo en las pausas. */
const musicCurve = (frame: number): number => {
  const points: [number, number][] = [
    [0, 0.34],
    [10, 0.22],
    [MARKS.brandReveal - 8, 0.22],
    [MARKS.brandReveal, 0.3],
    [seg("como-funciona").from + 6, 0.2],
    [MARKS.demoFrom - 4, 0.2],
    [MARKS.demoFrom, 0.34],
    [seg("demo-abajo-a").from + 3, 0.2],
    [seg("demo-ranking").from - 14, 0.2],
    [seg("demo-ranking").from - 4, 0.36],
    [seg("demo-ranking").from + 6, 0.25],
    [MARKS.demoTo - 6, 0.25],
    [MARKS.demoTo + 8, 0.19],
    [MARKS.endCardFrom - 4, 0.2],
    [MARKS.endCardFrom + 3, 0.55],
    [TOTAL_FRAMES, 0.55],
  ];
  return interpolate(
    frame,
    points.map((p) => p[0]),
    points.map((p) => p[1]),
    CLAMP,
  );
};

/** Pausas sin voz dentro de la demo: la musica sube para que no se sienta vacio. */
const PAUSES = SEGMENTS.filter((s) => s.src === null && s.from > MARKS.demoFrom && s.from < MARKS.demoTo);
const pauseBoost = (frame: number): number =>
  PAUSES.reduce(
    (acc, s) =>
      Math.max(
        acc,
        interpolate(frame, [s.from, s.from + 4, s.from + s.duration - 3, s.from + s.duration], [0, 1, 1, 0], CLAMP),
      ),
    0,
  ) * 0.1;

export const Music: React.FC<{ readonly gain: number }> = ({ gain }) => {
  return (
    <Audio
      name="Musica base"
      src={staticFile("music/base.wav")}
      volume={(f) => gain * (musicCurve(f) + pauseBoost(f))}
    />
  );
};

// ------------------------------------------------------------------ efectos
type Cue = { at: number; file: string; volume: number; note: string };

const CUES: Cue[] = [
  { at: 0, file: "impact", volume: 0.3, note: "arranque" },
  { at: 2, file: "pop", volume: 0.4, note: "rotulo del gancho" },
  { at: seg("gancho-2").from - 2, file: "whoosh-short", volume: 0.22, note: "acercamiento a la pregunta" },
  { at: seg("promesa").from - 2, file: "whoosh-short", volume: 0.2, note: "corte" },
  { at: seg("marca").from - 3, file: "whoosh", volume: 0.3, note: "cambio de video" },
  { at: MARKS.brandReveal - 38, file: "riser", volume: 0.2, note: "subida hacia el logo" },
  { at: MARKS.brandReveal - 3, file: "shimmer", volume: 0.3, note: "logo 360 Connect" },
  { at: seg("como-funciona").from - 2, file: "whoosh-short", volume: 0.2, note: "corte" },
  { at: seg("como-funciona").from + 9, file: "swish", volume: 0.2, note: "el logo sube a la esquina" },
  { at: at("como-funciona", 300), file: "nfc", volume: 0.3, note: "«acerca tu celular a la placa»" },
  { at: at("como-funciona", 343), file: "scan", volume: 0.28, note: "«escanea el codigo QR»" },
  { at: MARKS.cutawayFrom - 3, file: "whoosh", volume: 0.3, note: "plano del telefono" },
  { at: MARKS.demoFrom - 4, file: "whoosh-rev", volume: 0.34, note: "entra la demo" },
  { at: MARKS.demoFrom + 9, file: "pop", volume: 0.34, note: "aterriza el telefono" },
  { at: T.menu - 1, file: "swish", volume: 0.22, note: "menu" },
  { at: T.promos - 1, file: "swish", volume: 0.22, note: "promociones" },
  { at: T.wifi - 1, file: "swish", volume: 0.22, note: "wi-fi" },
  { at: T.wifi + 4, file: "tick", volume: 0.34, note: "resalta Wi-Fi" },
  { at: T.redes, file: "tick", volume: 0.34, note: "resalta Redes" },
  { at: T.ranking - 1, file: "swish", volume: 0.22, note: "ranking" },
  { at: T.premios, file: "ding", volume: 0.2, note: "premios top 3" },
  { at: T.teaser - 1, file: "swish", volume: 0.22, note: "adelanto de juegos" },
  { at: T.reveal - 37, file: "riser", volume: 0.3, note: "subida hacia «juegos»" },
  { at: T.reveal - 9, file: "click", volume: 0.4, note: "toque en la Zona de Juegos" },
  { at: T.reveal, file: "impact", volume: 0.6, note: "entra la Zona de Juegos" },
  { at: T.reveal + 2, file: "arcade-start", volume: 0.34, note: "melodia arcade" },
  { at: T.seleccion, file: "swish", volume: 0.2, note: "elige 5 juegos" },
  { at: T.seleccion + 2, file: "blip", volume: 0.24, note: "elige 5 juegos" },
  { at: T.rankGames - 1, file: "swish", volume: 0.2, note: "ranking de juegos" },
  { at: T.rankGames + 8, file: "blip", volume: 0.26, note: "resalta" },
  { at: T.prize - 1, file: "swish", volume: 0.2, note: "premio" },
  { at: T.prize + 10, file: "ding", volume: 0.2, note: "20 % de descuento" },
  { at: T.friends - 1, file: "swish", volume: 0.2, note: "desafia a tus amigos" },
  { at: T.amigos, file: "blip", volume: 0.26, note: "2 jugadores" },
  { at: T.mesa + 4, file: "blip", volume: 0.26, note: "2 a 4 jugadores" },
  { at: T.sala - 1, file: "swish", volume: 0.2, note: "crear sala" },
  { at: T.tapSala, file: "click", volume: 0.5, note: "toque en «Crear sala»" },
  { at: T.tapSala + 2, file: "blip", volume: 0.24, note: "confirmacion" },
  { at: MARKS.demoTo - 6, file: "whoosh-rev", volume: 0.3, note: "sale la demo" },
  { at: seg("somos").from - 3, file: "whoosh-short", volume: 0.24, note: "cambio de video" },
  { at: seg("cta-1").from - 3, file: "whoosh-short", volume: 0.24, note: "cambio de video" },
  { at: MARKS.ctaQuestion, file: "pop", volume: 0.4, note: "pregunta final" },
  { at: MARKS.ctaQuestion + 5, file: "ding", volume: 0.24, note: "pregunta final" },
  { at: seg("cta-2").from, file: "pop", volume: 0.3, note: "«¡Cuentame!»" },
  { at: MARKS.endCardFrom - 4, file: "whoosh", volume: 0.3, note: "tarjeta de cierre" },
  { at: MARKS.endCardFrom + 1, file: "shimmer", volume: 0.34, note: "logo final" },
];

export const SoundEffects: React.FC<{ readonly gain: number }> = ({ gain }) => {
  return (
    <>
      {CUES.map((cue, i) => (
        <Sequence key={i} name={`FX · ${cue.note}`} from={Math.max(0, cue.at)} layout="none">
          <Audio src={staticFile(`sfx/${cue.file}.wav`)} volume={cue.volume * gain} />
        </Sequence>
      ))}
    </>
  );
};
