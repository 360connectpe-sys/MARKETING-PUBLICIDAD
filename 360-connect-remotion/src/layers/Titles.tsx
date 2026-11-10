import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Icon } from "../components/Icon";
import { MARKS, seg, TOTAL_FRAMES, WIDTH } from "../edit/timeline";
import { CLAMP, COLORS, FONT, outline } from "../theme";

/**
 * ROTULOS — gancho inicial, logo de 360 Connect, pregunta final y tarjeta de cierre.
 */

const LOGO_RATIO = 2152 / 622;

// ------------------------------------------------- «Mientras llega el pedido»
export const HookTitle: React.FC = () => {
  const until = MARKS.hookQuestion - 1;
  return (
    <Sequence name="Rotulo · Mientras llega el pedido" from={0} durationInFrames={until} layout="none">
      <HookTitleInner duration={until} />
    </Sequence>
  );
};

const HookTitleInner: React.FC<{ readonly duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame + 3, fps, config: { damping: 12, stiffness: 170, mass: 0.6 } });
  const out = interpolate(frame, [duration - 7, duration], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const dots = Math.floor(frame / 9) % 4;
  return (
    <div style={{ position: "absolute", top: 146, left: 0, width: WIDTH, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          height: 96,
          padding: "0 38px 0 18px",
          borderRadius: 999,
          background: `linear-gradient(100deg, ${COLORS.navy}, ${COLORS.navy2})`,
          border: `3px solid ${COLORS.cyan}`,
          boxShadow: "0 16px 36px rgba(4,12,40,0.5), 0 0 34px rgba(34,195,255,0.5)",
          color: COLORS.white,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          scale: String(interpolate(pop, [0, 1], [0.7, 1]) * (1 - out * 0.2)),
          translate: `0px ${-out * 130}px`,
          opacity: 1 - out,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: COLORS.cyan,
            color: COLORS.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            rotate: `${frame * 6}deg`,
          }}
        >
          <Icon name="clock" size={44} strokeWidth={2.6} />
        </div>
        <span>
          Mientras llega <span style={{ color: COLORS.yellow }}>el pedido</span>
          <span style={{ display: "inline-block", width: 44, textAlign: "left" }}>{".".repeat(dots)}</span>
        </span>
      </div>
    </div>
  );
};

// ------------------------- «¿Que hacen tus clientes mientras esperan su pedido?»
export const HookQuestion: React.FC = () => {
  const from = MARKS.hookQuestion - 2;
  return (
    <Sequence name="Gancho · pregunta" from={from} durationInFrames={MARKS.hookQuestionEnd - from}>
      <HookQuestionInner part2At={MARKS.hookQuestionPart2 - from} duration={MARKS.hookQuestionEnd - from} />
    </Sequence>
  );
};

const HookQuestionInner: React.FC<{ readonly part2At: number; readonly duration: number }> = ({ part2At, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = spring({ frame, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
  const l2 = spring({ frame: frame - part2At, fps, config: { damping: 9, stiffness: 190, mass: 0.6 } });
  const out = interpolate(frame, [duration - 6, duration], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const pulse = 1 + 0.025 * Math.sin(Math.max(0, frame - part2At - 10) / 4);
  const dots = ".".repeat(Math.floor(Math.max(0, frame - part2At) / 8) % 4);
  return (
    <div
      style={{
        position: "absolute",
        top: 1236,
        left: 0,
        width: WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        fontFamily: FONT,
        fontWeight: 900,
        textTransform: "uppercase",
        lineHeight: 1.02,
        textAlign: "center",
        opacity: 1 - out,
        scale: String(1 - out * 0.15),
      }}
    >
      <div
        style={{
          fontSize: 86,
          color: COLORS.white,
          textShadow: outline(8, COLORS.navy, "0 10px 22px rgba(0,0,0,0.5)"),
          scale: String(interpolate(l1, [0, 1], [0.4, 1])),
          opacity: interpolate(frame, [0, 3], [0, 1], CLAMP),
        }}
      >
        ¿Qué hacen
        <br />
        tus clientes
      </div>
      <div
        style={{
          fontSize: 62,
          padding: "12px 30px 8px",
          borderRadius: 24,
          background: COLORS.yellow,
          color: COLORS.navy,
          border: `6px solid ${COLORS.navy}`,
          boxShadow: "0 14px 30px rgba(0,0,0,0.4)",
          scale: String(interpolate(l2, [0, 1], [0.3, 1]) * pulse),
          rotate: "-2deg",
          opacity: interpolate(frame, [part2At, part2At + 3], [0, 1], CLAMP),
        }}
      >
        mientras esperan
        <br />
        su pedido?<span style={{ display: "inline-block", width: 60, textAlign: "left" }}>{dots}</span>
      </div>
    </div>
  );
};

// ------------------------------------------- reloj sobre la cara en la pausa
/** Centro de la cara en el plano congelado (px del lienzo). */
const FACE = { x: 690, y: 880, size: 560 };
/** Fotogramas (dentro de la pausa) en que suena cada tic-tac (ver Sound.tsx). */
const TICKS = [4, 18, 32];

export const FaceClock: React.FC = () => {
  const pause = seg("respiro-pregunta");
  return (
    <Sequence name="Reloj sobre la cara" from={pause.from} durationInFrames={pause.duration}>
      <FaceClockInner duration={pause.duration} />
    </Sequence>
  );
};

const FaceClockInner: React.FC<{ readonly duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 210, mass: 0.6 } });
  const out = interpolate(frame, [duration - 5, duration], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const ticksDone = TICKS.filter((t) => frame >= t).length;
  const lastTick = [...TICKS].reverse().find((t) => frame >= t) ?? -99;
  const sinceTick = frame - lastTick;
  // Segundero: salta 30° en cada tic con un pequeno rebote.
  const jump = spring({ frame: sinceTick, fps, config: { damping: 8, stiffness: 320, mass: 0.3 } });
  const second = (ticksDone - 1 + Math.min(1, jump)) * 30 + (ticksDone === 0 ? 30 : 0);
  // Minutero que corre rapido: «el tiempo pasa».
  const minute = 300 + frame * 7;
  const hour = 240 + frame * 0.6;
  const shake = sinceTick >= 0 && sinceTick < 6 ? Math.sin(sinceTick * 2.6) * (6 - sinceTick) * 0.9 : 0;
  const s = FACE.size;
  const r = 50;
  return (
    <div
      style={{
        position: "absolute",
        left: FACE.x - s / 2,
        top: FACE.y - s / 2 - 40,
        width: s,
        height: s + 80,
        scale: String(interpolate(pop, [0, 1], [0.2, 1]) * (1 - out * 0.6)),
        opacity: 1 - out,
        rotate: `${interpolate(pop, [0, 1], [-25, 0]) + shake}deg`,
        filter: "drop-shadow(0 22px 34px rgba(4,12,40,0.55))",
      }}
    >
      <svg width={s} height={s + 80} viewBox="-60 -72 120 132">
        {/* boton y asas de cronometro */}
        <rect x={-9} y={-70} width={18} height={10} rx={3} fill={COLORS.cyan} stroke={COLORS.navy} strokeWidth={2.5} />
        <rect x={-4} y={-62} width={8} height={9} fill={COLORS.navy} />
        <rect x={34} y={-50} width={12} height={8} rx={2.5} fill={COLORS.cyan} stroke={COLORS.navy} strokeWidth={2.5} transform="rotate(45 40 -46)" />
        <rect x={-46} y={-50} width={12} height={8} rx={2.5} fill={COLORS.cyan} stroke={COLORS.navy} strokeWidth={2.5} transform="rotate(-45 -40 -46)" />
        {/* caja */}
        <circle r={r + 6} fill={COLORS.blue} stroke={COLORS.navy} strokeWidth={3} />
        <circle r={r + 2} fill={COLORS.cyan} opacity={0.55} />
        <circle r={r - 1} fill="#ffffff" stroke={COLORS.navy} strokeWidth={2} />
        {/* marcas */}
        {new Array(12).fill(0).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const big = i % 3 === 0;
          const r1 = r - (big ? 11 : 7);
          return (
            <line
              key={i}
              x1={Math.sin(a) * r1}
              y1={-Math.cos(a) * r1}
              x2={Math.sin(a) * (r - 4)}
              y2={-Math.cos(a) * (r - 4)}
              stroke={COLORS.navy}
              strokeWidth={big ? 3.2 : 1.8}
              strokeLinecap="round"
            />
          );
        })}
        {/* arco del tiempo que pasa */}
        <path
          d={describeArc(r - 17, 0, Math.min(359.9, frame * 8.6))}
          fill="none"
          stroke={COLORS.yellow}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* agujas */}
        <line x1={0} y1={0} x2={0} y2={-22} stroke={COLORS.navy} strokeWidth={4.5} strokeLinecap="round" transform={`rotate(${hour})`} />
        <line x1={0} y1={0} x2={0} y2={-33} stroke={COLORS.navy} strokeWidth={3.2} strokeLinecap="round" transform={`rotate(${minute})`} />
        <g transform={`rotate(${second})`}>
          <line x1={0} y1={8} x2={0} y2={-40} stroke="#ff3b5c" strokeWidth={1.8} strokeLinecap="round" />
          <circle cy={-40} r={2.2} fill="#ff3b5c" />
        </g>
        <circle r={4} fill={COLORS.navy} />
        <circle r={1.8} fill="#ff3b5c" />
      </svg>
    </div>
  );
};

/** Arco SVG centrado en el origen, de `start` a `end` grados (0 = arriba). */
const describeArc = (radius: number, start: number, end: number): string => {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(Math.sin(a) * radius).toFixed(2)} ${(-Math.cos(a) * radius).toFixed(2)}`;
  };
  const large = end - start > 180 ? 1 : 0;
  return `M ${p(start)} A ${radius} ${radius} 0 ${large} 1 ${p(end)}`;
};

// ----------------------------------------------------------- logo 360 Connect
const STING = { logoW: 600, padX: 44, padY: 30, top: 178 };
const BUG = { logoW: 232, padX: 22, padY: 13, top: 134, left: 44 };

/** Aparece grande al decir «360 Connect» y luego se queda como mosca arriba a la izquierda. */
export const LogoBadge: React.FC = () => {
  const from = MARKS.brandReveal - 3;
  return (
    <Sequence name="Logo 360 Connect" from={from} durationInFrames={TOTAL_FRAMES - from} layout="none">
      <LogoBadgeInner settleAt={seg("como-funciona").from - from + 10} pulseAt={seg("somos").from - from + 8} />
    </Sequence>
  );
};

const LogoBadgeInner: React.FC<{ readonly settleAt: number; readonly pulseAt: number }> = ({ settleAt, pulseAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 150, mass: 0.7 } });
  const settle = spring({ frame: frame - settleAt, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
  const mix = (a: number, b: number) => a + (b - a) * settle;
  const logoW = mix(STING.logoW, BUG.logoW);
  const padX = mix(STING.padX, BUG.padX);
  const padY = mix(STING.padY, BUG.padY);
  const width = logoW + padX * 2;
  const left = mix((WIDTH - (STING.logoW + STING.padX * 2)) / 2, BUG.left);
  const top = mix(STING.top, BUG.top);
  const pulse = interpolate(frame, [pulseAt, pulseAt + 5, pulseAt + 16], [1, 1.14, 1], CLAMP);
  const shine = interpolate(frame, [6, 26], [-0.4, 1.4], CLAMP);
  const shine2 = interpolate(frame, [pulseAt, pulseAt + 18], [-0.4, 1.4], CLAMP);
  const shinePos = frame < pulseAt ? shine : shine2;
  const ring = interpolate(frame, [0, 22], [0, 1], CLAMP);
  return (
    <>
      {/* onda al aparecer */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 380,
          top: STING.top + 110 - 380,
          width: 760,
          height: 760,
          borderRadius: "50%",
          border: `10px solid ${COLORS.cyan}`,
          opacity: (1 - ring) * 0.8,
          scale: String(0.3 + ring * 0.9),
        }}
      />
      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          padding: `${padY}px ${padX}px`,
          boxSizing: "border-box",
          borderRadius: mix(52, 30),
          background: "rgba(255,255,255,0.97)",
          boxShadow: `0 ${mix(26, 10)}px ${mix(60, 24)}px rgba(4,12,40,0.45), 0 0 ${mix(60, 0)}px rgba(34,195,255,0.6)`,
          scale: String(interpolate(pop, [0, 1], [0.2, 1]) * pulse),
          transformOrigin: settle > 0.5 ? "0% 0%" : "50% 50%",
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("brand/logo.png")} style={{ width: logoW, height: logoW / LOGO_RATIO, display: "block" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${shinePos * 100}%`,
            width: "34%",
            height: "100%",
            background: "linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))",
            translate: "-50% 0px",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </>
  );
};

// --------------------------------------------- «¿Lo probarías en tu local?»
export const CtaTitle: React.FC = () => {
  const from = MARKS.ctaQuestion;
  return (
    <Sequence name="Rotulo · ¿Lo probarías en tu local?" from={from} durationInFrames={MARKS.endCardFrom - from + 6} layout="none">
      <CtaTitleInner />
    </Sequence>
  );
};

const CtaTitleInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line1 = spring({ frame, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
  const line2 = spring({ frame: frame - 5, fps, config: { damping: 9, stiffness: 190, mass: 0.6 } });
  const wobble = Math.sin(frame / 6) * 1.2;
  return (
    <div
      style={{
        position: "absolute",
        top: 236,
        left: 0,
        width: WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        fontFamily: FONT,
        fontWeight: 900,
        textTransform: "uppercase",
        lineHeight: 1,
      }}
    >
      <div
        style={{
          fontSize: 84,
          color: COLORS.white,
          textShadow: outline(8, COLORS.navy, "0 10px 22px rgba(0,0,0,0.5)"),
          scale: String(interpolate(line1, [0, 1], [0.4, 1])),
          opacity: interpolate(frame, [0, 3], [0, 1], CLAMP),
        }}
      >
        ¿Lo probarías
      </div>
      <div
        style={{
          fontSize: 84,
          padding: "10px 34px 6px",
          borderRadius: 26,
          background: COLORS.yellow,
          color: COLORS.navy,
          border: `6px solid ${COLORS.navy}`,
          boxShadow: "0 14px 30px rgba(0,0,0,0.4)",
          scale: String(interpolate(line2, [0, 1], [0.3, 1])),
          rotate: `${-3 + wobble}deg`,
          opacity: interpolate(frame, [5, 8], [0, 1], CLAMP),
        }}
      >
        en tu local?
      </div>
    </div>
  );
};

// ------------------------------------------------------------ tarjeta final
export const EndCard: React.FC = () => {
  const from = MARKS.endCardFrom;
  return (
    <Sequence name="Tarjeta de cierre" from={from} durationInFrames={TOTAL_FRAMES - from}>
      <EndCardInner />
    </Sequence>
  );
};

const EndCardInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipe = interpolate(frame, [0, 9], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const logo = spring({ frame: frame - 3, fps, config: { damping: 11, stiffness: 150, mass: 0.7 } });
  const question = spring({ frame: frame - 8, fps, config: { damping: 13, stiffness: 170, mass: 0.6 } });
  const pill = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 170, mass: 0.6 } });
  const bounce = Math.abs(Math.sin(frame / 4.5)) * 14;
  const shine = interpolate(frame, [8, 30], [-0.3, 1.3], CLAMP);
  const logoW = 820;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${wipe * 2300}px at 540px 420px)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(110% 60% at 50% 30%, #17409a 0%, ${COLORS.navy2} 38%, ${COLORS.navy} 70%, ${COLORS.ink} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 2px, transparent 2.6px)",
          backgroundSize: "46px 46px",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (WIDTH - 900) / 2,
          top: 330,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: COLORS.blue,
          filter: "blur(150px)",
          opacity: 0.45,
        }}
      />
      {/* Logo */}
      <div
        style={{
          position: "absolute",
          left: (WIDTH - logoW) / 2,
          top: 560,
          width: logoW,
          height: logoW / LOGO_RATIO,
          scale: String(interpolate(logo, [0, 1], [0.5, 1])),
          opacity: interpolate(frame, [3, 7], [0, 1], CLAMP),
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("brand/logo-white.png")} style={{ width: "100%", height: "100%", display: "block" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${shine * 100}%`,
            width: "22%",
            height: "100%",
            background: "linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))",
            translate: "-50% 0px",
            mixBlendMode: "overlay",
            maskImage: `url(${staticFile("brand/logo-white.png")})`,
            maskSize: `${logoW}px ${logoW / LOGO_RATIO}px`,
            maskPosition: `${-shine * logoW + 0.11 * logoW}px 0px`,
            maskRepeat: "no-repeat",
          }}
        />
      </div>
      {/* Pregunta */}
      <div
        style={{
          position: "absolute",
          top: 866,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 72,
          lineHeight: 1.12,
          color: COLORS.white,
          scale: String(interpolate(question, [0, 1], [0.7, 1])),
          opacity: interpolate(frame, [8, 12], [0, 1], CLAMP),
        }}
      >
        ¿Lo probarías
        <br />
        <span style={{ color: COLORS.yellow }}>en tu local?</span>
      </div>
      {/* Llamado a comentar */}
      <div style={{ position: "absolute", top: 1100, left: 0, width: WIDTH, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "22px 40px 22px 30px",
            borderRadius: 999,
            background: `linear-gradient(100deg, ${COLORS.blue}, ${COLORS.cyan})`,
            color: COLORS.white,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 44,
            boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
            scale: String(interpolate(pill, [0, 1], [0.5, 1])),
            opacity: interpolate(frame, [12, 15], [0, 1], CLAMP),
          }}
        >
          <Icon name="chat" size={52} strokeWidth={2.4} />
          Cuéntanos en los comentarios
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1240 + bounce,
          left: WIDTH / 2 - 36,
          color: COLORS.yellow,
          opacity: interpolate(frame, [14, 18], [0, 1], CLAMP),
        }}
      >
        <Icon name="arrowDown" size={72} strokeWidth={2.8} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1380,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: 1,
          color: "rgba(255,255,255,0.78)",
          opacity: interpolate(frame, [15, 20], [0, 1], CLAMP),
        }}
      >
        Placas NFC + QR para tu negocio
      </div>
    </AbsoluteFill>
  );
};
