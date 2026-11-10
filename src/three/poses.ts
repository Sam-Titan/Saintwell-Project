import type { Triple } from "./storyTimeline";

/**
 * Where things stand (D-82). World units: jar body radius 1, ground at y = 0, +z towards the camera.
 * The green jar stands; the pink jar lies on its side (axis along +x, cap on the right).
 */
export type Layout = "desktop" | "mobile";

type Poses = {
	/** green jar base centre: hero pose, settled pose */
	green: readonly [Triple, Triple];
	/** pink jar BASE centre (its axis runs along +x from here): hero, settled */
	pink: readonly [Triple, Triple];
};

export const POSES: Record<Layout, Poses> = {
	desktop: {
		green: [
			[0.1, 0, -1.0],
			[-2.0, 0, -0.4],
		],
		pink: [
			[-0.6, 1, 0.5],
			[-0.9, 1, 1.4],
		],
	},
	mobile: {
		green: [
			[-0.45, 0, -1.0],
			[-1.2, 0, -0.5],
		],
		pink: [
			[-1.2, 1, 0.8],
			[-1.6, 1, 1.2],
		],
	},
};

/** Length of the jar body along its axis, mouth position (local y of the jar model). */
export const MOUTH = 2.5;

const lerp3 = (a: Triple, b: Triple, t: number): Triple => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
];

/** Jar base position for a given settle value (can overshoot 1 a little: the settle bounce). */
export function unitPosition(
	layout: Layout,
	which: "green" | "pink",
	settle: number,
): Triple {
	const [a, b] = POSES[layout][which];
	return lerp3(a, b, settle);
}

/**
 * Camera framing. `box` is the area that must stay in view (world units) and `top` / `bottom` are
 * clear shares of the view height (mobile keeps the top for the stacked headline).
 */
export const FRAME: Record<
	Layout,
	{ w: number; h: number; cx: number; cy: number; top: number; bottom: number }
> = {
	desktop: { w: 9.2, h: 4.6, cx: 0.2, cy: 2.0, top: 0.1, bottom: 0.12 },
	mobile: { w: 5.4, h: 4.6, cx: -0.3, cy: 2.0, top: 0.3, bottom: 0.1 },
};

/** Hero gummy size on screen, as a share of view width (desktop) / of view width (mobile). */
export const HERO_GUMMY_SHARE: Record<Layout, number> = {
	desktop: 0.2,
	mobile: 0.46,
};
