/**
 * Scroll story timeline (D-59). Everything is a pure function of scroll progress p (0..1),
 * so scrolling back up plays it in reverse.
 *
 *  0.00-0.10  hero: jars closed, slowly turning
 *  0.10-0.28  caps lift
 *  0.22-0.55  gummies rise out of the neck
 *  0.55-0.72  hold and drift
 *  0.72-0.88  gummies sink back
 *  0.88-1.00  caps close, jars turn again
 */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 0 below a, 1 above b, smooth in between. */
export function smooth(a: number, b: number, x: number): number {
	const t = clamp01((x - a) / (b - a));
	return t * t * (3 - 2 * t);
}

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
};

export function timeline(p: number): Timeline {
	const x = clamp01(p);
	return {
		capLift: clamp01(smooth(0.1, 0.28, x) - smooth(0.88, 1, x)),
		gummyOut: clamp01(smooth(0.22, 0.55, x) - smooth(0.72, 0.88, x)),
		drift: clamp01(smooth(0.55, 0.72, x) - smooth(0.72, 0.88, x)),
		spin: clamp01(1 - smooth(0.05, 0.1, x) + smooth(0.88, 0.95, x)),
		text: clamp01(1 - smooth(0.06, 0.12, x)),
	};
}

/** Per-gummy progress with a stagger, so gummies leave one after another. i in 0..n-1. */
export function gummyProgress(out: number, i: number, n: number): number {
	const delay = n > 1 ? (i / (n - 1)) * 0.5 : 0;
	return smooth(0, 1, (out - delay) / (1 - 0.5));
}

export type Vec3 = readonly [number, number, number];

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
