import { describe, expect, it } from "vitest";
import { lying, standing } from "./Gummies";
import {
	AMBIENT,
	CAP_STASH,
	CAP_STASH_SCALE,
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

describe("caps and crowd stay out of the 4a/4b text columns (D-101)", () => {
	const inColumn = (x: number, r: number) =>
		TEXT_COLUMN.left[1] > x - r && TEXT_COLUMN.left[0] < x + r
			? true
			: TEXT_COLUMN.right[1] > x - r && TEXT_COLUMN.right[0] < x + r;
	it("tucked caps are inside the centre band", () => {
		for (const a of ASPECTS) {
			for (const w of ["green", "pink"] as const) {
				const { x } = project("desktop", a, CAP_STASH[w]);
				// cap radius 1 * stash scale, as a share of the view width, at that depth
				const edge = project("desktop", a, [
					CAP_STASH[w][0] + CAP_STASH_SCALE,
					CAP_STASH[w][1],
					CAP_STASH[w][2],
				]).x;
				expect(
					inColumn(x, Math.abs(edge - x)),
					`cap ${w} @${a} x=${x.toFixed(2)}`,
				).toBe(false);
			}
		}
	});
	it("every crowd gummy floats / rests inside the centre band once the jars have settled", () => {
		for (const a of ASPECTS) {
			const g = unitPosition("desktop", "green", 1);
			const pk = unitPosition("desktop", "pink", 1);
			const pts = [
				...standing(18, 7)
					.map((s) => s.float)
					.map((f) => [g[0] + f[0], g[1] + f[1], g[2] + f[2]] as const),
				...lying(18, 21)
					.map((s) => s.float)
					.map((f) => [pk[0] + f[0], pk[1] + f[1], pk[2] + f[2]] as const),
			];
			for (const pt of pts) {
				const { x } = project("desktop", a, pt);
				expect(
					inColumn(x, 0.03),
					`${pt.map((n) => n.toFixed(2))} @${a} x=${x.toFixed(2)}`,
				).toBe(false);
			}
		}
	});
});
