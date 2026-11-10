/**
 * Scroll story timeline (D-59, extended in Phase 4, D-62 to D-66). Everything is a pure function
 * of scroll progress p (0..1), so scrolling back up plays it in reverse. Story is 900vh tall.
 *
 *  0.00-0.06  hero: cream, jars closed, slowly turning
 *  0.04-0.10  headline fades out
 *  0.06-0.14  night falls (cream -> split night), moon and stars in
 *  0.12-0.22  caps lift
 *  0.18-0.34  gummies rise out of the neck
 *  0.31-0.58  3 ingredient cards, one after another; gummies drift toward the active card
 *  0.58-0.79  3 benefits, one after another
 *  0.76-0.84  gummies sink back
 *  0.82-0.88  caps close
 *  0.86-0.94  morning: back to cream, moon and stars out
 *  0.90-0.97  3 badges in (staggered), stay until the end
 *  0.90-0.97  jars turn again
 */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 0 below a, 1 above b, smooth in between. */
export function smooth(a: number, b: number, x: number): number {
	const t = clamp01((x - a) / (b - a));
	return t * t * (3 - 2 * t);
}

/** Rises over a..b, falls over c..d. */
const pulse = (a: number, b: number, c: number, d: number, x: number) =>
	clamp01(smooth(a, b, x) - smooth(c, d, x));

/** Gummy float height range (jar units). Capped so gummies stay below the lifted caps and the heading band (D-74). */
export const FLOAT_Y = { min: 2.6, spread: 1 } as const;

export type Triple = readonly [number, number, number];

export type Timeline = {
	/** 0 closed .. 1 cap fully lifted */
	capLift: number;
	/** 0 gummies inside .. 1 gummies floating outside */
	gummyOut: number;
	/** 0..1, extra sideways drift while the gummies hold */
	drift: number;
	/** 1 = jar turns freely, 0 = jar faces front */
	spin: number;
	/** headline and subtitle opacity */
	text: number;
	/** 0 cream (day) .. 1 full night */
	night: number;
	/** ingredient cards opacity; also how strongly gummy group i is pulled toward card i */
	cards: Triple;
	/** benefit opacities */
	benefits: Triple;
	/** badge opacities */
	badges: Triple;
};

/** Three slots between a and b; each fades in/out over `f` around its edges (cross-fades). */
function slots(a: number, b: number, f: number, x: number): Triple {
	const w = (b - a) / 3;
	const one = (i: number) => {
		const s = a + w * i;
		const e = s + w;
		return pulse(
			i === 0 ? s - f : s - f / 2,
			i === 0 ? s : s + f / 2,
			i === 2 ? e : e - f / 2,
			i === 2 ? e + f : e + f / 2,
			x,
		);
	};
	return [one(0), one(1), one(2)];
}

export function timeline(p: number): Timeline {
	const x = clamp01(p);
	return {
		capLift: pulse(0.12, 0.22, 0.82, 0.88, x),
		gummyOut: pulse(0.18, 0.34, 0.76, 0.84, x),
		drift: pulse(0.34, 0.44, 0.76, 0.84, x),
		spin: clamp01(1 - smooth(0.05, 0.1, x) + smooth(0.9, 0.97, x)),
		text: clamp01(1 - smooth(0.04, 0.1, x)),
		night: pulse(0.06, 0.14, 0.86, 0.94, x),
		cards: slots(0.34, 0.55, 0.03, x),
		benefits: slots(0.61, 0.76, 0.03, x),
		badges: [
			smooth(0.9, 0.93, x),
			smooth(0.92, 0.95, x),
			smooth(0.94, 0.97, x),
		],
	};
}

/** Per-gummy progress with a stagger, so gummies leave one after another. i in 0..n-1. */
export function gummyProgress(out: number, i: number, n: number): number {
	const delay = n > 1 ? (i / (n - 1)) * 0.5 : 0;
	return smooth(0, 1, (out - delay) / (1 - 0.5));
}

export type Vec3 = Triple;

/**
 * Gummy path: rest (inside the jar) -> neck (centre of the opening) -> float (outside).
 * Going through the neck keeps gummies inside the jar walls and clear of the lifted cap.
 */
export function gummyPath(
	t: number,
	rest: Vec3,
	neck: Vec3,
	float: Vec3,
): Vec3 {
	const a = smooth(0, 0.5, t);
	const b = smooth(0.5, 1, t);
	const mix = (u: number, v: number, k: number) => u + (v - u) * k;
	const inner: Vec3 = [
		mix(rest[0], neck[0], a),
		mix(rest[1], neck[1], a),
		mix(rest[2], neck[2], a),
	];
	return [
		mix(inner[0], float[0], b),
		mix(inner[1], float[1], b),
		mix(inner[2], float[2], b),
	];
}
