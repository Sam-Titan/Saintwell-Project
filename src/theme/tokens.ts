export type JarColour = "green" | "pink";
export type JarLabel = "a" | "b";

/** Colours and fonts per jar colour. Hex values come from docs/SPEC.md only. */
export const themes = {
	green: {
		night: "#3e4a2f", // dark olive
		accent: "#9ba56b", // sage
		cream: "#f8f5ec",
		white: "#ffffff",
		fontBody: '"Poppins", sans-serif',
		fontDisplay: '"Lora", serif',
	},
	pink: {
		night: "#6a1f2b", // maroon
		accent: "#d79aa8", // pink
		soft: "#e7c4cc", // light pink
		blush: "#f9eff2",
		cream: "#f8f5ec",
		white: "#ffffff",
		fontBody: '"Inter", sans-serif',
		fontDisplay: '"Inter", sans-serif',
	},
} as const;

export type Theme = (typeof themes)[JarColour];
