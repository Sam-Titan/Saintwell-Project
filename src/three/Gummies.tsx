import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { JarColour } from "../theme/tokens";
import { jarColours } from "./looks";
import { rng } from "./random";
import { gummyPath, gummyProgress, timeline, type Vec3 } from "./storyTimeline";

type GummyGLTF = { nodes: { Gummy: THREE.Mesh } };

type Gummy = {
	rest: Vec3;
	float: Vec3;
	spin: Vec3;
	phase: number;
	scale: number;
};

/** Which way each card pulls its gummies (jar units, x): card 1 left, card 2 right, card 3 left. */
const CARD_SIDE = [-1, 1, -1] as const;
const CARD_PULL = 1.1;

/** Jar units: radius 1, neck opening at y ~2.45, cap lifts to ~3.9. */
const NECK: Vec3 = [0, 2.5, 0];

function layout(count: number, seed: number): Gummy[] {
	const r = rng(seed);
	return Array.from({ length: count }, (_, i) => {
		const a = r() * Math.PI * 2;
		const rad = Math.sqrt(r()) * 0.62;
		const rest: Vec3 = [
			Math.cos(a) * rad,
			0.34 + (i / count) * 1.4 + r() * 0.12,
			Math.sin(a) * rad,
		];
		// float on a ring around the axis, clear of the lifted cap (radius 0.93)
		const fa = (i / count) * Math.PI * 2 + r() * 0.5;
		const fr = 1.25 + r() * 0.5;
		const float: Vec3 = [
			Math.cos(fa) * fr,
			2.9 + r() * 1.8,
			Math.sin(fa) * fr * 0.55,
		];
		return {
			rest,
			float,
			spin: [r() * 6.28, r() * 6.28, r() * 6.28],
			phase: r() * 6.28,
			scale: 0.9 + r() * 0.25,
		};
	});
}

/**
 * Gummies for one jar, one draw call (InstancedMesh). They start inside the jar, rise through the
 * neck when the jar opens and sink back when it closes, driven by scroll `progress` (D-59).
 * `progress` undefined = still (reduced motion): gummies stay inside the jar.
 */
export function Gummies({
	colour,
	count,
	progress,
	seed = 7,
}: {
	colour: JarColour;
	count: number;
	progress?: MotionValue<number>;
	seed?: number;
}) {
	const { nodes } = useGLTF("/models/gummy.glb") as unknown as GummyGLTF;
	const mesh = useRef<THREE.InstancedMesh>(null);
	const invalidate = useThree((s) => s.invalidate);
	const gummies = useMemo(() => layout(count, seed), [count, seed]);
	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: jarColours[colour].gummy,
				roughness: 0.35,
			}),
		[colour],
	);
	const tmp = useMemo(
		() => ({
			m: new THREE.Matrix4(),
			q: new THREE.Quaternion(),
			e: new THREE.Euler(),
			p: new THREE.Vector3(),
			s: new THREE.Vector3(),
		}),
		[],
	);

	const update = useCallback(
		(p: number, time: number) => {
			const m = mesh.current;
			if (!m) return;
			const tl = timeline(p);
			// the exported mesh is quantised: its node carries the real scale
			const base = nodes.Gummy.scale.x;
			gummies.forEach((g, i) => {
				const t = gummyProgress(tl.gummyOut, i, gummies.length);
				const pos = gummyPath(t, g.rest, NECK, g.float);
				const bob = Math.sin(time * 1.1 + g.phase) * 0.07 * t;
				const sway = Math.sin(time * 0.6 + g.phase) * 0.25 * tl.drift;
				// gummy i belongs to card i % 3 and drifts toward it while that card shows
				const k = i % 3;
				const pull = tl.cards[k] * CARD_SIDE[k] * CARD_PULL * t;
				tmp.p.set(pos[0] + sway + pull, pos[1] + bob, pos[2]);
				tmp.e.set(
					g.spin[0] + t * 2.2 + time * 0.25 * t,
					g.spin[1] + t * 3.1,
					g.spin[2],
				);
				tmp.q.setFromEuler(tmp.e);
				const s = base * g.scale;
				tmp.s.set(s, s, s);
				m.setMatrixAt(i, tmp.m.compose(tmp.p, tmp.q, tmp.s));
			});
			m.instanceMatrix.needsUpdate = true;
		},
		[gummies, nodes, tmp],
	);

	useLayoutEffect(() => {
		update(progress ? progress.get() : 0, 0);
		invalidate();
	}, [update, progress, invalidate]);

	useFrame((state) => {
		if (progress) update(progress.get(), state.clock.elapsedTime);
	});

	return (
		<instancedMesh
			ref={mesh}
			args={[nodes.Gummy.geometry, material, gummies.length]}
			frustumCulled={false}
		/>
	);
}
