import { describe, expect, it } from "vitest";
import {
	freeCount,
	freeStarts,
	GROUND_Y,
	gummyRadius,
	gummyState,
	JAR_LENGTH,
	lyingSpecs,
	standingSpecs,
	TILT_MAX,
	touchesWall,
	wallInner,
} from "./gummyPaths";
import { timeline } from "./storyTimeline";

const COUNTS = [8, 18];
const SEEDS = [7, 21, 3, 99, 1234];

/** every gummy's position at many steps of `out` (0..1) */
function walk(
	specs: ReturnType<typeof lyingSpecs>,
	n: number,
	each: (i: number, pos: readonly number[], scale: number) => void,
) {
	specs.forEach((sp, i) => {
		for (let k = 0; k <= 400; k++) {
			const st = gummyState(sp, i, n, k / 400, 0, 0);
			each(i, st.pos, sp.scale);
		}
	});
}

describe("pink spill (D-111): no gummy touches the lying jar's body", () => {
	for (const n of COUNTS)
		for (const seed of SEEDS)
			it(`n=${n} seed=${seed}`, () => {
				const specs = lyingSpecs(n, seed, freeStarts("desktop", "pink"));
				walk(specs, n, (i, [x, y, z], scale) => {
					const rg = gummyRadius(scale);
					// the jar's axis is along +x at y = z = 0
					const r = Math.hypot(y, z);
					expect(
						touchesWall(x, r, rg),
						`gummy ${i} at ${[x, y, z].map((v) => v.toFixed(2))} touches the wall`,
					).toBe(false);
					// the ground
					expect(y).toBeGreaterThanOrEqual(GROUND_Y - 0.02);
				});
			});
	it("leaves through the mouth: past the mouth plane it is inside the neck", () => {
		const specs = lyingSpecs(18, 21, freeStarts("desktop", "pink"));
		walk(specs, 18, (i, [x, y, z], scale) => {
			if (x > 2.2 && x < JAR_LENGTH + 0.3 && Math.hypot(y, z) < 1.2)
				expect(Math.hypot(y, z) + gummyRadius(scale)).toBeLessThanOrEqual(
					wallInner(JAR_LENGTH) + 1e-6,
				);
			void i;
		});
	});
	it("lands on the ground beside the jar, in front of it", () => {
		const specs = lyingSpecs(18, 21, freeStarts("desktop", "pink"));
		for (const sp of specs) {
			const e = sp.path[sp.path.length - 1];
			expect(e[1]).toBeCloseTo(GROUND_Y);
			expect(Math.abs(e[2])).toBeGreaterThan(1.5);
		}
	});
});

describe("green gummies leave the standing jar through its neck and never touch the body", () => {
	for (const n of COUNTS)
		for (const seed of SEEDS)
			it(`n=${n} seed=${seed}`, () => {
				const specs = standingSpecs(n, seed, freeStarts("desktop", "green"));
				walk(specs, n, (i, [x, y, z], scale) => {
					const rg = gummyRadius(scale);
					expect(
						touchesWall(y, Math.hypot(x, z), rg),
						`gummy ${i} at ${[x, y, z].map((v) => v.toFixed(2))}`,
					).toBe(false);
				});
			});
});

describe("fixed count, nothing fades or shrinks (D-110)", () => {
	it("every gummy keeps its size at every p; only the hero's seat is empty, only while its hero is out", () => {
		for (const n of COUNTS) {
			for (const colour of ["green", "pink"] as const) {
				const free = freeStarts("desktop", colour);
				const specs =
					colour === "green"
						? standingSpecs(n, 7, free)
						: lyingSpecs(n, 21, free);
				expect(specs.length).toBe(n);
				for (let k = 0; k <= 200; k++) {
					const tl = timeline(k / 200);
					const out = colour === "green" ? tl.greenOut : tl.pinkOut;
					const hero = colour === "green" ? tl.greenHero : tl.pinkHero;
					specs.forEach((sp, i) => {
						const st = gummyState(sp, i, n, out, hero, 3);
						const empty = i === 0 && hero > 0.001;
						expect(st.scale, `p=${k / 200} gummy ${i}`).toBe(
							empty ? 0 : sp.scale,
						);
					});
				}
			}
		}
	});
	it("the number of free (hero-shot) gummies is the same on every tier", () => {
		expect(freeCount(8)).toBe(2);
		expect(freeCount(18)).toBe(2);
	});
	it("the hero's seat does not bob, so the hero takes off from the exact spot", () => {
		const sp = standingSpecs(18, 7, freeStarts("desktop", "green"));
		const a = gummyState(sp[0], 0, 18, 1, 0, 1).pos;
		const b = gummyState(sp[0], 0, 18, 1, 0, 5.3).pos;
		expect(a).toEqual(b);
	});
	it("tilt stays small: mostly yaw, base always down", () => {
		const sp = lyingSpecs(18, 21, freeStarts("desktop", "pink"));
		sp.forEach((s, i) => {
			for (let k = 0; k <= 50; k++) {
				const st = gummyState(s, i, 18, k / 50, 0, k * 0.37);
				expect(Math.abs(st.tiltX)).toBeLessThanOrEqual(TILT_MAX + 1e-9);
				expect(Math.abs(st.tiltZ)).toBeLessThanOrEqual(TILT_MAX + 1e-9);
			}
		});
	});
});
