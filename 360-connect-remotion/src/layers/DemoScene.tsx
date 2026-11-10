import { Video } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  interpolate,
  random,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Icon, type IconName } from "../components/Icon";
import { at, HEIGHT, MARKS, seg, videoFile, WIDTH } from "../edit/timeline";
import { CLAMP, COLORS, FONT, PIXEL_FONT } from "../theme";

/**
 * DEMO «CASA NATIVA» — la grabacion de pantalla dentro de un telefono, sobre un
 * marco azul oscuro. Las barras del navegador quedan fuera del recorte.
 *
 * Cada plano (`Shot`) dice que parte de la grabacion se ve, con que recorte y
 * zoom, que rotulo lleva y que zonas de la interfaz se resaltan.
 */

// ---- Geometria del telefono (px del lienzo 1080 x 1920) ----
const PHONE = { x: 160, y: 300, w: 760, bezel: 14, radius: 68 };
const SCREEN_W = PHONE.w - PHONE.bezel * 2;
/** Grabacion de pantalla original: 1170 x 2532. */
const SRC = { w: 1170, h: 2532 };
/** Alto de la ventana visible de la pagina (sin barras del navegador). */
const WINDOW_H = 1995;
const S0 = SCREEN_W / SRC.w;
const SCREEN_H = Math.round(WINDOW_H * S0);
/** Borde superior de la pagina segun el estado de la barra del navegador. */
const BAR_OPEN = 305;
const BAR_CLOSED = 238;

type Highlight = {
  /** Rectangulo en px de la grabacion original: [x, y, ancho, alto]. */
  rect: readonly [number, number, number, number];
  /** Fotogramas del montaje. */
  from: number;
  to: number;
  color?: string;
  radius?: number;
};

type Label = { text: string; icon: IconName; arcade?: boolean };

type Shot = {
  id: string;
  from: number;
  to: number;
  /** Primer fotograma de la grabacion. Con `freeze` se muestra fijo. */
  source: number;
  freeze?: boolean;
  cropTop: number;
  zoom: readonly [number, number];
  /** Punto hacia el que se hace zoom, en px de la pantalla del telefono. */
  focus: readonly [number, number];
  label: Label;
  /** Cambio de rotulo dentro del plano. */
  labelSwap?: { at: number; label: Label };
  highlights?: Highlight[];
  tap?: { at: number; point: readonly [number, number] };
};

const B = "demo-abajo-b";
const D0 = MARKS.demoFrom;
const D1 = MARKS.demoTo;

const T = {
  menu: at(B, 266),
  promos: at(B, 298),
  wifi: at(B, 334),
  redes: at(B, 374),
  ranking: at(B, 404),
  premios: at(B, 436),
  teaser: seg("demo-juegos").from,
  reveal: MARKS.gamesReveal,
  rankGames: seg("demo-ranking").from,
  prize: at("demo-ranking", 1441),
  friends: seg("demo-sala").from,
  amigos: at("demo-sala", 2378),
  mesa: at("demo-sala", 2412),
  sala: at("demo-sala", 2431),
  tapSala: at("demo-sala", 2466),
};

export const DEMO_TIMES = T;

export const SHOTS: Shot[] = [
  {
    id: "inicio",
    from: D0,
    to: T.menu,
    source: 177,
    cropTop: BAR_OPEN,
    zoom: [1.0, 1.05],
    focus: [366, 560],
    label: { text: "La página de tu local", icon: "home" },
  },
  {
    id: "menu",
    from: T.menu,
    to: T.promos,
    source: 553,
    cropTop: BAR_CLOSED,
    zoom: [1.02, 1.08],
    focus: [366, 420],
    label: { text: "Menú digital", icon: "menu" },
  },
  {
    id: "promos",
    from: T.promos,
    to: T.wifi,
    source: 838,
    cropTop: BAR_OPEN,
    zoom: [1.02, 1.08],
    focus: [366, 420],
    label: { text: "Promociones", icon: "tag" },
  },
  {
    id: "wifi-redes",
    from: T.wifi,
    to: T.ranking,
    source: 300,
    freeze: true,
    cropTop: BAR_CLOSED,
    zoom: [1.05, 1.24],
    focus: [366, 520],
    label: { text: "Wi-Fi", icon: "wifi" },
    labelSwap: { at: T.redes, label: { text: "Redes sociales", icon: "share" } },
    highlights: [
      { rect: [788, 688, 332, 350], from: T.wifi + 3, to: T.redes },
      { rect: [45, 1075, 335, 350], from: T.redes, to: T.ranking },
    ],
  },
  {
    id: "ranking",
    from: T.ranking,
    to: T.teaser,
    source: 735,
    cropTop: BAR_OPEN,
    zoom: [1.0, 1.12],
    focus: [366, 360],
    label: { text: "Ranking semanal", icon: "trophy" },
    labelSwap: { at: T.premios, label: { text: "Premios para el top 3", icon: "gift" } },
    highlights: [{ rect: [48, 590, 1074, 660], from: T.premios, to: T.teaser, color: COLORS.yellow, radius: 40 }],
  },
  {
    id: "adelanto-juegos",
    from: T.teaser,
    to: T.reveal,
    source: 300,
    freeze: true,
    cropTop: BAR_CLOSED,
    zoom: [1.04, 1.4],
    focus: [366, 150],
    label: { text: "Lo más interesante…", icon: "gamepad" },
    highlights: [{ rect: [45, 312, 1075, 313], from: T.teaser + 6, to: T.reveal, color: COLORS.orange, radius: 60 }],
    tap: { at: T.reveal - 9, point: [560, 468] },
  },
  {
    id: "zona-de-juegos",
    from: T.reveal,
    to: T.rankGames,
    source: 1120,
    cropTop: BAR_OPEN,
    zoom: [1.16, 1.0],
    focus: [366, 420],
    label: { text: "Zona de juegos", icon: "gamepad", arcade: true },
  },
  {
    id: "ranking-juegos",
    from: T.rankGames,
    to: T.prize,
    source: 1410,
    cropTop: BAR_OPEN,
    zoom: [1.0, 1.1],
    focus: [366, 640],
    label: { text: "Suma puntos", icon: "trophy", arcade: true },
    highlights: [{ rect: [36, 742, 800, 140], from: T.rankGames + 8, to: T.prize, color: COLORS.orange, radius: 30 }],
  },
  {
    id: "premio",
    from: T.prize,
    to: T.friends,
    source: 1612,
    freeze: true,
    cropTop: BAR_OPEN,
    zoom: [1.1, 1.4],
    focus: [366, 388],
    label: { text: "Premios semanales", icon: "gift", arcade: true },
    highlights: [{ rect: [48, 775, 1074, 295], from: T.prize + 4, to: T.friends, color: COLORS.yellow, radius: 44 }],
  },
  {
    id: "amigos",
    from: T.friends,
    to: T.sala,
    source: 2314,
    cropTop: 480,
    zoom: [1.0, 1.16],
    focus: [366, 800],
    label: { text: "Juega con tu mesa", icon: "users", arcade: true },
    highlights: [
      { rect: [36, 1262, 800, 140], from: T.friends + 10, to: T.amigos, color: COLORS.orange, radius: 30 },
      { rect: [326, 1672, 300, 70], from: T.amigos, to: T.sala, color: COLORS.cyan, radius: 20 },
      { rect: [326, 2042, 350, 70], from: T.mesa, to: T.sala, color: COLORS.cyan, radius: 20 },
    ],
  },
  {
    id: "crear-sala",
    from: T.sala,
    to: D1,
    source: 2492,
    freeze: true,
    cropTop: BAR_CLOSED,
    zoom: [1.0, 1.24],
    focus: [366, 500],
    label: { text: "Crea tu sala", icon: "plus", arcade: true },
    highlights: [{ rect: [48, 958, 1074, 142], from: T.sala + 6, to: D1, color: COLORS.yellow, radius: 16 }],
    tap: { at: T.tapSala, point: [1010, 1030] },
  },
];

const SHOT_OVERLAP = 7;

// ------------------------------------------------------------------ fondo
const Background: React.FC<{ readonly arcade: number }> = ({ arcade }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 60;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 70% at 50% 8%, ${COLORS.navy2} 0%, ${COLORS.navy} 48%, ${COLORS.ink} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 70% at 50% 8%, #3a1a6b 0%, ${COLORS.arcade} 50%, #0c0618 100%)`,
          opacity: arcade,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -180 + drift,
          top: 260,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: arcade > 0.5 ? COLORS.pink : COLORS.blue,
          opacity: 0.32,
          filter: "blur(120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -200 - drift,
          top: 900,
          width: 660,
          height: 660,
          borderRadius: "50%",
          background: arcade > 0.5 ? COLORS.orange : COLORS.cyan,
          opacity: 0.24,
          filter: "blur(130px)",
        }}
      />
      {/* trama de puntos */}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 2px, transparent 2.6px)",
          backgroundSize: "46px 46px",
          backgroundPosition: `0px ${(frame * 0.6) % 46}px`,
          opacity: 0.5 * (1 - arcade),
        }}
      />
      {/* rejilla retro en la zona de juegos */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,166,43,0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(255,77,141,0.16) 2px, transparent 2px)",
          backgroundSize: "72px 72px",
          backgroundPosition: `0px ${(frame * 1.6) % 72}px`,
          opacity: 0.75 * arcade,
        }}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------- contenido de pantalla
const toScreen = (rect: readonly [number, number, number, number], cropTop: number) => ({
  left: rect[0] * S0,
  top: (rect[1] - cropTop) * S0,
  width: rect[2] * S0,
  height: rect[3] * S0,
});

const HighlightRing: React.FC<{ readonly h: Highlight; readonly cropTop: number; readonly shotFrom: number }> = ({
  h,
  cropTop,
  shotFrom,
}) => {
  const frame = useCurrentFrame() + shotFrom;
  if (frame < h.from || frame >= h.to) {
    return null;
  }
  const local = frame - h.from;
  const box = toScreen(h.rect, cropTop);
  const color = h.color ?? COLORS.cyan;
  const appear = interpolate(local, [0, 5], [0, 1], { ...CLAMP, easing: Easing.out(Easing.back(2)) });
  const pulse = 0.5 + 0.5 * Math.sin(local / 3.2);
  const sonar = (local % 26) / 26;
  const radius = (h.radius ?? 36) * S0 + 6;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: box.left - 8,
          top: box.top - 8,
          width: box.width + 16,
          height: box.height + 16,
          borderRadius: radius,
          border: `5px solid ${color}`,
          boxShadow: `0 0 ${18 + 22 * pulse}px ${color}, inset 0 0 ${10 + 14 * pulse}px ${color}66`,
          opacity: appear,
          scale: String(1.08 - 0.08 * appear),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: box.left - 8,
          top: box.top - 8,
          width: box.width + 16,
          height: box.height + 16,
          borderRadius: radius,
          border: `3px solid ${color}`,
          opacity: (1 - sonar) * 0.7 * appear,
          scale: String(1 + sonar * 0.12),
        }}
      />
    </>
  );
};

const TapRipple: React.FC<{
  readonly tap: NonNullable<Shot["tap"]>;
  readonly cropTop: number;
  readonly shotFrom: number;
}> = ({ tap, cropTop, shotFrom }) => {
  const local = useCurrentFrame() + shotFrom - tap.at;
  if (local < -6 || local > 16) {
    return null;
  }
  const x = tap.point[0] * S0;
  const y = (tap.point[1] - cropTop) * S0;
  const press = interpolate(local, [-6, 0, 4], [0, 1, 0.75], CLAMP);
  const ring = interpolate(local, [0, 14], [0, 1], CLAMP);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 70,
          top: y - 70,
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "6px solid white",
          opacity: local >= 0 ? 1 - ring : 0,
          scale: String(0.4 + ring * 1.3),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 34,
          top: y - 34,
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
          border: `5px solid ${COLORS.navy}`,
          opacity: press,
          scale: String(1.5 - 0.5 * press),
        }}
      />
    </>
  );
};

const ShotView: React.FC<{ readonly shot: Shot; readonly first: boolean }> = ({ shot, first }) => {
  const frame = useCurrentFrame();
  const duration = shot.to - shot.from;
  const enter = first ? 1 : interpolate(frame, [0, SHOT_OVERLAP], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(frame, [0, duration], [shot.zoom[0], shot.zoom[1]], {
    ...CLAMP,
    easing: Easing.out(Easing.quad),
  });
  const video = (
    <Video
      src={videoFile("RP")}
      trimBefore={shot.source}
      muted
      style={{ position: "absolute", left: 0, top: -shot.cropTop * S0, width: SCREEN_W, height: SRC.h * S0 }}
    />
  );
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(enter, [0, 0.5], [0, 1], CLAMP),
        translate: `0px ${(1 - enter) * 90}px`,
        backgroundColor: "#0b0b12",
      }}
    >
      <AbsoluteFill style={{ transformOrigin: `${shot.focus[0]}px ${shot.focus[1]}px`, scale: String(zoom) }}>
        {shot.freeze ? <Freeze frame={0}>{video}</Freeze> : video}
        {shot.highlights?.map((h, i) => (
          <HighlightRing key={i} h={h} cropTop={shot.cropTop} shotFrom={shot.from} />
        ))}
        {shot.tap ? <TapRipple tap={shot.tap} cropTop={shot.cropTop} shotFrom={shot.from} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ rotulos
const ChapterLabel: React.FC<{ readonly label: Label }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const arcade = Boolean(label.arcade);
  return (
    <div
      style={{
        position: "absolute",
        top: 222,
        left: 0,
        width: WIDTH,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: arcade ? "20px 30px 18px 22px" : "14px 34px 14px 16px",
          borderRadius: arcade ? 18 : 999,
          background: arcade
            ? "linear-gradient(180deg, #2c1250, #1a0b33)"
            : `linear-gradient(100deg, ${COLORS.blue}, #0d5be6 55%, ${COLORS.cyan})`,
          border: arcade ? `4px solid ${COLORS.orange}` : "3px solid rgba(255,255,255,0.55)",
          boxShadow: arcade
            ? `0 0 34px ${COLORS.orange}aa, 0 14px 30px rgba(0,0,0,0.5)`
            : "0 14px 34px rgba(4,12,40,0.55), 0 0 30px rgba(34,195,255,0.45)",
          color: arcade ? COLORS.orange : COLORS.white,
          fontFamily: arcade ? PIXEL_FONT : FONT,
          fontWeight: arcade ? 400 : 800,
          fontSize: arcade ? 30 : 42,
          letterSpacing: arcade ? 1 : 0.5,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          scale: String(interpolate(pop, [0, 1], [0.55, 1])),
          rotate: `${interpolate(pop, [0, 1], [-5, 0])}deg`,
          opacity: interpolate(frame, [0, 3], [0, 1], CLAMP),
        }}
      >
        <div
          style={{
            width: arcade ? 52 : 58,
            height: arcade ? 52 : 58,
            borderRadius: arcade ? 12 : "50%",
            background: arcade ? COLORS.orange : COLORS.white,
            color: arcade ? "#1a0b33" : COLORS.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={label.icon} size={arcade ? 36 : 38} strokeWidth={2.4} />
        </div>
        <span style={{ textShadow: arcade ? `0 0 16px ${COLORS.orange}` : "0 2px 0 rgba(0,0,0,0.18)" }}>
          {label.text}
        </span>
      </div>
    </div>
  );
};

const DemoTag: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [6, 16], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const blink = 0.55 + 0.45 * Math.sin(frame / 5);
  return (
    <div
      style={{
        position: "absolute",
        top: 140,
        right: 44,
        height: 76,
        padding: "0 26px 0 22px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderRadius: 999,
        border: "2.5px solid rgba(255,255,255,0.5)",
        background: "rgba(6,16,41,0.6)",
        color: COLORS.white,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 33,
        letterSpacing: 0.4,
        opacity: appear,
        translate: `${(1 - appear) * 40}px 0px`,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: COLORS.cyan,
          boxShadow: `0 0 ${10 + 12 * blink}px ${COLORS.cyan}`,
        }}
      />
      Casa Nativa · Demo
    </div>
  );
};

type Sticker = { text: string; from: number; to: number; x: number; y: number; rotate: number; arcade?: boolean };

const STICKERS: Sticker[] = [
  { text: "7 juegos arcade", from: T.reveal + 8, to: T.rankGames + 10, x: 40, y: 1120, rotate: -5, arcade: true },
  { text: "1.er lugar: 20% dto.", from: T.prize + 10, to: T.friends, x: 40, y: 1010, rotate: -4 },
  { text: "De 2 a 4 jugadores", from: T.mesa + 4, to: T.sala, x: 40, y: 1150, rotate: -4, arcade: true },
];

const StickerView: React.FC<{ readonly sticker: Sticker }> = ({ sticker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sticker.to - sticker.from;
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 200, mass: 0.55 } });
  const out = interpolate(frame, [duration - 5, duration], [1, 0], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: sticker.x,
        top: sticker.y,
        padding: sticker.arcade ? "20px 22px 16px" : "14px 26px",
        borderRadius: sticker.arcade ? 14 : 22,
        background: sticker.arcade ? COLORS.orange : COLORS.yellow,
        color: sticker.arcade ? "#1a0b33" : COLORS.navy,
        fontFamily: sticker.arcade ? PIXEL_FONT : FONT,
        fontSize: sticker.arcade ? 24 : 40,
        fontWeight: sticker.arcade ? 400 : 800,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        border: `4px solid ${sticker.arcade ? "#1a0b33" : COLORS.navy}`,
        boxShadow: "0 12px 26px rgba(0,0,0,0.5)",
        rotate: `${sticker.rotate + (1 - pop) * -14}deg`,
        scale: String(pop * out),
        opacity: out,
        transformOrigin: "20% 60%",
      }}
    >
      {sticker.text}
    </div>
  );
};

// Confeti de pixeles al entrar a la Zona de Juegos
const PixelBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const colors = [COLORS.orange, COLORS.pink, COLORS.cyan, COLORS.yellow, "#7dff8a"];
  return (
    <AbsoluteFill>
      {new Array(36).fill(0).map((_, i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const speed = 16 + random(`s${i}`) * 34;
        const size = 14 + Math.round(random(`z${i}`) * 3) * 6;
        const t = frame;
        const x = WIDTH / 2 + Math.cos(angle) * speed * t * (1 - t / 90);
        const y = 760 + Math.sin(angle) * speed * t * (1 - t / 90) + 0.9 * t * t;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              background: colors[i % colors.length],
              opacity: interpolate(t, [0, 3, 22, 32], [0, 1, 1, 0], CLAMP),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------- escena
export const DemoScene: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = D1 - D0;
  const frame = local + D0;

  const arcade = interpolate(frame, [T.reveal, T.reveal + 6], [0, 1], CLAMP);
  const rise = spring({ frame: local, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  const leave = interpolate(local, [duration - 9, duration], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const bump = interpolate(frame, [T.reveal, T.reveal + 3, T.reveal + 12], [1, 1.045, 1], CLAMP);
  const flash = interpolate(frame, [T.reveal, T.reveal + 2, T.reveal + 10], [0, 0.55, 0], CLAMP);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Background arcade={arcade} />

      {/* Telefono */}
      <div
        style={{
          position: "absolute",
          left: PHONE.x,
          top: PHONE.y,
          width: PHONE.w,
          height: SCREEN_H + PHONE.bezel * 2,
          borderRadius: PHONE.radius,
          background: "linear-gradient(160deg, #1c2a52, #070d1f 40%, #0d1836)",
          boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 0 3px ${arcade > 0.5 ? "#5b2f8f" : "#2c4585"}, 0 0 70px ${
            arcade > 0.5 ? "rgba(255,166,43,0.35)" : "rgba(34,195,255,0.3)"
          }`,
          translate: `0px ${(1 - rise) * 900 + leave * 1100}px`,
          rotate: `${(1 - rise) * 7 - leave * 5}deg`,
          scale: String(bump * (1 - leave * 0.08)),
          transformOrigin: "50% 40%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: PHONE.bezel,
            top: PHONE.bezel,
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: PHONE.radius - PHONE.bezel,
            overflow: "hidden",
            backgroundColor: "#0b0b12",
          }}
        >
          {SHOTS.map((shot, i) => (
            <Sequence
              key={shot.id}
              name={`Demo · ${shot.id}`}
              from={shot.from - D0}
              durationInFrames={shot.to - shot.from + (i < SHOTS.length - 1 ? SHOT_OVERLAP : 0)}
            >
              <ShotView shot={shot} first={i === 0} />
            </Sequence>
          ))}
          {/* brillo del cristal */}
          <AbsoluteFill
            style={{
              background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 28%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* El telefono se funde con el fondo por abajo: ahi van los subtitulos */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 1290,
          width: WIDTH,
          height: HEIGHT - 1290,
          background: `linear-gradient(180deg, rgba(6,16,41,0) 0%, ${
            arcade > 0.5 ? "#0c0618" : COLORS.ink
          } 24%, ${arcade > 0.5 ? "#0c0618" : COLORS.ink} 100%)`,
        }}
      />

      <Sequence name="Confeti de pixeles" from={T.reveal - D0} durationInFrames={34} layout="none">
        <PixelBurst />
      </Sequence>

      <DemoTag />

      {SHOTS.map((shot) => {
        const swapAt = shot.labelSwap?.at ?? shot.to;
        return (
          <React.Fragment key={shot.id}>
            <Sequence
              name={`Rotulo · ${shot.label.text}`}
              from={shot.from - D0 + (shot.id === "inicio" ? 8 : 0)}
              durationInFrames={swapAt - shot.from - (shot.id === "inicio" ? 8 : 0)}
              layout="none"
            >
              <ChapterLabel label={shot.label} />
            </Sequence>
            {shot.labelSwap ? (
              <Sequence
                name={`Rotulo · ${shot.labelSwap.label.text}`}
                from={shot.labelSwap.at - D0}
                durationInFrames={shot.to - shot.labelSwap.at}
                layout="none"
              >
                <ChapterLabel label={shot.labelSwap.label} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}

      {STICKERS.map((sticker) => (
        <Sequence
          key={sticker.text}
          name={`Sticker · ${sticker.text}`}
          from={sticker.from - D0}
          durationInFrames={sticker.to - sticker.from}
          layout="none"
        >
          <StickerView sticker={sticker} />
        </Sequence>
      ))}

      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
