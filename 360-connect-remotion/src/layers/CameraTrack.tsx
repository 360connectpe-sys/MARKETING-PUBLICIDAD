import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Freeze, interpolate, Sequence, useCurrentFrame } from "remotion";
import { CAMERA_SOURCES, MARKS, SEGMENTS, type Segment, videoFile } from "../edit/timeline";
import { CLAMP } from "../theme";

/**
 * PISTA DE IMAGEN — planos a camara.
 *
 * Cada corte de voz grabado a camara se muestra con su propio plano. Los saltos
 * dentro del mismo video se disimulan alternando el tamano del encuadre (corte
 * directo); el cambio de un video a otro lleva una transicion de zoom con
 * desenfoque.
 */

/** Encuadre de cada plano: escala al inicio y al final (empuje lento). */
const LOOKS: Record<string, readonly [number, number]> = {
  "gancho-1": [1.0, 1.02],
  "gancho-2": [1.12, 1.15],
  "gancho-3": [1.0, 1.03],
  promesa: [1.1, 1.15],
  marca: [1.0, 1.03],
  "como-funciona": [1.07, 1.03],
  idea: [1.0, 1.04],
  "lo-mejor": [1.1, 1.14],
  somos: [1.06, 1.1],
  "cta-1": [1.0, 1.04],
  "cta-2": [1.12, 1.15],
};

const GRADE = "contrast(1.06) saturate(1.12) brightness(1.02)";
const ENTER_FRAMES = 8;
const EXIT_FRAMES = 5;

const isCamera = (s: Segment | undefined) => Boolean(s?.src && CAMERA_SOURCES.includes(s.src));

const Shot: React.FC<{
  readonly segment: Segment;
  readonly duration: number;
  readonly enter: boolean;
  readonly exit: boolean;
  readonly mirror: boolean;
}> = ({ segment, duration, enter, exit, mirror }) => {
  const frame = useCurrentFrame();
  const [z0, z1] = LOOKS[segment.id] ?? [1, 1.03];
  const base = interpolate(frame, [0, segment.duration], [z0, z1], CLAMP);
  const enterP = enter
    ? interpolate(frame, [0, ENTER_FRAMES], [1, 0], { ...CLAMP, easing: Easing.out(Easing.cubic) })
    : 0;
  const exitP = exit
    ? interpolate(frame, [duration - EXIT_FRAMES, duration], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) })
    : 0;
  const blur = 18 * enterP + 12 * exitP;

  return (
    <AbsoluteFill
      style={{
        transformOrigin: "50% 30%",
        scale: String(base * (1 + 0.16 * enterP + 0.1 * exitP)),
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px) ${GRADE}` : GRADE,
      }}
    >
      <Video
        src={videoFile(segment.src!)}
        trimBefore={segment.in}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%", scale: mirror ? "-1 1" : undefined }}
      />
    </AbsoluteFill>
  );
};

export const CameraTrack: React.FC<{ readonly mirror: boolean }> = ({ mirror }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {SEGMENTS.map((segment, i) => {
        if (!isCamera(segment)) {
          // Pausas dramaticas: imagen congelada del plano vecino («entrada» usa el
          // primer fotograma del siguiente; «respiro-*» el ultimo del anterior).
          const isIntro = segment.id === "entrada";
          const ref = isIntro ? SEGMENTS[i + 1] : SEGMENTS[i - 1];
          if (!(isIntro || segment.id.startsWith("respiro")) || !isCamera(ref)) {
            return null;
          }
          return (
            <Sequence key={segment.id} name={`Pausa · ${segment.id}`} from={segment.from} durationInFrames={segment.duration}>
              <Freeze frame={isIntro ? 0 : ref.duration - 1}>
                <Shot segment={ref} duration={ref.duration} enter={false} exit={false} mirror={mirror} />
              </Freeze>
            </Sequence>
          );
        }
        const prev = SEGMENTS[i - 1];
        const next = SEGMENTS[i + 1];
        const enter = i > 0 && prev?.src !== segment.src && prev?.src !== null;
        const exit = isCamera(next) && next?.src !== segment.src;
        // El ultimo plano sigue unos fotogramas bajo la tarjeta de cierre.
        const tail = next && next.src === null && next.id === "cierre" ? 12 : 0;
        return (
          <Sequence
            key={segment.id}
            name={`Camara · ${segment.id}`}
            from={segment.from}
            durationInFrames={segment.duration + tail}
          >
            <Shot segment={segment} duration={segment.duration} enter={enter} exit={exit} mirror={mirror} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * PLANO DE APOYO — el telefono sobre la mesa abriendo la pagina del local.
 * Cubre la imagen mientras la voz de camara sigue debajo.
 */
export const Cutaway: React.FC = () => {
  const duration = MARKS.demoFrom - MARKS.cutawayFrom;
  const sourceOut = 341; // ultimo fotograma util de IMG_0340 (el dedo toca «Zona de Juegos»)
  return (
    <Sequence name="Apoyo · telefono en la mesa" from={MARKS.cutawayFrom} durationInFrames={duration}>
      <CutawayShot duration={duration} trimBefore={sourceOut - duration} />
    </Sequence>
  );
};

const CutawayShot: React.FC<{ readonly duration: number; readonly trimBefore: number }> = ({ duration, trimBefore }) => {
  const frame = useCurrentFrame();
  const enterP = interpolate(frame, [0, ENTER_FRAMES], [1, 0], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const exitP = interpolate(frame, [duration - 6, duration], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const base = interpolate(frame, [0, duration], [1.02, 1.12], CLAMP);
  const blur = 18 * enterP + 16 * exitP;
  const grade = "contrast(1.08) saturate(1.15) brightness(1.12)";
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        transformOrigin: "50% 48%",
        scale: String(base * (1 + 0.16 * enterP + 0.25 * exitP)),
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px) ${grade}` : grade,
      }}
    >
      <Video
        src={videoFile("IMG_0340")}
        trimBefore={trimBefore}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};

/** Destello breve en cada cambio de video. */
export const CutFlashes: React.FC = () => {
  const cuts = SEGMENTS.filter((s, i) => {
    const prev = SEGMENTS[i - 1];
    return i > 0 && isCamera(s) && prev?.src !== s.src;
  }).map((s) => s.from);
  cuts.push(MARKS.cutawayFrom);
  return (
    <>
      {cuts.map((from) => (
        <Sequence key={from} name="Destello de corte" from={from} durationInFrames={8} layout="none">
          <Flash />
        </Sequence>
      ))}
    </>
  );
};

const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.9), rgba(140,200,255,0.5) 60%, rgba(34,195,255,0.2))",
        mixBlendMode: "screen",
        opacity: interpolate(frame, [0, 7], [0.42, 0], CLAMP),
      }}
    />
  );
};
