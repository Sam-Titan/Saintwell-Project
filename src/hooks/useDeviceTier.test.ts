import { describe, expect, it } from "vitest";
import { pickTier, tierFromUrl } from "./useDeviceTier";

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

describe("tierFromUrl", () => {
	it("reads ?tier=", () => {
		expect(tierFromUrl("?tier=low")).toBe("low");
		expect(tierFromUrl("?tier=none")).toBe("none");
		expect(tierFromUrl("?tier=x")).toBeNull();
		expect(tierFromUrl("")).toBeNull();
	});
});
