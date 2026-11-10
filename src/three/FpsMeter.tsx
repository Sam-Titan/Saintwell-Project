import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";

/** Scenes by progress, for the per-scene numbers (see storyTimeline.ts). */
const SCENES: [string, number][] = [
	["1-2 hero+settle", 0.08],
	["3 open", 0.2],
	["4a ingredients", 0.44],
	["4b benefits", 0.68],
	["5 return", 0.78],
	["6 numbers", 1.01],
];

/**
 * Tiny frame-rate readout, only with `?fps=1` (D-99). r3f-perf stays dev only, so this is how fps is read on
 * the production preview (`just preview`): a box in the corner plus min / average per scene in the console
 * (`window.__fps`).
 */
export function FpsMeter({ progress }: { progress: MotionValue<number> }) {
	const box = useRef<HTMLDivElement | null>(null);
	const acc = useRef({ t: 0, n: 0 });
	const stats = useRef<Record<string, { min: number; sum: number; n: number }>>(
		{},
	);
	useEffect(() => {
		const el = document.createElement("div");
		el.style.cssText =
			"position:fixed;left:8px;bottom:8px;z-index:99;background:#000c;color:#fff;font:12px monospace;padding:4px 8px;border-radius:4px;pointer-events:none";
		document.body.appendChild(el);
		box.current = el;
		return () => el.remove();
	}, []);
	useFrame((_, delta) => {
		const a = acc.current;
		a.t += delta;
		a.n++;
		if (a.t < 1) return;
		const fps = a.n / a.t;
		a.t = 0;
		a.n = 0;
		const p = progress.get();
		const name = (SCENES.find(([, end]) => p < end) ?? SCENES[5])[0];
		const s = stats.current[name] ?? { min: 999, sum: 0, n: 0 };
		stats.current[name] = s;
		s.min = Math.min(s.min, fps);
		s.sum += fps;
		s.n++;
		(window as unknown as { __fps: unknown }).__fps = Object.fromEntries(
			Object.entries(stats.current).map(([k, v]) => [
				k,
				{ min: Math.round(v.min), avg: Math.round(v.sum / v.n) },
			]),
		);
		if (box.current)
			box.current.textContent = `${Math.round(fps)} fps · ${name} · p ${p.toFixed(2)}`;
	});
	return null;
}
