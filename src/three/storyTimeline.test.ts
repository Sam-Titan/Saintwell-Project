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
	it("text is gone once the caps are lifting", () => {
		expect(timeline(0.12).text).toBe(0);
		expect(timeline(0.2).text).toBe(0);
	});
	it("cap lifts, gummies come out, then everything closes again", () => {
		expect(timeline(0.28).capLift).toBe(1);
		expect(timeline(0.6).gummyOut).toBe(1);
		expect(timeline(0.6).capLift).toBe(1);
		expect(timeline(0.88).gummyOut).toBe(0);
		expect(timeline(1).capLift).toBe(0);
		expect(timeline(1).gummyOut).toBe(0);
	});
	it("gummies are out of the neck before the cap closes", () => {
		expect(timeline(0.88).gummyOut).toBe(0);
		expect(timeline(0.88).capLift).toBeGreaterThan(0.99);
	});
	it("jars face front while open", () => {
		expect(timeline(0.5).spin).toBe(0);
		expect(timeline(1).spin).toBe(1);
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
