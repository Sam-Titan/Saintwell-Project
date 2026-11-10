import { describe, expect, it } from "vitest";
import { themes } from "./tokens";

/** WCAG 2 contrast ratio between two #rrggbb colours. */
function lum(hex: string) {
	const c = [1, 3, 5]
		.map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string) {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
/** Average of two colours (the middle of the olive to maroon blend). */
function mix(a: string, b: string) {
	const p = (h: string, i: number) => Number.parseInt(h.slice(i, i + 2), 16);
	const ch = (i: number) =>
		Math.round((p(a, i) + p(b, i)) / 2)
			.toString(16)
			.padStart(2, "0");
	return `#${ch(1)}${ch(3)}${ch(5)}`;
}

describe("story colours (D-68)", () => {
	const olive = themes.green.night;
	const maroon = themes.pink.night;
	it("white text passes AA on olive, maroon and the blend between them", () => {
		for (const bg of [olive, maroon, mix(olive, maroon)]) {
			expect(ratio("#ffffff", bg)).toBeGreaterThanOrEqual(4.5);
		}
	});
	it("olive text passes AA on cream (badges, static sections)", () => {
		expect(ratio(olive, themes.green.cream)).toBeGreaterThanOrEqual(4.5);
	});
	it("pink on maroon passes AA; sage on olive only the 3:1 level for borders and icons", () => {
		expect(ratio(themes.pink.accent, maroon)).toBeGreaterThanOrEqual(4.5);
		expect(ratio(themes.green.accent, olive)).toBeGreaterThanOrEqual(3);
		expect(ratio(themes.green.accent, olive)).toBeLessThan(4.5);
	});
});
