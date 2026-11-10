import { AMBIENT, type Layout, MOUTH, unitPosition } from "./poses";
import { rng } from "./random";
import { clamp01, smooth, type Vec3 } from "./storyTimeline";

/**
 * Where every gummy goes (pure and unit tested; D-110, D-111, D-114). Positions are in the jar unit's own frame:
 * origin = base centre of the jar. The green jar stands along +y. The pink jar lies along +x with its axis at
 * y = z = 0 and the ground 1 below the axis.
 */
/** Crowd gummies are drawn this much bigger than the model, so they read at page size. */
export const CROWD_SCALE = 1.5;
/** Half width of the gumdrop model incl. its wobble (jar units). */
const MODEL_RADIUS = 0.192;
/** Collision radius of a gummy with size factor `scale`. */
export const gummyRadius = (scale: number) =>
	MODEL_RADIUS * CROWD_SCALE * scale;

/** How many gummies of each jar start outside the jar in the hero shot (they are crowd members, D-110). */
export const FREE_PER_JAR = 2;
export const freeCount = (n: number) =>
	Math.min(FREE_PER_JAR, Math.max(0, n - 1));

/** The hero gummy's tilt towards the camera: the sprite's camera elevation (38 degrees, D-113), rocking +-10 degrees once per turn. */
export const HERO_TILT = 0.663;
export const HERO_ROCK = 0.1745;
/** Tilt at spin angle `phi` (the sprite frames were rendered with exactly this pose). */
export const heroTilt = (phi: number) => HERO_TILT + HERO_ROCK * Math.sin(phi);
/** Spin speed of the hero gummy and of its sprite (radians per second); both read the same clock. */
export const HERO_SPIN_SPEED = 0.28;
export const heroSpin = (seconds: number) => seconds * HERO_SPIN_SPEED;

// ---------- the jar as a collider ----------
/** Jar wall along the axis (a = 0 at the base, 2.4 at the rim): inner and outer radius (Blender profile). */
export const JAR_LENGTH = 2.4;
export const wallInner = (a: number) =>
	a < 1.95 ? 0.94 : 0.94 + (0.82 - 0.94) * clamp01((a - 1.95) / 0.33);
export const wallOuter = (a: number) =>
	a < 2.07 ? 1.0 : 1.0 + (0.88 - 1.0) * clamp01((a - 2.07) / 0.2);

/** True if a ball of radius `rg` at (axial position a, radial distance r from the axis) touches the jar wall. */
export function touchesWall(a: number, r: number, rg: number): boolean {
	const lo = Math.max(0, a - rg);
	const hi = Math.min(JAR_LENGTH, a + rg);
	for (let s = lo; s <= hi + 1e-9; s += 0.02) {
		const inner = wallInner(s);
		const outer = wallOuter(s);
		const dr = r < inner ? inner - r : r > outer ? r - outer : 0;
		if ((a - s) ** 2 + dr ** 2 < rg * rg) return true;
	}
	return false;
}

// ---------- paths ----------
/** Point at fraction `u` (0..1) of a polyline's length. */
export function pointOnPath(path: readonly Vec3[], u: number): Vec3 {
	const lens: number[] = [];
	let total = 0;
	for (let i = 1; i < path.length; i++) {
		const l = Math.hypot(
			path[i][0] - path[i - 1][0],
			path[i][1] - path[i - 1][1],
			path[i][2] - path[i - 1][2],
		);
		lens.push(l);
		total += l;
	}
	let d = clamp01(u) * total;
	for (let i = 0; i < lens.length; i++) {
		if (d <= lens[i] || i === lens.length - 1) {
			const k = lens[i] > 0 ? Math.min(1, d / lens[i]) : 1;
			const a = path[i];
			const b = path[i + 1];
			return [
				a[0] + (b[0] - a[0]) * k,
				a[1] + (b[1] - a[1]) * k,
				a[2] + (b[2] - a[2]) * k,
			];
		}
		d -= lens[i];
	}
	return path[path.length - 1];
}

export type Spec = {
	/** inside: starts in the jar and leaves through the mouth. free: already outside in the hero shot. */
	kind: "inside" | "free";
	/** polyline: start, waypoints, where it ends up */
	path: readonly Vec3[];
	/** yaw start angle, tilt phases */
	spin: Vec3;
	phase: number;
	/** size factor */
	scale: number;
};

/** The mouth of the standing (green) jar: centre of the opening. */
export const NECK: Vec3 = [0, MOUTH, 0];
/** Straight above the neck: gummies come out upwards, clear of the rim, before they drift to their spot. */
const NECK_UP: Vec3 = [0, MOUTH + 0.45, 0];
/** Centre of the green float ring, in the standing jar's frame. */
export const FLOAT_CX = 1.9;
/** The first green gummy floats here; the hero gummy takes off from (and returns to) this spot. */
export const GREEN_FLOAT0: Vec3 = [1.9, 3.4, 0.3];

/** Lying jar: the mouth (cap end) and the ground. */
export const GROUND_Y = -1 + 0.2;
export const PINK_MOUTH: Vec3 = [MOUTH + 0.05, -0.3, 0];
/** Where the first pink gummy lands; the pink hero gummy takes off from here. */
export const PINK_GROUND0: Vec3 = [1.2, GROUND_Y, 2.0];
/** Out of the mouth, then down and round to the front, never back under the jar. */
const PINK_OUT: Vec3 = [MOUTH + 0.7, -0.55, 0.15];

type Free = readonly (readonly [number, number, number, number])[];

/** Hero-shot spots of the free gummies (AMBIENT, world) in the unit's frame at the hero pose. */
export function freeStarts(layout: Layout, colour: "green" | "pink"): Free {
	const u = unitPosition(layout, colour, 0);
	return AMBIENT[layout][colour].map(
		(s) => [s[0] - u[0], s[1] - u[1], s[2] - u[2], s[3]] as const,
	);
}

/** Standing jar: gummies rise through the neck and float on a ring above and between the jars, inside the centre band. */
export function standingSpecs(
	count: number,
	seed: number,
	free: Free = [],
): Spec[] {
	const r = rng(seed);
	const nFree = Math.min(free.length, freeCount(count));
	const nIn = count - nFree;
	return Array.from({ length: count }, (_, i) => {
		const a = r() * Math.PI * 2;
		const rad = Math.sqrt(r()) * 0.5;
		const rest: Vec3 = [
			Math.cos(a) * rad,
			0.34 + (i / nIn) * 1.4 + r() * 0.12,
			Math.sin(a) * rad,
		];
		const fa = (i / count) * Math.PI * 2 + r() * 0.5;
		const fr = 0.3 + r() * 0.4;
		const float: Vec3 =
			i === 0
				? GREEN_FLOAT0
				: [
						FLOAT_CX + Math.cos(fa) * fr,
						2.7 + r() * 1.2,
						Math.sin(fa) * 0.7 * (0.5 + r()),
					];
		const spin: Vec3 = [r() * 6.28, r() * 6.28, r() * 6.28];
		const phase = r() * 6.28;
		const scale = 0.85 + r() * 0.3;
		if (i < nIn)
			return {
				kind: "inside",
				path: [rest, NECK, NECK_UP, float],
				spin,
				phase,
				scale,
			};
		const f = free[i - nIn];
		// over the front of the jar, clear of the rim and of the lifted cap
		return {
			kind: "free",
			path: [[f[0], f[1], f[2]], [-0.4, 3.6, 1.8], float],
			spin,
			phase,
			scale: f[3],
		};
	});
}

/** Where pink gummy `i` of `n` lands: a jittered grid on the ground in front of the lying jar, near the mouth end. */
export function landing(i: number, n: number, r: () => number): Vec3 {
	if (i === 0) return PINK_GROUND0;
	const cols = 6;
	const rows = Math.max(1, Math.ceil(n / cols));
	const c = i % cols;
	const row = Math.floor(i / cols) % rows;
	return [
		0.1 + (c + 0.2 + r() * 0.6) * (3.0 / cols),
		GROUND_Y,
		1.6 + (row + 0.2 + r() * 0.6) * (1.0 / rows),
	];
}

/** Lying jar: gummies pile low in the jar, leave through the mouth and settle on the ground in front of it. */
export function lyingSpecs(
	count: number,
	seed: number,
	free: Free = [],
): Spec[] {
	const r = rng(seed);
	const nFree = Math.min(free.length, freeCount(count));
	const nIn = count - nFree;
	return Array.from({ length: count }, (_, i) => {
		const along = 0.45 + (i / nIn) * 1.45 + r() * 0.08;
		const side = (r() - 0.5) * 0.6;
		const down = -(0.05 + r() * 0.4);
		const rest: Vec3 = [along, down, side];
		const land = landing(i, count, r);
		const spin: Vec3 = [r() * 6.28, r() * 6.28, r() * 6.28];
		const phase = r() * 6.28;
		const scale = 0.85 + r() * 0.3;
		if (i < nIn)
			return {
				kind: "inside",
				path: [
					rest,
					PINK_MOUTH,
					PINK_OUT,
					[PINK_OUT[0], GROUND_Y + 0.05, land[2]],
					land,
				],
				spin,
				phase,
				scale,
			};
		const f = free[i - nIn];
		// from the hero-shot spot, high over the front, then straight down onto the ground
		return {
			kind: "free",
			path: [[f[0], f[1], f[2]], [land[0], 2.6, land[2]], land],
			spin,
			phase,
			scale: f[3],
		};
	});
}

/** How far gummy `i` has come, for a jar whose gummies are `out` (0..1) out. Inside ones leave one after another. */
export function gummyProgress(out: number, i: number, nInside: number): number {
	const delay = nInside > 1 ? (i / (nInside - 1)) * 0.5 : 0;
	return smooth(0, 1, (out - delay) / 0.5);
}

export type GummyState = {
	pos: Vec3;
	/** size factor (0 = hidden: only the hero's seat, while the hero is out) */
	scale: number;
	/** Euler angles, order YXZ: yaw, then a small tilt (never more than TILT_MAX) */
	yaw: number;
	tiltX: number;
	tiltZ: number;
};

/** Largest tilt of a floating gummy (about 20 degrees): mostly yaw, base always facing down. */
export const TILT_MAX = 0.35;

/**
 * State of crowd gummy `i` of `n`. `out` = how far this jar's gummies are out (0..1), `heroT` = how far this jar's
 * hero gummy has left (0 = in the crowd). The count never changes and no gummy shrinks or fades (D-110): only
 * instance 0, the hero's seat, is empty while the hero is out. `time` = seconds (any steady clock).
 */
export function gummyState(
	spec: Spec,
	i: number,
	n: number,
	out: number,
	heroT: number,
	time: number,
): GummyState {
	const nInside = n - freeCount(n);
	const t =
		spec.kind === "free" ? smooth(0.5, 1, out) : gummyProgress(out, i, nInside);
	const e = smooth(0, 1, t);
	const pos = pointOnPath(spec.path, e);
	const end = spec.path[spec.path.length - 1];
	const lands = end[1] <= GROUND_Y + 1e-6;
	// the seat has no bob, so the hero takes off from (and returns to) exactly this spot
	const bob =
		!lands && i !== 0 ? Math.sin(time * 1.1 + spec.phase) * 0.07 * e : 0;
	const wobble = (lands ? 1 - smooth(0.6, 1, e) : 1) * TILT_MAX;
	const seat = i === 0 ? 1 : 0;
	return {
		pos: [pos[0], pos[1] + bob, pos[2]],
		scale: i === 0 && heroT > 0.001 ? 0 : spec.scale,
		// the seat spins on the hero's clock, so the hero gummy takes over without a turn
		yaw: seat
			? heroSpin(time)
			: spec.spin[1] + e * 3 + (lands ? 0 : time * 0.25 * e),
		tiltX: seat ? 0 : Math.sin(spec.phase + time * 0.6 + e * 2) * wobble,
		tiltZ: seat ? 0 : Math.sin(spec.spin[0] + time * 0.5) * wobble,
	};
}
