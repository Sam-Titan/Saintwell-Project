import { asset } from "../assetUrl";
import type { JarColour, JarLabel } from "../theme/tokens";
import { themes } from "../theme/tokens";

export type Look = { colour: JarColour; label: JarLabel };

/** The two jars on the page (D-57): green A on the left, pink A on the right. */
export const jars: readonly Look[] = [
	{ colour: "green", label: "a" },
	{ colour: "pink", label: "a" },
];

/** Body and gummy colours per jar colour (hex values only from SPEC / theme tokens). */
export const jarColours = {
	green: { body: themes.green.night, gummy: themes.green.accent },
	pink: { body: themes.pink.accent, gummy: themes.pink.accent },
} as const;

export function labelUrl(
	{ colour, label }: Look,
	size: 1024 | 2048 = 2048,
): string {
	return asset(`textures/labels/${colour}-${label}-${size}.webp`);
}
