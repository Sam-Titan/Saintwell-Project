import * as THREE from "three";
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
	// green left of centre; the pink jar lies in front-right, its base 0.5 inside the green jar's width
	// (jar width 2 -> ~25 % overlap, D-96). Settled is a small drift down and closer.
	desktop: {
		green: [
			[-1.6, 0, -0.7],
			[-1.7, 0, -0.5],
		],
		pink: [
			[-1.1, 1, 0.6],
			[-1.2, 1, 1.0],
		],
	},
	mobile: {
		green: [
			[-1.15, 0, -0.7],
			[-1.2, 0, -0.5],
		],
		pink: [
			[-0.65, 1, 1.0],
			[-0.7, 1, 1.3],
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
	desktop: { w: 11.0, h: 5.2, cx: 0.2, cy: 2.0, top: 0.1, bottom: 0.12 },
	mobile: { w: 6.0, h: 4.6, cx: 0.1, cy: 2.0, top: 0.3, bottom: 0.1 },
};

/** Hero gummy size on screen, as a share of view width (desktop) / of view width (mobile). */
export const HERO_GUMMY_SHARE: Record<Layout, number> = {
	desktop: 0.2,
	mobile: 0.46,
};

// --- camera (shared by the scene and by the layout tests) ---
export const FOV = 28;
/** The camera looks slightly down on the ground (radians). */
export const TILT = 0.1;

/** Camera position and look-at for a layout and view aspect (width / height). */
export function cameraFor(
	layout: Layout,
	aspect: number,
	/** world units the view is raised (hero: the jars sit lower on screen, under the headline) */
	raise = 0,
): { position: Triple; target: Triple } {
	const half = Math.tan((FOV / 2) * (Math.PI / 180));
	const f = FRAME[layout];
	const H = Math.max(f.h / (1 - f.top - f.bottom), f.w / aspect);
	const z = H / 2 / half;
	const viewTop = f.cy + f.h / 2 + f.top * H;
	const viewBottom = f.cy - f.h / 2 - f.bottom * H;
	const centre = (viewTop + viewBottom) / 2;
	return {
		position: [f.cx, centre + raise + z * Math.tan(TILT), z],
		target: [f.cx, centre + raise, 0],
	};
}

/** How far the view is raised in the hero (D-96): the jars start lower, under the headline, and rise as they open. */
export const HERO_RAISE: Record<Layout, number> = { desktop: 0.9, mobile: 0.5 };

/** A world point on screen: x, y as shares of the view width / height (y from the top). */
export function project(
	layout: Layout,
	aspect: number,
	point: Triple,
	raise = 0,
) {
	const { position, target } = cameraFor(layout, aspect, raise);
	const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100);
	cam.position.set(...position);
	cam.lookAt(...target);
	cam.updateMatrixWorld();
	const v = new THREE.Vector3(...point).project(cam);
	return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
}

// --- keeping things out of the text (D-101) ---
/** Share of the view width the 4a/4b text columns take on each side (see SceneBlocks). */
export const TEXT_COLUMN = {
	left: [0.083, 0.383],
	right: [0.617, 0.917],
} as const;

/** The pink jar lies on its side: its own frame is turned -90 degrees about z (cap end towards +x). */
export const PINK_FRAME = new THREE.Quaternion().setFromEuler(
	new THREE.Euler(0, 0, -Math.PI / 2),
);

/**
 * Where each cap rests once it is off (D-109): upside down on the ground beside its jar (open side up, so it reads as
 * a cap), in front and low, below the 4a/4b text rows. World position of the cap's middle on the ground (x, z), turn
 * about the vertical, size factor. Green: left of the green jar. Pink: next to the pink jar's mouth.
 */
export const CAP_GROUND: Record<
	Layout,
	Record<"green" | "pink", { x: number; z: number; yaw: number; scale: number }>
> = {
	desktop: {
		green: { x: -3.3, z: 2.3, yaw: 0.4, scale: 0.7 },
		pink: { x: 2.9, z: 2.5, yaw: -0.3, scale: 0.75 },
	},
	mobile: {
		green: { x: -1.9, z: 2.4, yaw: 0.4, scale: 0.55 },
		pink: { x: -0.75, z: 3.3, yaw: -0.3, scale: 0.55 },
	},
};
/** Height of the cap model (jar units, bottom ring to top). */
export const CAP_HEIGHT = 0.55;
export const CAP_RADIUS = 0.93;

/** The resting cap: position of the model origin relative to its jar's origin, world orientation, size factor. */
export function capGround(layout: Layout, which: "green" | "pink") {
	const g = CAP_GROUND[layout][which];
	const u = unitPosition(layout, which, 1);
	const q = new THREE.Quaternion().setFromEuler(
		new THREE.Euler(Math.PI, g.yaw, 0, "YXZ"),
	);
	const pos: Triple = [g.x - u[0], CAP_HEIGHT * g.scale - u[1], g.z - u[2]];
	return { pos, quat: q, scale: g.scale };
}

/**
 * Floating gummies in the hero shot per layout (world units: x, y, z, size). They sit around the jars,
 * never behind the headline words or label lines (tested through the real camera, D-101).
 */
export const AMBIENT: Record<
	Layout,
	{
		green: readonly (readonly [number, number, number, number])[];
		pink: readonly (readonly [number, number, number, number])[];
	}
> = {
	desktop: {
		green: [
			[-3.9, 1.4, 0.6, 1.5],
			[-3.0, 0.45, 0.8, 0.85],
		],
		pink: [
			[4.3, 5.1, -0.4, 1.3],
			[3.6, 1.2, 0.2, 0.85],
		],
	},
	mobile: {
		green: [
			[-2.3, 1.2, 0.6, 1.1],
			[-1.9, 0.2, 0.8, 0.7],
		],
		pink: [
			[1.9, 2.4, -0.4, 1.0],
			[2.0, 1.0, 0.2, 0.7],
		],
	},
};
