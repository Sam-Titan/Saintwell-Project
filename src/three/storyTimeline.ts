/**
 * Scroll story timeline, Phase 4R (D-79, retimed by D-95). Everything is a pure function of scroll
 * progress p (0..1), so scrolling back up plays it in reverse. The story is 800vh tall (700vh on
 * phones), so p = 0.1 is about 70vh of scrolling.
 *
 *  0.00-0.08  1/2 hero + small settle: headline fades out, jars face front
 *  0.04-0.22  3 open: caps unscrew (first motion within ~30vh), green gummies rise, pink roll out
 *  0.20-0.46  4a Ingredients (olive): green hero gummy, 4 blocks (hold 0.35-0.42)
 *  0.44-0.68  4b Benefits (maroon): pink hero gummy, 4 blocks (hold 0.54-0.64)
 *  0.66-0.78  5 return: gummies back, caps close, maroon -> dark olive
 *  0.78-1.00  6 Numbers (dark olive): 5 mg, 30, with..., 3 badges
 */

/** Story heights in vh (D-95). */
export const STORY_VH = { desktop: 800, mobile: 700 } as const;

/** Scroll progress after `vh` viewport heights of scrolling, for a story `height` vh tall. */
export const progressAtVh = (vh: number, height: number) => vh / (height - 100);

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 0 below a, 1 above b, smooth in between. */
export function smooth(a: number, b: number, x: number): number {
	const t = clamp01((x - a) / (b - a));
	return t * t * (3 - 2 * t);
}

/** Rises over a..b, falls over c..d. */
const pulse = (a: number, b: number, c: number, d: number, x: number) =>
	clamp01(smooth(a, b, x) - smooth(c, d, x));

/** Ease out with a small overshoot (settle bounce). Can exceed 1 slightly. */
export function easeOutBack(t: number): number {
	const u = clamp01(t);
	const c1 = 1.2;
	const c3 = c1 + 1;
	return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
}

export type Triple = readonly [number, number, number];
export type Quad = readonly [number, number, number, number];

// --- colours (SPEC colour table; dark olive from D-81) ---
export const COLOURS = {
	cream: [0xf8, 0xf5, 0xec],
	olive: [0x3e, 0x4a, 0x2f],
	maroon: [0x6a, 0x1f, 0x2b],
	darkOlive: [0x2e, 0x37, 0x23],
} as const;
type Rgb = readonly [number, number, number];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
];

/** Page / stage background colour (0-255 floats) at progress p. Cream, olive, maroon, dark olive. */
export function backgroundAt(p: number): Rgb {
	const x = clamp01(p);
	let c: Rgb = mix(COLOURS.cream, COLOURS.olive, smooth(0.12, 0.24, x));
	c = mix(c, COLOURS.maroon, smooth(0.44, 0.52, x));
	c = mix(c, COLOURS.darkOlive, smooth(0.68, 0.78, x));
	return c;
}

export const rgbCss = (c: Rgb) =>
	`rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;

/** In-page anchors: the progress where each scene sits fully in view (nav links scroll here). */
export const ANCHORS = {
	ingredients: 0.38,
	benefits: 0.6,
	numbers: 0.97,
} as const;

export type Timeline = {
	/** headline, sub-lines, scroll hints, socials: 1 in the hero, gone after scene 2 */
	hero: number;
	/** 0 hero pose .. 1 settled (jars lower and closer); can overshoot (bounce) */
	settle: number;
	/** 1 = jars turn freely, 0 = jars face front */
	spin: number;
	/** 0 closed .. 1 cap fully lifted */
	capLift: number;
	/** 0 caps hover over their jars .. 1 caps lie on the ground beside them (D-109) */
	capDown: number;
	/** small cap wobble while it unscrews (radians-ish, signed) */
	wobble: number;
	/** 0 gummies inside .. 1 green gummies floating outside */
	greenOut: number;
	/** 0 gummies inside .. 1 pink gummies rolled out on the ground */
	pinkOut: number;
	/** green hero gummy 0 (in the crowd) .. 1 (big, centre) */
	greenHero: number;
	/** pink hero gummy 0 .. 1 */
	pinkHero: number;
	/** 0..1: how much everything else is blurred / faded behind a hero gummy */
	focus: number;
	/** 0 light page .. 1 dark page (header, nav, background word tone) */
	dark: number;
	/** 0..1 same-colour veil over the canvas (jars dark behind the Numbers) */
	veil: number;
	/** giant "SAINTWELL" word */
	word: number;
	eyebrowIngredients: number;
	eyebrowBenefits: number;
	/** step marker visibility and which step is active (0 = Ingredients, 1 = Benefits) */
	marker: number;
	step: number;
	ingredients: Quad;
	benefits: Quad;
	/** Numbers scene */
	glance: number;
	five: number;
	thirty: number;
	with: number;
	badges: Triple;
};

const stagger = (
	a: number,
	d: number,
	step: number,
	outA: number,
	outB: number,
	x: number,
): Quad => {
	const one = (i: number) =>
		smooth(a + i * step, a + i * step + d, x) * (1 - smooth(outA, outB, x));
	return [one(0), one(1), one(2), one(3)];
};

export function timeline(p: number): Timeline {
	const x = clamp01(p);
	const greenHero = pulse(0.2, 0.28, 0.42, 0.46, x);
	const pinkHero = pulse(0.44, 0.52, 0.64, 0.68, x);
	const capLift = pulse(0.04, 0.12, 0.7, 0.78, x);
	return {
		hero: clamp01(1 - smooth(0, 0.04, x)),
		settle: easeOutBack(x / 0.07),
		spin: clamp01(1 - smooth(0.02, 0.08, x)),
		capLift,
		capDown: pulse(0.12, 0.2, 0.64, 0.7, x),
		wobble:
			Math.sin(capLift * Math.PI * 5) * 0.05 * Math.sin(capLift * Math.PI),
		greenOut: pulse(0.08, 0.2, 0.66, 0.74, x),
		pinkOut: pulse(0.1, 0.22, 0.66, 0.74, x),
		greenHero,
		pinkHero,
		focus: clamp01(greenHero + pinkHero),
		dark: smooth(0.12, 0.24, x),
		veil: smooth(0.78, 0.84, x),
		word: 1 - smooth(0.78, 0.84, x),
		eyebrowIngredients: pulse(0.24, 0.28, 0.42, 0.46, x),
		eyebrowBenefits: pulse(0.46, 0.5, 0.64, 0.68, x),
		marker: pulse(0.24, 0.28, 0.64, 0.68, x),
		step: smooth(0.42, 0.48, x),
		ingredients: stagger(0.26, 0.03, 0.02, 0.42, 0.46, x),
		benefits: stagger(0.48, 0.03, 0.02, 0.64, 0.68, x),
		glance: smooth(0.78, 0.82, x),
		five: smooth(0.8, 0.84, x),
		thirty: smooth(0.81, 0.85, x),
		with: smooth(0.85, 0.88, x),
		badges: [
			smooth(0.88, 0.91, x),
			smooth(0.89, 0.92, x),
			smooth(0.9, 0.93, x),
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
	/** extra height at the middle of the second half (a small hop: rolling out of the lying jar) */
	arc = 0,
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
		mix(inner[1], float[1], b) +
			arc * Math.sin(Math.PI * clamp01((t - 0.5) * 2)),
		mix(inner[2], float[2], b),
	];
}
