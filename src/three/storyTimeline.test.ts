import { describe, expect, it } from "vitest";
import {
	ANCHORS,
	backgroundAt,
	COLOURS,
	clamp01,
	easeOutBack,
	gummyPath,
	gummyProgress,
	rgbCss,
	timeline,
} from "./storyTimeline";

const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);

describe("scenes", () => {
	it("1 hero: closed, headline and furniture visible, cream, nothing else", () => {
		const t = timeline(0);
		expect(t.hero).toBe(1);
		expect(t.capLift).toBe(0);
		expect(t.greenOut).toBe(0);
		expect(t.pinkOut).toBe(0);
		expect(t.focus).toBe(0);
		expect(t.dark).toBe(0);
		expect(t.word).toBe(1);
		expect(sum(t.ingredients) + sum(t.benefits) + sum(t.badges)).toBe(0);
		expect(rgbCss(backgroundAt(0))).toBe(rgbCss(COLOURS.cream));
	});
	it("2 spin and settle: headline is gone before the caps lift; jars face front before opening", () => {
		expect(timeline(0.15).hero).toBe(0);
		expect(timeline(0.18).capLift).toBe(0);
		expect(timeline(0.2).spin).toBe(0);
		expect(timeline(0.2).settle).toBeCloseTo(1, 1);
	});
	it("settle bounces: it overshoots 1 a little, then rests at 1", () => {
		let max = 0;
		for (let i = 0; i <= 1000; i++)
			max = Math.max(max, timeline(i / 1000).settle);
		expect(max).toBeGreaterThan(1);
		expect(max).toBeLessThan(1.15);
		expect(timeline(0.5).settle).toBeCloseTo(1, 5);
		expect(easeOutBack(0)).toBeCloseTo(0, 5);
		expect(easeOutBack(1)).toBeCloseTo(1, 5);
	});
	it("3 open: caps up, both sets of gummies out by the time the hero gummy starts", () => {
		const t = timeline(0.34);
		expect(t.capLift).toBe(1);
		expect(t.greenOut).toBe(1);
		expect(t.pinkOut).toBe(1);
	});
	it("4a: olive, green hero, 4 blocks and the INGREDIENTS eyebrow, nothing from 4b", () => {
		const t = timeline(ANCHORS.ingredients);
		expect(rgbCss(backgroundAt(ANCHORS.ingredients))).toBe(
			rgbCss(COLOURS.olive),
		);
		expect(t.greenHero).toBe(1);
		expect(t.pinkHero).toBe(0);
		expect(t.focus).toBe(1);
		expect(t.ingredients).toEqual([1, 1, 1, 1]);
		expect(t.eyebrowIngredients).toBe(1);
		expect(sum(t.benefits)).toBe(0);
		expect(t.eyebrowBenefits).toBe(0);
		expect(t.step).toBe(0);
		expect(t.marker).toBe(1);
	});
	it("4b: maroon, pink hero, 4 blocks and the BENEFITS eyebrow, nothing from 4a", () => {
		const t = timeline(ANCHORS.benefits);
		expect(rgbCss(backgroundAt(ANCHORS.benefits))).toBe(rgbCss(COLOURS.maroon));
		expect(t.pinkHero).toBe(1);
		expect(t.greenHero).toBe(0);
		expect(t.benefits).toEqual([1, 1, 1, 1]);
		expect(t.eyebrowBenefits).toBe(1);
		expect(sum(t.ingredients)).toBe(0);
		expect(t.step).toBe(1);
	});
	it("a block set is never shown together with the other one", () => {
		for (let i = 0; i <= 2000; i++) {
			const t = timeline(i / 2000);
			expect(Math.min(sum(t.ingredients), sum(t.benefits))).toBe(0);
			expect(Math.min(t.greenHero + t.pinkHero, 1)).toBeLessThanOrEqual(1);
		}
	});
	it("5 return: gummies and caps are back before the Numbers", () => {
		const t = timeline(0.82);
		expect(t.greenOut).toBe(0);
		expect(t.pinkOut).toBe(0);
		expect(t.capLift).toBe(0);
		expect(t.focus).toBe(0);
		expect(rgbCss(backgroundAt(0.82))).toBe(rgbCss(COLOURS.darkOlive));
	});
	it("6 Numbers: everything shows at the anchor, jars veiled, background word gone", () => {
		const t = timeline(ANCHORS.numbers);
		expect(t.glance).toBe(1);
		expect(t.five).toBe(1);
		expect(t.thirty).toBe(1);
		expect(t.with).toBe(1);
		expect(t.badges).toEqual([1, 1, 1]);
		expect(t.veil).toBe(1);
		expect(t.word).toBe(0);
		expect(t.dark).toBe(1);
	});
	it("numbers appear in order: 5 mg, 30, with..., badges one after another", () => {
		const t = timeline(0.92);
		expect(t.five).toBeGreaterThanOrEqual(t.thirty);
		expect(t.thirty).toBeGreaterThanOrEqual(t.with);
		expect(t.badges[0]).toBeGreaterThanOrEqual(t.badges[1]);
		expect(t.badges[1]).toBeGreaterThanOrEqual(t.badges[2]);
	});
	it("anchors land in the right scene", () => {
		expect(ANCHORS.ingredients).toBeGreaterThan(0.32);
		expect(ANCHORS.ingredients).toBeLessThan(0.52);
		expect(ANCHORS.benefits).toBeGreaterThan(0.52);
		expect(ANCHORS.benefits).toBeLessThan(0.72);
		expect(ANCHORS.numbers).toBeLessThanOrEqual(1);
	});
});

describe("timeline basics", () => {
	it("clamps out-of-range progress", () => {
		expect(timeline(-1)).toEqual(timeline(0));
		expect(timeline(2)).toEqual(timeline(1));
		expect(clamp01(3)).toBe(1);
	});
	it("is a pure function (same p, same answer, either scroll direction)", () => {
		const a = [0.2, 0.5, 0.9].map((p) => timeline(p));
		timeline(0.7);
		expect([0.2, 0.5, 0.9].map((p) => timeline(p))).toEqual(a);
	});
	it("is continuous (no jumps between close steps)", () => {
		let prev = timeline(0);
		for (let i = 1; i <= 2000; i++) {
			const t = timeline(i / 2000);
			for (const k of [
				"hero",
				"capLift",
				"greenOut",
				"pinkOut",
				"greenHero",
				"pinkHero",
				"dark",
				"veil",
				"glance",
				"five",
				"thirty",
				"with",
				"step",
			] as const) {
				expect(Math.abs(t[k] - prev[k]), k).toBeLessThan(0.05);
			}
			for (let q = 0; q < 4; q++) {
				expect(Math.abs(t.ingredients[q] - prev.ingredients[q])).toBeLessThan(
					0.08,
				);
				expect(Math.abs(t.benefits[q] - prev.benefits[q])).toBeLessThan(0.08);
			}
			prev = t;
		}
	});
	it("background colour is continuous and stays between the brand colours", () => {
		let prev = backgroundAt(0);
		for (let i = 1; i <= 1000; i++) {
			const c = backgroundAt(i / 1000);
			for (let k = 0; k < 3; k++)
				expect(Math.abs(c[k] - prev[k])).toBeLessThan(4);
			prev = c;
		}
	});
	it("cap wobble is small and zero when closed or fully open", () => {
		expect(timeline(0).wobble).toBe(0);
		expect(timeline(0.3).wobble).toBeCloseTo(0, 5);
		for (let i = 0; i <= 1000; i++)
			expect(Math.abs(timeline(i / 1000).wobble)).toBeLessThan(0.06);
	});
});

describe("gummies", () => {
	it("first gummy leaves before the last", () => {
		expect(gummyProgress(0.3, 0, 10)).toBeGreaterThan(
			gummyProgress(0.3, 9, 10),
		);
	});
	it("all gummies are fully out at out = 1 and fully in at 0", () => {
		for (let i = 0; i < 10; i++) {
			expect(gummyProgress(1, i, 10)).toBe(1);
			expect(gummyProgress(0, i, 10)).toBe(0);
		}
	});
	it("path starts at rest, passes the neck, ends at float", () => {
		const rest = [0.2, 1, 0.1] as const;
		const neck = [0, 2.5, 0] as const;
		const float = [1.5, 4, 0.5] as const;
		expect(gummyPath(0, rest, neck, float)).toEqual([...rest]);
		expect(gummyPath(0.5, rest, neck, float)).toEqual([...neck]);
		expect(gummyPath(1, rest, neck, float)).toEqual([...float]);
	});
	it("a rolling arc hops in the second half and still ends on the ground", () => {
		const rest = [0, 0, 0] as const;
		const mouth = [1, 0, 0] as const;
		const ground = [3, -1, 0] as const;
		expect(gummyPath(1, rest, mouth, ground, 0.5)[1]).toBeCloseTo(-1, 5);
		expect(gummyPath(0.75, rest, mouth, ground, 0.5)[1]).toBeGreaterThan(
			gummyPath(0.75, rest, mouth, ground, 0)[1],
		);
	});
});
