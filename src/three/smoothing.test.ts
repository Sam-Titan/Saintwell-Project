import { describe, expect, it } from "vitest";
import { PROGRESS_SPRING } from "./smoothing";

/** Step response of the spring (semi-implicit Euler, 1 ms steps). */
function step(seconds: number) {
	const { stiffness: k, damping: c, mass: m } = PROGRESS_SPRING;
	let x = 0;
	let v = 0;
	let max = 0;
	for (let t = 0; t < seconds; t += 0.001) {
		v += ((k * (1 - x) - c * v) / m) * 0.001;
		x += v * 0.001;
		max = Math.max(max, x);
	}
	return { x, max };
}

describe("progress smoothing (D-100)", () => {
	it("is critically damped", () => {
		const { stiffness: k, damping: c, mass: m } = PROGRESS_SPRING;
		expect(c).toBeCloseTo(2 * Math.sqrt(k * m), 1);
	});
	it("eases to a jump within about a quarter to a half second, without overshoot", () => {
		expect(step(0.25).x).toBeGreaterThan(0.85);
		expect(step(0.6).x).toBeGreaterThan(0.99);
		expect(step(3).max).toBeLessThanOrEqual(1.001);
	});
});
