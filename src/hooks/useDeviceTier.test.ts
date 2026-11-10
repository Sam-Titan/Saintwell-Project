import { describe, expect, it } from "vitest";
import { isSoftwareRenderer, pickTier, tierFromUrl } from "./useDeviceTier";

const base = { webgl: true, coarsePointer: false };

describe("pickTier", () => {
	it("none without WebGL", () => {
		expect(pickTier({ ...base, webgl: false })).toBe("none");
	});
	it("high when nothing is reported (Safari/Firefox)", () => {
		expect(pickTier(base)).toBe("high");
		expect(pickTier({ ...base, coarsePointer: true })).toBe("high");
	});
	it("desktop with 4 GB / 4 cores stays high", () => {
		expect(pickTier({ ...base, deviceMemory: 4, hardwareConcurrency: 4 })).toBe(
			"high",
		);
	});
	it("low for 2 GB or 2 cores", () => {
		expect(pickTier({ ...base, deviceMemory: 2 })).toBe("low");
		expect(pickTier({ ...base, hardwareConcurrency: 2 })).toBe("low");
	});
	it("coarse pointer with 4 GB or 4 cores is low", () => {
		expect(pickTier({ ...base, coarsePointer: true, deviceMemory: 4 })).toBe(
			"low",
		);
		expect(
			pickTier({ ...base, coarsePointer: true, hardwareConcurrency: 4 }),
		).toBe("low");
	});
	it("strong phone is high", () => {
		expect(
			pickTier({
				...base,
				coarsePointer: true,
				deviceMemory: 8,
				hardwareConcurrency: 8,
			}),
		).toBe("high");
	});
});

describe("software renderer", () => {
	it("detects SwiftShader, llvmpipe and Software", () => {
		expect(
			isSoftwareRenderer(
				"ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader driver)",
			),
		).toBe(true);
		expect(isSoftwareRenderer("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe(true);
		expect(isSoftwareRenderer("Microsoft Basic Render Driver Software")).toBe(
			true,
		);
		expect(isSoftwareRenderer("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060)")).toBe(
			false,
		);
		expect(isSoftwareRenderer("")).toBe(false);
		expect(isSoftwareRenderer(undefined)).toBe(false);
	});
	it("software renderer means tier none, even on a strong device", () => {
		expect(
			pickTier({
				...base,
				renderer: "llvmpipe",
				deviceMemory: 16,
				hardwareConcurrency: 16,
			}),
		).toBe("none");
	});
	it("real GPU stays high", () => {
		expect(pickTier({ ...base, renderer: "ANGLE (Apple, Apple M2)" })).toBe(
			"high",
		);
	});
});

describe("tierFromUrl", () => {
	it("reads ?tier=", () => {
		expect(tierFromUrl("?tier=low")).toBe("low");
		expect(tierFromUrl("?tier=none")).toBe("none");
		expect(tierFromUrl("?tier=x")).toBeNull();
		expect(tierFromUrl("")).toBeNull();
	});
});
