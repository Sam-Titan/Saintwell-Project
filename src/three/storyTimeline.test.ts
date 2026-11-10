import { describe, expect, it } from "vitest";
import { gummyPath, gummyProgress, timeline } from "./storyTimeline";

describe("timeline", () => {
	it("starts closed, turning, text visible", () => {
		const t = timeline(0);
		expect(t.capLift).toBe(0);
		expect(t.gummyOut).toBe(0);
		expect(t.spin).toBe(1);
		expect(t.text).toBe(1);
	});
	it("text is gone before the caps lift", () => {
		expect(timeline(0.1).text).toBe(0);
		expect(timeline(0.2).text).toBe(0);
	});
	it("cap lifts, gummies come out, then everything closes again", () => {
		expect(timeline(0.22).capLift).toBe(1);
		expect(timeline(0.5).gummyOut).toBe(1);
		expect(timeline(0.5).capLift).toBe(1);
		expect(timeline(0.84).gummyOut).toBe(0);
		expect(timeline(1).capLift).toBe(0);
		expect(timeline(1).gummyOut).toBe(0);
	});
	it("gummies are back in before the cap closes", () => {
		expect(timeline(0.84).gummyOut).toBe(0);
		expect(timeline(0.84).capLift).toBeGreaterThan(0.5);
		expect(timeline(0.82).capLift).toBe(1);
	});
	it("jars face front while open and turn again at the end", () => {
		expect(timeline(0.5).spin).toBe(0);
		expect(timeline(1).spin).toBe(1);
	});
	it("night: day at the start and end, full night in the middle", () => {
		expect(timeline(0).night).toBe(0);
		expect(timeline(0.05).night).toBe(0);
		expect(timeline(0.14).night).toBe(1);
		expect(timeline(0.5).night).toBe(1);
		expect(timeline(0.86).night).toBe(1);
		expect(timeline(0.94).night).toBe(0);
		expect(timeline(1).night).toBe(0);
	});
	it("cards: one at a time in order, hidden outside the ingredients part", () => {
		const centres = [0.375, 0.445, 0.515];
		centres.forEach((c, i) => {
			const t = timeline(c).cards;
			expect(t[i]).toBe(1);
			expect(t.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
		});
		for (const p of [0, 0.2, 0.3, 0.6, 0.7, 1]) {
			expect(timeline(p).cards).toEqual([0, 0, 0]);
		}
	});
	it("benefits: one at a time in order, never together with a card", () => {
		const centres = [0.635, 0.685, 0.735];
		centres.forEach((c, i) => {
			const t = timeline(c).benefits;
			expect(t[i]).toBe(1);
			expect(t.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
		});
		for (const p of [0, 0.3, 0.5, 0.8, 1]) {
			expect(timeline(p).benefits).toEqual([0, 0, 0]);
		}
		for (let i = 0; i <= 1000; i++) {
			const t = timeline(i / 1000);
			const c = t.cards.reduce((a, b) => a + b, 0);
			const b = t.benefits.reduce((a, b2) => a + b2, 0);
			expect(Math.min(c, b)).toBe(0);
			expect(Math.max(...t.cards, ...t.benefits)).toBeLessThanOrEqual(1);
		}
	});
	it("badges: staggered in during the morning and stay at the end", () => {
		expect(timeline(0.86).badges).toEqual([0, 0, 0]);
		const mid = timeline(0.93).badges;
		expect(mid[0]).toBe(1);
		expect(mid[1]).toBeGreaterThan(mid[2]);
		expect(timeline(1).badges).toEqual([1, 1, 1]);
	});
	it("is a pure function (same p, same answer, either scroll direction)", () => {
		const up = [0.2, 0.5, 0.9].map((p) => timeline(p));
		timeline(0.7);
		expect([0.2, 0.5, 0.9].map((p) => timeline(p))).toEqual(up);
	});
	it("clamps out-of-range progress", () => {
		expect(timeline(-1)).toEqual(timeline(0));
		expect(timeline(2)).toEqual(timeline(1));
	});
	it("is continuous (no jump between close steps)", () => {
		let prev = timeline(0);
		for (let i = 1; i <= 1000; i++) {
			const t = timeline(i / 1000);
			expect(Math.abs(t.capLift - prev.capLift)).toBeLessThan(0.03);
			expect(Math.abs(t.gummyOut - prev.gummyOut)).toBeLessThan(0.03);
			expect(Math.abs(t.night - prev.night)).toBeLessThan(0.03);
			for (let k = 0; k < 3; k++) {
				expect(Math.abs(t.cards[k] - prev.cards[k])).toBeLessThan(0.05);
				expect(Math.abs(t.benefits[k] - prev.benefits[k])).toBeLessThan(0.05);
				expect(Math.abs(t.badges[k] - prev.badges[k])).toBeLessThan(0.05);
			}
			prev = t;
		}
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
});
