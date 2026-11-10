export type Tier = "high" | "low" | "none";

export type TierSignals = {
	/** false when no WebGL context can be created */
	webgl: boolean;
	/** navigator.deviceMemory in GB; undefined when the browser does not report it (Safari, Firefox) */
	deviceMemory?: number;
	hardwareConcurrency?: number;
	coarsePointer: boolean;
	/** WEBGL_debug_renderer_info unmasked renderer, when available */
	renderer?: string;
};

/** True for CPU-only WebGL (SwiftShader, llvmpipe, "Software"): too slow for the 3D scene. */
export function isSoftwareRenderer(renderer?: string): boolean {
	return (
		renderer !== undefined && /swiftshader|llvmpipe|software/i.test(renderer)
	);
}

/** Pure tier rules (D-48). A missing value means "unknown", never "weak". */
export function pickTier(s: TierSignals): Tier {
	if (!s.webgl || isSoftwareRenderer(s.renderer)) return "none";
	const mem = s.deviceMemory;
	const cores = s.hardwareConcurrency;
	const veryWeak =
		(mem !== undefined && mem <= 2) || (cores !== undefined && cores <= 2);
	const modest =
		(mem !== undefined && mem <= 4) || (cores !== undefined && cores <= 4);
	return veryWeak || (s.coarsePointer && modest) ? "low" : "high";
}

/** Read `?tier=high|low|none` (testing override). */
export function tierFromUrl(search: string): Tier | null {
	const v = new URLSearchParams(search).get("tier");
	return v === "high" || v === "low" || v === "none" ? v : null;
}

/** Returns null without WebGL, otherwise the renderer name ("" when the browser hides it). */
function webglRenderer(): string | null {
	try {
		const c = document.createElement("canvas");
		const gl = c.getContext("webgl2") ?? c.getContext("webgl");
		if (!gl) return null;
		const ext = gl.getExtension("WEBGL_debug_renderer_info");
		return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
	} catch {
		return null;
	}
}

let cached: Tier | null = null;

function detect(): Tier {
	const override = tierFromUrl(window.location.search);
	if (override) return override;
	// deviceMemory is not in lib.dom types
	const nav = navigator as Navigator & { deviceMemory?: number };
	const renderer = webglRenderer();
	return pickTier({
		webgl: renderer !== null,
		renderer: renderer ?? undefined,
		deviceMemory: nav.deviceMemory,
		hardwareConcurrency: navigator.hardwareConcurrency,
		coarsePointer: window.matchMedia("(pointer: coarse)").matches,
	});
}

/** high / low / none, computed once per page load. */
export function useDeviceTier(): Tier {
	if (cached === null) cached = detect();
	return cached;
}

/** Settings that depend on the tier (SPEC section 5). */
export function tierSettings(tier: Tier) {
	const high = tier === "high";
	return {
		textureSize: (high ? 2048 : 1024) as 1024 | 2048,
		gummyCount: high ? 18 : 8,
		transmission: high,
		dpr: (high ? [1, 1.5] : [1, 1]) as [number, number],
	};
}
