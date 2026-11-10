import { describe, expect, it } from "vitest";
import { labelCoverage, labelTransform, maskTransform } from "./labelFit";

// Band size from blender/build_jar.py (label radius 1.008, height 1.8)
const R = 1.008;
const H = 1.8;
// Label sizes from public/textures/labels/*-2048.webp
const labels = {
	"green-a": [2048, 772],
	"green-b": [2048, 699],
	"pink-a": [2048, 745],
	"pink-b": [2048, 614],
} as const;

describe("label fit", () => {
	it("widest label (pink-b) almost wraps, narrowest (green-a) does not", () => {
		const [pw, ph] = labels["pink-b"];
		const [gw, gh] = labels["green-a"];
		expect(labelCoverage(pw / ph, H, R)).toBeGreaterThan(0.9);
		expect(labelCoverage(pw / ph, H, R)).toBeLessThan(1);
		expect(labelCoverage(gw / gh, H, R)).toBeLessThan(0.8);
	});

	it("never stretches: covered arc length / band height = label aspect", () => {
		for (const [w, h] of Object.values(labels)) {
			const arc = labelCoverage(w / h, H, R) * 2 * Math.PI * R;
			expect(arc / H).toBeCloseTo(w / h, 6);
		}
	});

	it("never covers more than the full circle", () => {
		expect(labelCoverage(10, H, R)).toBe(1);
	});

	it("centres the label at the front (u = 0.5) and maps its edges to texture 0..1", () => {
		for (const f of [0.75, 0.9, 1]) {
			const { repeatX, offsetX } = labelTransform(f);
			expect(0.5 * repeatX + offsetX).toBeCloseTo(0.5, 9);
			expect((0.5 - f / 2) * repeatX + offsetX).toBeCloseTo(0, 9);
			expect((0.5 + f / 2) * repeatX + offsetX).toBeCloseTo(1, 9);
		}
	});

	it("mask is opaque exactly where the label is (middle texel of 3)", () => {
		for (const f of [0.75, 0.9, 1]) {
			const { repeatX, offsetX } = maskTransform(f);
			expect((0.5 - f / 2) * repeatX + offsetX).toBeCloseTo(1 / 3, 9);
			expect((0.5 + f / 2) * repeatX + offsetX).toBeCloseTo(2 / 3, 9);
		}
	});
});
