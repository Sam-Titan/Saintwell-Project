import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { JarColour } from "../theme/tokens";

const TEXTURES = [
	"/textures/gummy/sugar-normal.webp",
	"/textures/gummy/sugar-specks.webp",
];

/** Pale tints for the inner glow / sheen (lighter versions of the gummy colours, not new brand colours). */
const TINT = {
	green: { glow: "#dfe6b4", sheen: "#e9efc6" },
	pink: { glow: "#f3d3da", sheen: "#f8e3e8" },
} as const;

/**
 * Hero gummy material (D-83): NO transmission. The translucent look is faked: sheen, clearcoat and an
 * emissive inner glow (faint base + bright sugar specks from the specks map). Sugar surface = baked
 * normal map. Same on every tier.
 */
export function useHeroMaterial(
	colour: JarColour,
	baseColour: string,
): THREE.MeshPhysicalMaterial {
	const [normal, specks] = useTexture(TEXTURES) as THREE.Texture[];
	useEffect(() => {
		for (const t of [normal, specks]) {
			t.wrapS = t.wrapT = THREE.RepeatWrapping;
			t.repeat.set(5, 5);
			t.colorSpace = THREE.NoColorSpace;
			t.anisotropy = 4;
			t.needsUpdate = true;
		}
	}, [normal, specks]);
	const material = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: baseColour,
				roughness: 0.4,
				clearcoat: 0.9,
				clearcoatRoughness: 0.22,
				sheen: 1,
				sheenRoughness: 0.45,
				sheenColor: new THREE.Color(TINT[colour].sheen),
				normalMap: normal,
				normalScale: new THREE.Vector2(0.55, 0.55),
				emissive: new THREE.Color(TINT[colour].glow),
				emissiveMap: specks,
				emissiveIntensity: 0.9,
				transparent: true,
			}),
		[colour, baseColour, normal, specks],
	);
	useEffect(() => () => material.dispose(), [material]);
	return material;
}

/** Soft radial glow (low tier sprite behind the hero gummy; high tier uses Bloom instead). */
export function glowTexture(): THREE.CanvasTexture {
	const c = document.createElement("canvas");
	c.width = c.height = 128;
	const g = c.getContext("2d");
	if (g) {
		const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
		grad.addColorStop(0, "rgba(255,255,255,0.7)");
		grad.addColorStop(0.5, "rgba(255,255,255,0.22)");
		grad.addColorStop(1, "rgba(255,255,255,0)");
		g.fillStyle = grad;
		g.fillRect(0, 0, 128, 128);
	}
	return new THREE.CanvasTexture(c);
}
