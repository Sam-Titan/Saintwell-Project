import { asset } from "../assetUrl";
import type { JarColour, JarLabel } from "../theme/tokens";
import { themes } from "../theme/tokens";

export type Look = { colour: JarColour; label: JarLabel };

/** The two jars on the page (D-57): green A on the left, pink A on the right. */
export const jars: readonly Look[] = [
	{ colour: "green", label: "a" },
	{ colour: "pink", label: "a" },
];

/** Body colours from the theme; gummies are a brighter, juicier version of the accents (D-113). */
export const jarColours = {
	green: { body: themes.green.night, gummy: "#acc258" },
	pink: { body: themes.pink.accent, gummy: "#f098b2" },
} as const;

export function labelUrl(
	{ colour, label }: Look,
	size: 1024 | 2048 = 2048,
): string {
	return asset(`textures/labels/${colour}-${label}-${size}.webp`);
}
