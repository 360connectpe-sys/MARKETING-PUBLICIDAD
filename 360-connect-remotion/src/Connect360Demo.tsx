import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { MARKS } from "./edit/timeline";
import { CameraTrack, Cutaway, CutFlashes } from "./layers/CameraTrack";
import { Captions } from "./layers/Captions";
import { DemoScene } from "./layers/DemoScene";
import { Dialogue, Music, SoundEffects } from "./layers/Sound";
import { CtaTitle, EndCard, HookQuestion, HookTitle, LogoBadge } from "./layers/Titles";

export type Connect360DemoProps = {
  /** Subtitulos palabra por palabra. */
  readonly showCaptions: boolean;
  /** Voltea los planos de camara frontal para que el texto de la placa se lea bien. */
  readonly mirrorCamera: boolean;
  /** Volumen de la voz (1 = como sale del limpiado). */
  readonly voiceGain: number;
  /** Volumen de la base musical (0 = sin musica). */
  readonly musicGain: number;
  /** Volumen de los efectos de sonido (0 = sin efectos). */
  readonly sfxGain: number;
  /** Volumen general; 0.785 deja la mezcla en -16 LUFS. */
  readonly masterGain: number;
};

/**
 * Anuncio «360 Connect · Casa Nativa (demo)» — 1080 x 1920, 30 fps, ~87 s (la duracion sale de edl.json).
 *
 * Capas, de abajo arriba:
 *   1. Imagen: planos a camara, plano de apoyo del telefono y demo de Casa Nativa.
 *   2. Rotulos: gancho, logo, pregunta final y tarjeta de cierre.
 *   3. Subtitulos.
 *   4. Sonido: dialogo, musica y efectos, cada uno en su pista.
 */
export const Connect360Demo: React.FC<Connect360DemoProps> = ({
  showCaptions,
  mirrorCamera,
  voiceGain,
  musicGain,
  sfxGain,
  masterGain,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 1 · Imagen */}
      <CameraTrack mirror={mirrorCamera} />
      <Cutaway />
      <Sequence name="Demo · Casa Nativa" from={MARKS.demoFrom} durationInFrames={MARKS.demoTo - MARKS.demoFrom}>
        <DemoScene />
      </Sequence>
      <CutFlashes />

      {/* 2 · Rotulos */}
      <HookTitle />
      <HookQuestion />
      <LogoBadge />
      <CtaTitle />

      {/* 3 · Subtitulos */}
      {showCaptions ? <Captions /> : null}

      <EndCard />

      {/* 4 · Sonido */}
      <Dialogue gain={voiceGain * masterGain} />
      {musicGain > 0 ? <Music gain={musicGain * masterGain} /> : null}
      {sfxGain > 0 ? <SoundEffects gain={sfxGain * masterGain} /> : null}
    </AbsoluteFill>
  );
};
