import { staticFile } from "remotion";
import edl from "./edl.json";

/**
 * Linea de tiempo del anuncio.
 *
 * `edl.json` es la lista de cortes de voz, en orden. Cada entrada indica el video
 * original y el rango de fotogramas (30 fps, inicio incluido y fin excluido).
 * Las entradas con `gap` son pausas sin voz. Todo lo demas (imagen, subtitulos,
 * rotulos y efectos) se ancla a estos cortes con `seg()` y `at()`, asi que basta
 * cambiar un rango en `edl.json` para que el resto se recoloque solo.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type SourceKey = keyof typeof edl.sources;

export type Segment = {
  id: string;
  /** Video original; `null` en las pausas. */
  src: SourceKey | null;
  /** Primer fotograma del original (incluido). */
  in: number;
  /** Ultimo fotograma del original (excluido). */
  out: number;
  /** Fotograma del montaje donde empieza. */
  from: number;
  duration: number;
};

type RawItem = { id: string; src?: string; in?: number; out?: number; gap?: number };

const build = (): Segment[] => {
  let cursor = 0;
  return (edl.voice as RawItem[]).map((item) => {
    const duration = item.gap ?? (item.out as number) - (item.in as number);
    const segment: Segment = {
      id: item.id,
      src: (item.src as SourceKey | undefined) ?? null,
      in: item.in ?? 0,
      out: item.out ?? duration,
      from: cursor,
      duration,
    };
    cursor += duration;
    return segment;
  });
};

export const SEGMENTS = build();
export const TOTAL_FRAMES = SEGMENTS.reduce((sum, s) => sum + s.duration, 0);

export const seg = (id: string): Segment => {
  const found = SEGMENTS.find((s) => s.id === id);
  if (!found) {
    throw new Error(`No existe el segmento "${id}" en edl.json`);
  }
  return found;
};

/** Fotograma del montaje que corresponde a un fotograma del video original. */
export const at = (id: string, sourceFrame: number): number => {
  const s = seg(id);
  return s.from + (sourceFrame - s.in);
};

/**
 * Fotograma del montaje para un fotograma de un video original, buscando el
 * corte de voz de ese video que lo contiene (o el mas cercano).
 */
export const atSource = (src: SourceKey, sourceFrame: number): number => {
  const candidates = SEGMENTS.filter((s) => s.src === src);
  if (candidates.length === 0) {
    throw new Error(`El video "${src}" no se usa en edl.json`);
  }
  const distance = (s: Segment) =>
    sourceFrame < s.in ? s.in - sourceFrame : sourceFrame >= s.out ? sourceFrame - s.out + 1 : 0;
  const best = candidates.reduce((a, b) => (distance(b) < distance(a) ? b : a));
  const clamped = Math.min(Math.max(sourceFrame, best.in), best.out);
  return best.from + (clamped - best.in);
};

export const videoFile = (key: SourceKey) => staticFile(`media/${edl.sources[key]}.mp4`);
export const voiceFile = (key: SourceKey) => staticFile(`media/voice/${edl.sources[key]}.wav`);

/** Videos grabados con la camara frontal (salen en espejo). */
export const CAMERA_SOURCES: SourceKey[] = ["IMG_0319", "IMG_0322", "IMG_0330", "IMG_0331", "IMG_0333"];

// ----- Hitos del montaje (todos derivados de los cortes) -----
export const MARKS = {
  /** «...estamos creando 360 Connect» */
  brandReveal: at("marca", 39),
  /** Plano de apoyo del telefono sobre la mesa: «y te dirigira a una pagina exclusiva...» */
  cutawayFrom: at("como-funciona", 386),
  demoFrom: seg("pausa-demo").from,
  /** Palabra «juegos»: entrada a la Zona de Juegos */
  gamesReveal: at("demo-juegos", 1078),
  demoTo: seg("idea").from,
  /** «¿implementarias esta idea?» */
  ctaQuestion: at("cta-1", 310) - 4,
  endCardFrom: seg("cierre").from,
};
