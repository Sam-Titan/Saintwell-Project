import { useTexture } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import type { JarColour, JarLabel } from "../theme/tokens";
import { applyLabelFit, createLabelMask, labelBandSize } from "./labelFit";
import { jarColours, labelUrl } from "./looks";
import { Jar } from "./models/Jar";

type Props = {
	colour: JarColour;
	label: JarLabel;
	textureSize?: 1024 | 2048;
} & Omit<React.JSX.IntrinsicElements["group"], "ref">;

/**
 * Jar with its own materials (so many jars with different looks can share the same geometry).
 * Body colour and label texture follow `colour` and `label`.
 */
export function LabeledJar({
	colour,
	label,
	textureSize = 2048,
	...props
}: Props) {
	const group = useRef<THREE.Group>(null);
	const map = useTexture(labelUrl({ colour, label }, textureSize));
	const mask = useMemo(() => createLabelMask(), []);
	const mats = useRef<{
		body: THREE.MeshStandardMaterial;
		label: THREE.MeshStandardMaterial;
		band: { radius: number; height: number };
	} | null>(null);

	// Give this jar its own copies of the shared materials (once per mount).
	useLayoutEffect(() => {
		const g = group.current;
		if (!g) return;
		const own: THREE.MeshStandardMaterial[] = [];
		const clone = (name: string) => {
			const mesh = g.getObjectByName(name) as THREE.Mesh;
			const m = (mesh.material as THREE.MeshStandardMaterial).clone();
			mesh.material = m;
			own.push(m);
			return { mesh, m };
		};
		const body = clone("Body").m;
		clone("Cap");
		const l = clone("Label");
		mats.current = { body, label: l.m, band: labelBandSize(l.mesh) };
		return () => {
			for (const m of own) m.dispose();
			mask.dispose();
			mats.current = null;
		};
	}, [mask]);

	// Colour and label changes.
	useLayoutEffect(() => {
		const m = mats.current;
		if (!m) return;
		m.body.color.set(jarColours[colour].body);
		applyLabelFit(m.label, map, mask, m.band);
	}, [colour, map, mask]);

	return (
		<group ref={group} {...props}>
			<Jar />
		</group>
	);
}
