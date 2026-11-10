import React from "react";
import { Composition } from "remotion";
import { Connect360Demo } from "./Connect360Demo";
import "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Connect360Demo"
      component={Connect360Demo}
      durationInFrames={1920}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        showCaptions: true,
        mirrorCamera: true,
        voiceGain: 1,
        musicGain: 1,
        sfxGain: 1,
        masterGain: 0.785,
      }}
    />
  );
};
