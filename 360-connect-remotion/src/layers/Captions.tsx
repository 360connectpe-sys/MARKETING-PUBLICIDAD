import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import data from "../edit/captions.json";
import { at, atSource, MARKS, type SourceKey, WIDTH } from "../edit/timeline";
import { CLAMP, COLORS, FONT, outline } from "../theme";

/**
 * SUBTITULOS — palabra por palabra, una o dos lineas.
 *
 * El texto y los tiempos estan en `src/edit/captions.json` (fotogramas del video
 * original). Aqui se convierten a fotogramas del montaje, se agrupan en paginas
 * y se resalta la palabra que se esta diciendo.
 */

type RawToken = { src: SourceKey; text: string; in: number; out: number; key?: boolean; pageEnd?: boolean };
type Word = { text: string; start: number; end: number; key: boolean };
type Page = { words: Word[]; start: number; end: number };

/** Paginas que suben de sitio para no tapar la placa que se muestra a camara. */
const RAISED_PAGES: readonly [string, number][] = [];

const buildPages = (): Page[] => {
  const pages: Page[] = [];
  let current: Word[] = [];
  for (const token of data.tokens as RawToken[]) {
    const start = atSource(token.src, token.in);
    current.push({
      text: token.text,
      start,
      end: Math.max(start + 2, atSource(token.src, token.out)),
      key: Boolean(token.key),
    });
    if (token.pageEnd) {
      pages.push({ words: current, start: current[0].start - 1, end: current[current.length - 1].end });
      current = [];
    }
  }
  pages.sort((a, b) => a.start - b.start);
  return pages.map((page, i) => {
    const next = pages[i + 1];
    const lastEnd = page.end;
    const end = next && next.start - lastEnd < 14 ? next.start : lastEnd + 9;
    return { ...page, end };
  });
};

type Variant = { top: number; fontSize: number; maxWidth: number };

const variantFor = (frame: number): Variant => {
  if (frame >= MARKS.demoFrom && frame < MARKS.demoTo) {
    return { top: 1392, fontSize: 60, maxWidth: 940 };
  }
  return { top: 1404, fontSize: 72, maxWidth: 900 };
};

const WordView: React.FC<{
  readonly word: Word;
  readonly active: boolean;
  readonly spoken: boolean;
  readonly sinceActive: number;
  readonly fontSize: number;
}> = ({ word, active, spoken, sinceActive, fontSize }) => {
  const { fps } = useVideoConfig();
  const pop = active ? spring({ frame: sinceActive, fps, config: { damping: 10, stiffness: 260, mass: 0.4 } }) : 1;
  const pillColor = word.key ? COLORS.yellow : COLORS.blue;
  const stroke = Math.round(fontSize * 0.085);
  return (
    <span
      style={{
        display: "inline-block",
        padding: `${Math.round(fontSize * 0.02)}px ${Math.round(fontSize * 0.17)}px`,
        margin: `${Math.round(fontSize * 0.04)}px ${Math.round(fontSize * 0.01)}px`,
        borderRadius: Math.round(fontSize * 0.24),
        background: active ? pillColor : "transparent",
        boxShadow: active ? `0 8px 22px rgba(0,0,0,0.38), 0 0 0 4px ${COLORS.navy}` : "none",
        color: active ? (word.key ? COLORS.navy : COLORS.white) : spoken && word.key ? COLORS.yellow : COLORS.white,
        textShadow: active
          ? word.key
            ? "none"
            : "0 2px 0 rgba(0,0,0,0.25)"
          : outline(stroke, COLORS.navy, `0 ${stroke}px ${stroke * 2}px rgba(0,0,0,0.5)`),
        opacity: active || spoken ? 1 : 0.82,
        scale: String(active ? interpolate(pop, [0, 1], [0.86, 1.07]) : 1),
        rotate: active ? `${word.key ? -2.5 : -1.2}deg` : "0deg",
        position: "relative",
        zIndex: active ? 2 : 1,
      }}
    >
      {word.text.toUpperCase()}
    </span>
  );
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = useMemo(buildPages, []);
  const page = pages.find((p) => frame >= p.start && frame < p.end);
  // Durante el gancho la pregunta va como titulo grande (Titles.tsx).
  if (frame >= MARKS.hookQuestion - 2 && frame < MARKS.hookQuestionEnd) {
    return null;
  }
  if (!page) {
    return null;
  }
  const variant = variantFor(frame);
  const raised = RAISED_PAGES.some(([segId, sourceFrame]) => at(segId, sourceFrame) === page.words[0].start);
  const enter = spring({ frame: frame - page.start, fps, config: { damping: 14, stiffness: 240, mass: 0.5 } });
  const activeIndex = page.words.reduce((found, w, i) => (frame >= w.start ? i : found), -1);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: raised ? 250 : variant.top,
          left: (WIDTH - variant.maxWidth) / 2,
          width: variant.maxWidth,
          minHeight: variant.fontSize * 2.5,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: variant.fontSize,
          lineHeight: 1.08,
          letterSpacing: -0.5,
          textAlign: "center",
          scale: String(interpolate(enter, [0, 1], [0.84, 1])),
          translate: `0px ${interpolate(enter, [0, 1], [18, 0])}px`,
          opacity: interpolate(frame - page.start, [0, 2], [0, 1], CLAMP),
        }}
      >
        {page.words.map((word, i) => (
          <WordView
            key={`${word.start}-${word.text}`}
            word={word}
            active={i === activeIndex}
            spoken={i < activeIndex}
            sinceActive={frame - word.start}
            fontSize={variant.fontSize}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
