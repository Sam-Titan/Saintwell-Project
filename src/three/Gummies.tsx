import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { JarColour } from "../theme/tokens";
import { jarColours } from "./looks";

type GummyGLTF = { nodes: { Gummy: THREE.Mesh } };

/** Many gummies in one draw call (InstancedMesh). `transforms` are positions/rotations in jar units. */
export function Gummies({
	colour,
	transforms,
}: {
	colour: JarColour;
	transforms: readonly THREE.Matrix4[];
}) {
	const { nodes } = useGLTF("/models/gummy.glb") as unknown as GummyGLTF;
	const mesh = useRef<THREE.InstancedMesh>(null);
	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: jarColours[colour].gummy,
				roughness: 0.35,
			}),
		[colour],
	);
	useLayoutEffect(() => {
		const m = mesh.current;
		if (!m) return;
		// the exported mesh is quantised: its node carries the real scale
		const base = new THREE.Matrix4().makeScale(
			nodes.Gummy.scale.x,
			nodes.Gummy.scale.y,
			nodes.Gummy.scale.z,
		);
		transforms.forEach((t, i) => {
			m.setMatrixAt(i, t.clone().multiply(base));
		});
		m.instanceMatrix.needsUpdate = true;
	}, [transforms, nodes]);
	return (
		<instancedMesh
			ref={mesh}
			args={[nodes.Gummy.geometry, material, transforms.length]}
		/>
	);
}
