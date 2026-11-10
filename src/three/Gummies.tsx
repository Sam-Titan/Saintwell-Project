import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { asset } from "../assetUrl";
import type { JarColour } from "../theme/tokens";
import { useGummyMaterial } from "./gummyMaterial";
import {
	CROWD_SCALE,
	freeStarts,
	gummyState,
	lyingSpecs,
	standingSpecs,
} from "./gummyPaths";
import { jarColours } from "./looks";
import type { Layout } from "./poses";
import { timelineAt } from "./sceneTime";

export type GummyGLTF = { nodes: { Gummy: THREE.Mesh; GummyHero: THREE.Mesh } };

/**
 * The crowd of gummies for one jar, one draw call (InstancedMesh), driven by scroll `progress` (D-110, D-111).
 * green: rise out of the neck and float. pink: leave through the mouth of the lying jar and land on the ground
 * in front of it. A fixed number, all always visible; instance 0 is the hero gummy's seat and is empty only while
 * the hero gummy is out. Positions come from the pure `gummyState`.
 */
export function Gummies({
	colour,
	count,
	layout,
	progress,
	seed = 7,
}: {
	colour: JarColour;
	count: number;
	layout: Layout;
	progress: MotionValue<number>;
	seed?: number;
}) {
	const { nodes } = useGLTF(asset("models/gummy.glb")) as unknown as GummyGLTF;
	const mesh = useRef<THREE.InstancedMesh>(null);
	const invalidate = useThree((s) => s.invalidate);
	const lie = colour === "pink";
	const specs = useMemo(() => {
		const free = freeStarts(layout, colour);
		return lie
			? lyingSpecs(count, seed, free)
			: standingSpecs(count, seed, free);
	}, [lie, count, seed, layout, colour]);
	const material = useGummyMaterial(colour, jarColours[colour].gummy, {
		normalScale: 0.3,
	});
	const tmp = useMemo(
		() => ({
			m: new THREE.Matrix4(),
			q: new THREE.Quaternion(),
			e: new THREE.Euler(0, 0, 0, "YXZ"),
			p: new THREE.Vector3(),
			s: new THREE.Vector3(),
		}),
		[],
	);

	const update = useCallback(
		(p: number, time: number) => {
			const m = mesh.current;
			if (!m) return;
			const tl = timelineAt(p);
			const out = lie ? tl.pinkOut : tl.greenOut;
			const heroT = lie ? tl.pinkHero : tl.greenHero;
			const base = nodes.Gummy.scale.x; // the exported mesh is quantised: its node carries the real scale
			specs.forEach((g, i) => {
				const st = gummyState(g, i, specs.length, out, heroT, time);
				tmp.p.set(st.pos[0], st.pos[1], st.pos[2]);
				tmp.e.set(st.tiltX, st.yaw, st.tiltZ);
				tmp.q.setFromEuler(tmp.e);
				const s = base * CROWD_SCALE * st.scale;
				tmp.s.set(s, s, s);
				m.setMatrixAt(i, tmp.m.compose(tmp.p, tmp.q, tmp.s));
			});
			m.instanceMatrix.needsUpdate = true;
		},
		[specs, nodes, tmp, lie],
	);

	useLayoutEffect(() => {
		update(progress.get(), performance.now() / 1000);
		invalidate();
	}, [update, progress, invalidate]);

	// one steady clock for the seat's spin, the hero gummy and its sprite
	useFrame(() => update(progress.get(), performance.now() / 1000));

	return (
		<instancedMesh
			ref={mesh}
			args={[nodes.Gummy.geometry, material, specs.length]}
			frustumCulled={false}
		/>
	);
}

export type { Layout };
