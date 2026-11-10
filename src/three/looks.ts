import type { JarColour, JarLabel } from "../theme/tokens";
import { themes } from "../theme/tokens";

export type Look = { colour: JarColour; label: JarLabel };

/** The 4 looks: green A/B, pink A/B. */
export const looks: readonly Look[] = [
	{ colour: "green", label: "a" },
	{ colour: "green", label: "b" },
	{ colour: "pink", label: "a" },
	{ colour: "pink", label: "b" },
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
	return `/textures/labels/${colour}-${label}-${size}.webp`;
}
