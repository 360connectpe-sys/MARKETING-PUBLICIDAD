import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fuentes locales (public/fonts): Poppins es la tipografia de la web de 360 Connect;
// Press Start 2P es la tipografia pixelada de la Zona de Juegos.
export const FONT = "Poppins";
export const PIXEL_FONT = "Press Start 2P";

for (const weight of ["500", "600", "700", "800", "900"]) {
  loadFont({ family: FONT, url: staticFile(`fonts/Poppins-${weight}.woff2`), weight }).catch((err) =>
    console.error("No se pudo cargar Poppins", weight, err),
  );
}
loadFont({ family: PIXEL_FONT, url: staticFile("fonts/PressStart2P-400.woff2"), weight: "400" }).catch((err) =>
  console.error("No se pudo cargar Press Start 2P", err),
);

/** Paleta de 360 Connect (la misma de la web) + acentos de la Zona de Juegos. */
export const COLORS = {
  navy: "#0a1a3d",
  navy2: "#0f2556",
  ink: "#061029",
  blue: "#1570ff",
  cyan: "#22c3ff",
  yellow: "#ffe14d",
  white: "#ffffff",
  arcade: "#1b0f33",
  orange: "#ffa62b",
  pink: "#ff4d8d",
};

/** Zonas que tapan los botones de Reels / TikTok / Shorts. */
export const SAFE = { top: 130, bottom: 330, right: 120, left: 44 };

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const CLAMP = clampOpts;

/** Contorno de texto hecho con sombras (se ve igual en Studio y en el render). */
export const outline = (radius: number, color: string, extra = ""): string => {
  const steps = 20;
  const parts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    parts.push(`${(Math.cos(a) * radius).toFixed(2)}px ${(Math.sin(a) * radius).toFixed(2)}px 0 ${color}`);
  }
  if (extra) {
    parts.push(extra);
  }
  return parts.join(", ");
};
