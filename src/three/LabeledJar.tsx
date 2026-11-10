import {
	MeshTransmissionMaterial,
	useGLTF,
	useTexture,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { JarColour, JarLabel } from "../theme/tokens";
import { applyLabelFit, createLabelMask, labelBandSize } from "./labelFit";
import { jarColours, labelUrl } from "./looks";
import { Jar } from "./models/Jar";

type Props = {
	colour: JarColour;
	label: JarLabel;
	textureSize?: 1024 | 2048;
	/** high tier: the pink jar uses real frosted transmission. Low tier: semi-transparent physical material. */
	transmission?: boolean;
} & Omit<React.JSX.IntrinsicElements["group"], "ref">;

/**
 * Jar with its own materials (so many jars with different looks can share the same geometry).
 * Body colour and label texture follow `colour` and `label`.
 */
export function LabeledJar({
	colour,
	label,
	textureSize = 2048,
	transmission = false,
	...props
}: Props) {
	const group = useRef<THREE.Group>(null);
	const invalidate = useThree((s) => s.invalidate);
	const map = useTexture(labelUrl({ colour, label }, textureSize));
	const mask = useMemo(() => createLabelMask(), []);
	const mats = useRef<{
		label: THREE.MeshStandardMaterial;
		band: { radius: number; height: number };
	} | null>(null);
	const { nodes } = useGLTF("/models/jar.glb") as unknown as {
		nodes: { Body: THREE.Mesh };
	};
	const frosted = colour === "pink" && transmission;

	// Cap and label get their own materials (once per mount).
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
		const cap = clone("Cap").m;
		cap.color.set("#ffffff"); // white, slightly glossy
		cap.roughness = 0.3;
		cap.metalness = 0;
		const l = clone("Label");
		mats.current = { label: l.m, band: labelBandSize(l.mesh) };
		return () => {
			for (const m of own) m.dispose();
			mask.dispose();
			mats.current = null;
		};
	}, [mask]);

	// Body material follows the jar colour and tier.
	useLayoutEffect(() => {
		const body = group.current?.getObjectByName("Body") as
			| THREE.Mesh
			| undefined;
		if (!body) return;
		if (frosted) {
			// MeshTransmissionMaterial is rendered by the extra mesh below
			body.visible = false;
			return () => {
				body.visible = true;
			};
		}
		const m =
			colour === "pink"
				? new THREE.MeshPhysicalMaterial({
						color: jarColours.pink.body,
						roughness: 0.55,
						transparent: true,
						opacity: 0.55,
					})
				: new THREE.MeshStandardMaterial({
						color: jarColours.green.body,
						roughness: 0.85,
						metalness: 0,
					});
		body.material = m;
		invalidate();
		return () => m.dispose();
	}, [colour, frosted, invalidate]);

	// Colour and label changes.
	useLayoutEffect(() => {
		const m = mats.current;
		if (!m) return;
		applyLabelFit(m.label, map, mask, m.band);
		invalidate(); // reduced motion renders on demand
	}, [map, mask, invalidate]);

	return (
		<group ref={group} {...props}>
			<Jar />
			{frosted && (
				<mesh
					geometry={nodes.Body.geometry}
					position={nodes.Body.position}
					scale={nodes.Body.scale}
				>
					<MeshTransmissionMaterial
						color={jarColours.pink.body}
						transmission={1}
						roughness={0.4}
						thickness={0.6}
						ior={1.3}
						samples={8}
						resolution={512}
						chromaticAberration={0}
						anisotropicBlur={0.05}
						distortion={0}
						backside={false}
					/>
				</mesh>
			)}
		</group>
	);
}
