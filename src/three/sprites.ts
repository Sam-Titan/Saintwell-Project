import { asset } from "../assetUrl";

/** The hero gummy turntable (D-106): frames per colour, must match `just sprites` (frames argument, default 24). */
export const SPRITE_FRAMES = 24;
/** The gummy spans this share of a sprite frame's width (blender/render_gummy.py FILL). */
export const SPRITE_FILL = 0.74;

export const spriteUrl = (colour: "green" | "pink", k: number) =>
	asset(`sprites/gummy-${colour}-${String(k).padStart(2, "0")}.webp`);

/** Set by HeroSprite once a colour's frames are decoded. Until then the 3D hero gummy stays visible (fail soft). */
export const spritesReady = { green: false, pink: false };
