import { describe, expect, it } from "vitest";
import { freeStarts, lyingSpecs, standingSpecs } from "./gummyPaths";
import {
	AMBIENT,
	CAP_GROUND,
	CAP_HEIGHT,
	CAP_RADIUS,
	HERO_RAISE,
	POSES,
	project,
	TEXT_COLUMN,
	unitPosition,
} from "./poses";

const ASPECTS = [1.6, 16 / 9, 2];

describe("jar layout (D-96)", () => {
	it("green stands left of centre, pink lies front-right, overlapping about 25 % of the green jar", () => {
		for (const a of ASPECTS) {
			const g = POSES.desktop.green[0];
			const pk = POSES.desktop.pink[0];
			// mid-height of each jar, screen x of the green jar's two edges and of the pink jar's base
			const gl = project(
				"desktop",
				a,
				[g[0] - 1, 1.2, g[2]],
				HERO_RAISE.desktop,
			).x;
			const gr = project(
				"desktop",
				a,
				[g[0] + 1, 1.2, g[2]],
				HERO_RAISE.desktop,
			).x;
			const pl = project(
				"desktop",
				a,
				[pk[0], pk[1], pk[2]],
				HERO_RAISE.desktop,
			).x;
			const gc = (gl + gr) / 2;
			expect(gc, `green centre @${a}`).toBeLessThan(0.5);
			expect(pl, "pink starts right of the green centre").toBeGreaterThan(gc);
			const overlap = (gr - pl) / (gr - gl);
			expect(overlap, `overlap @${a}`).toBeGreaterThan(0.15);
			expect(overlap, `overlap @${a}`).toBeLessThan(0.4);
		}
	});
	it("the jars barely move between the hero and the settled pose", () => {
		for (const w of ["green", "pink"] as const) {
			const a = unitPosition("desktop", w, 0);
			const b = unitPosition("desktop", w, 1);
			expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeLessThan(0.6);
		}
	});
});

/** Text rectangles of the hero (x0, x1, y0, y1 as shares of the view), a little generous. */
const HERO_TEXT = [
	[0.07, 0.4, 0.28, 0.46], // "Restful"
	[0.6, 0.93, 0.28, 0.46], // "Sleep."
	[0.07, 0.4, 0.44, 0.52], // label line left
	[0.6, 0.93, 0.44, 0.52], // lines right
];

describe("floating gummies stay out of the hero text (D-101)", () => {
	it("no ambient gummy sits behind the headline or the label lines (desktop)", () => {
		for (const a of ASPECTS) {
			for (const sp of [...AMBIENT.desktop.green, ...AMBIENT.desktop.pink]) {
				const { x, y } = project(
					"desktop",
					a,
					[sp[0], sp[1], sp[2]],
					HERO_RAISE.desktop,
				);
				const r = 0.035; // about the gummy's radius, as a share of the width
				for (const [x0, x1, y0, y1] of HERO_TEXT) {
					const inside =
						x > x0 - r && x < x1 + r && y > y0 - r * 1.6 && y < y1 + r * 1.6;
					expect(
						inside,
						`gummy ${sp} @${a} at ${x.toFixed(2)},${y.toFixed(2)}`,
					).toBe(false);
				}
			}
		}
	});
});

/** Text rectangles of 4a/4b (x0, x1, y0, y1 as shares of the view). Desktop: two columns; phones: right-aligned blocks below, left ones above. */
const BLOCK_TEXT = {
	desktop: [
		[TEXT_COLUMN.left[0], TEXT_COLUMN.left[1], 0.26, 0.7],
		[TEXT_COLUMN.right[0], TEXT_COLUMN.right[1], 0.26, 0.7],
	],
	mobile: [
		[0.06, 0.55, 0.16, 0.42],
		[0.45, 0.94, 0.63, 0.9],
	],
} as const;
const LAYOUTS = [
	["desktop", ASPECTS],
	["mobile", [0.46, 0.6]],
] as const;

describe("caps rest on the ground, in view, clear of the 4a/4b text (D-109)", () => {
	for (const [layout, aspects] of LAYOUTS) {
		for (const which of ["green", "pink"] as const) {
			it(`${which} cap, ${layout}`, () => {
				const g = CAP_GROUND[layout][which];
				for (const a of aspects) {
					let x0 = 9;
					let x1 = -9;
					let y0 = 9;
					let y1 = -9;
					for (const dx of [-1, 1])
						for (const dy of [0, CAP_HEIGHT * g.scale])
							for (const dz of [-1, 1]) {
								const { x, y } = project(layout, a, [
									g.x + dx * CAP_RADIUS * g.scale,
									dy,
									g.z + dz * CAP_RADIUS * g.scale,
								]);
								x0 = Math.min(x0, x);
								x1 = Math.max(x1, x);
								y0 = Math.min(y0, y);
								y1 = Math.max(y1, y);
							}
					const where = `${which} ${layout} @${a}: x ${x0.toFixed(2)}-${x1.toFixed(2)}, y ${y0.toFixed(2)}-${y1.toFixed(2)}`;
					expect(x0, where).toBeGreaterThanOrEqual(0);
					expect(x1, where).toBeLessThanOrEqual(1);
					expect(y1, where).toBeLessThanOrEqual(1);
					for (const [tx0, tx1, ty0, ty1] of BLOCK_TEXT[layout]) {
						const overlap = x0 < tx1 && x1 > tx0 && y0 < ty1 && y1 > ty0;
						expect(overlap, where).toBe(false);
					}
				}
			});
		}
	}
	it("a cap is beside its jar, never under it", () => {
		for (const layout of ["desktop", "mobile"] as const) {
			for (const which of ["green", "pink"] as const) {
				const g = CAP_GROUND[layout][which];
				const u = unitPosition(layout, which, 1);
				const r = CAP_RADIUS * g.scale;
				if (which === "green")
					expect(Math.hypot(g.x - u[0], g.z - u[2])).toBeGreaterThan(1 + r);
				else {
					// the lying jar is 2.4 long along +x from its base at u and 1 wide: past its mouth, or in front of it
					const pastMouth = g.x - r > u[0] + 2.4;
					const inFront = g.z - r > u[2] + 1;
					expect(pastMouth || inFront, `${layout} pink cap`).toBe(true);
				}
			}
		}
	});
});

describe("crowd gummies stay out of the 4a/4b text (D-101, D-111)", () => {
	const clear = (x: number, y: number, r: number) =>
		(x - r > TEXT_COLUMN.left[1] && x + r < TEXT_COLUMN.right[0]) ||
		y - r >= 0.7;
	it("every crowd gummy ends in the centre band or below the text rows (desktop)", () => {
		for (const a of ASPECTS) {
			const g = unitPosition("desktop", "green", 1);
			const pk = unitPosition("desktop", "pink", 1);
			const ends = [
				...standingSpecs(18, 7, freeStarts("desktop", "green")).map(
					(s) => [s, g] as const,
				),
				...lyingSpecs(18, 21, freeStarts("desktop", "pink")).map(
					(s) => [s, pk] as const,
				),
			].map(([s, u]) => {
				const e = s.path[s.path.length - 1];
				return [u[0] + e[0], u[1] + e[1], u[2] + e[2]] as const;
			});
			for (const pt of ends) {
				const { x, y } = project("desktop", a, pt);
				expect(
					clear(x, y, 0.03),
					`${pt.map((n) => n.toFixed(2))} @${a} ${x.toFixed(2)},${y.toFixed(2)}`,
				).toBe(true);
			}
		}
	});
});
