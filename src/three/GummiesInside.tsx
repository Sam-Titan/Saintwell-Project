import { useMemo } from "react";
import * as THREE from "three";
import type { JarColour } from "../theme/tokens";
import { Gummies } from "./Gummies";

/** Fixed pseudo-random numbers (same gummy layout every load). */
function rng(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296;
		return s / 4294967296;
	};
}

/** Gummies resting inside the jar cavity (jar units: radius 1, inside height about 0.3 to 2.0). */
export function GummiesInside({
	colour,
	count,
}: {
	colour: JarColour;
	count: number;
}) {
	const transforms = useMemo(() => {
		const r = rng(7);
		const out: THREE.Matrix4[] = [];
		for (let i = 0; i < count; i++) {
			const angle = r() * Math.PI * 2;
			const radius = Math.sqrt(r()) * 0.66;
			const y = 0.32 + (i / count) * 1.35 + r() * 0.12;
			const q = new THREE.Quaternion().setFromEuler(
				new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28),
			);
			out.push(
				new THREE.Matrix4().compose(
					new THREE.Vector3(
						Math.cos(angle) * radius,
						y,
						Math.sin(angle) * radius,
					),
					q,
					new THREE.Vector3(1, 1, 1),
				),
			);
		}
		return out;
	}, [count]);
	return <Gummies colour={colour} transforms={transforms} />;
}
