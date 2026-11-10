import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { asset } from "../assetUrl";
import type { JarColour } from "../theme/tokens";

const TEXTURES = [
	asset("textures/gummy/sugar-normal.webp"),
	asset("textures/gummy/sugar-specks.webp"),
	asset("textures/gummy/sugar-rough.webp"),
];

/** Pale tints for the rim (lighter versions of the gummy colours, not new brand colours). */
const TINT = {
	green: { sheen: "#e9efc6", rim: "#eef3cf" },
	pink: { sheen: "#f8e3e8", rim: "#fbe9ee" },
} as const;

/**
 * Gummy material (D-98): matte and sugar-dusted, never glossy. High roughness (baked roughness map, a few small
 * glints at the sparkles), no clearcoat, subtle sheen, low reflections. Sugar surface = baked normal map; sparse
 * sparkles whiten the colour map. Translucency is faked in the shader: darker core, lighter rim (no transmission,
 * D-83). `glow` (hero gummy only) adds a bright HDR rim that Bloom picks up: nothing else reaches the threshold.
 */
export function useGummyMaterial(
	colour: JarColour,
	baseColour: string,
	{
		glow = 0,
		normalScale = 0.55,
	}: { glow?: number; normalScale?: number } = {},
): THREE.MeshPhysicalMaterial {
	const [normal, specks, rough] = useTexture(TEXTURES) as THREE.Texture[];
	useEffect(() => {
		for (const t of [normal, specks, rough]) {
			t.wrapS = t.wrapT = THREE.RepeatWrapping;
			t.repeat.set(5, 5);
			t.colorSpace = THREE.NoColorSpace;
			t.anisotropy = 4;
			t.needsUpdate = true;
		}
	}, [normal, specks, rough]);
	const material = useMemo(() => {
		const m = new THREE.MeshPhysicalMaterial({
			color: baseColour,
			roughness: 1,
			roughnessMap: rough,
			map: specks,
			clearcoat: 0,
			sheen: 0.35,
			sheenRoughness: 0.8,
			sheenColor: new THREE.Color(TINT[colour].sheen),
			envMapIntensity: 0.45,
			normalMap: normal,
			normalScale: new THREE.Vector2(normalScale, normalScale),
			transparent: true,
		});
		const rim = new THREE.Color(TINT[colour].rim);
		m.onBeforeCompile = (shader) => {
			shader.uniforms.uRim = { value: rim };
			shader.uniforms.uGlow = { value: glow };
			shader.fragmentShader = shader.fragmentShader
				.replace(
					"#include <common>",
					"#include <common>\nuniform vec3 uRim;\nuniform float uGlow;\nfloat gRim;",
				)
				// the colour map holds sparkles on black: whiten the colour there (instead of multiplying)
				.replace(
					"#include <map_fragment>",
					`#ifdef USE_MAP
					float sp = texture2D( map, vMapUv ).r;
					diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 1.0 ), sp * 0.6 );
					#endif`,
				)
				// fake translucency: darker core, lighter rim
				.replace(
					"#include <normal_fragment_maps>",
					`#include <normal_fragment_maps>
					float gNV = clamp( abs( dot( normalize( normal ), normalize( vViewPosition ) ) ), 0.0, 1.0 );
					gRim = pow( 1.0 - gNV, 2.2 );
					diffuseColor.rgb = mix( diffuseColor.rgb * 0.8, mix( diffuseColor.rgb, uRim, 0.4 ), gRim );`,
				)
				.replace(
					"#include <emissivemap_fragment>",
					`#include <emissivemap_fragment>
					totalEmissiveRadiance += uRim * gRim * uGlow;`,
				);
		};
		m.customProgramCacheKey = () => `gummy-${glow}`;
		return m;
	}, [colour, baseColour, normal, specks, rough, glow, normalScale]);
	useEffect(() => () => material.dispose(), [material]);
	return material;
}

/** The hero gummy: same material with the HDR rim glow for Bloom. */
export const useHeroMaterial = (
	colour: JarColour,
	baseColour: string,
	/** high: the rim goes just above the Bloom threshold; low: no Bloom, only a faint lift */
	high: boolean,
) => useGummyMaterial(colour, baseColour, { glow: high ? 1.5 : 0.2 });

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
