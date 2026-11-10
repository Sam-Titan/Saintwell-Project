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
	green: { sheen: "#dcec9a", rim: "#d2e878" },
	pink: { sheen: "#ffd0de", rim: "#ffb6cd" },
} as const;

const WRAP_FROM = "vec3 irradiance = dotNL * directLight.color;";

/**
 * Fake jelly (D-98, D-107). No transmission: everything is a few lines of shader on a MeshPhysicalMaterial.
 *  - deeper, more saturated core where the surface faces the camera (the thick middle), base colour between,
 *    lighter fresnel rim at the silhouette;
 *  - wrap lighting: the lit side bleeds round the terminator, shadows stay coloured (not clay-dark);
 *  - a faint inner glow, as if light came through from behind;
 *  - sugar: baked normal map, sparse sparkles (whiten the colour map), glints in the roughness map;
 *  - no clearcoat, low specular, high roughness: no plastic gloss.
 */
export function useGummyMaterial(
	colour: JarColour,
	baseColour: string,
	{ normalScale = 0.45 }: { normalScale?: number } = {},
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
			specularIntensity: 0.45,
			sheen: 0.6,
			sheenRoughness: 0.55,
			sheenColor: new THREE.Color(TINT[colour].sheen),
			envMapIntensity: 0.55,
			normalMap: normal,
			normalScale: new THREE.Vector2(normalScale, normalScale),
		});
		const rim = new THREE.Color(TINT[colour].rim);
		m.onBeforeCompile = (shader) => {
			shader.uniforms.uRim = { value: rim };
			shader.uniforms.uWrap = { value: 0.5 };
			shader.uniforms.uInner = { value: 0.24 };
			const pars = THREE.ShaderChunk.lights_physical_pars_fragment;
			if (!pars.includes(WRAP_FROM))
				throw new Error("three changed: wrap-lighting patch no longer applies");
			shader.fragmentShader = shader.fragmentShader
				.replace(
					"#include <common>",
					"#include <common>\nuniform vec3 uRim;\nuniform float uWrap;\nuniform float uInner;\nfloat gR;\nvec3 gBase;",
				)
				.replace(
					"#include <lights_physical_pars_fragment>",
					pars.replace(
						WRAP_FROM,
						"vec3 irradiance = saturate( ( dot( geometryNormal, directLight.direction ) + uWrap ) / ( 1.0 + uWrap ) ) * directLight.color;",
					),
				)
				// the colour map holds sparkles on black: whiten the colour there (instead of multiplying)
				.replace(
					"#include <map_fragment>",
					`#ifdef USE_MAP
					float sp = texture2D( map, vMapUv ).r;
					diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 1.0 ), sp * 0.9 );
					#endif`,
				)
				// deeper core, base in between, lighter rim
				.replace(
					"#include <normal_fragment_maps>",
					`#include <normal_fragment_maps>
					float gNV = clamp( abs( dot( normalize( normal ), normalize( vViewPosition ) ) ), 0.0, 1.0 );
					gR = 1.0 - gNV;
					gBase = diffuseColor.rgb;
					vec3 gDeep = pow( gBase, vec3( 2.4 ) ) * 0.8;
					vec3 gCol = mix( gDeep, gBase, smoothstep( 0.05, 0.8, gR ) );
					diffuseColor.rgb = mix( gCol, uRim, pow( gR, 2.0 ) * 0.75 );`,
				)
				.replace(
					"#include <emissivemap_fragment>",
					`#include <emissivemap_fragment>
					totalEmissiveRadiance += gBase * uInner * ( 0.35 + 0.65 * smoothstep( 0.2, 1.0, gR ) );
					totalEmissiveRadiance += uRim * pow( gR, 2.2 ) * 0.5;`,
				);
		};
		m.customProgramCacheKey = () => "gummy-jelly-4";
		return m;
	}, [colour, baseColour, normal, specks, rough, normalScale]);
	useEffect(() => () => material.dispose(), [material]);
	return material;
}

/** The hero gummy mesh (its flight to the sprite): same material. */
export const useHeroMaterial = (colour: JarColour, baseColour: string) =>
	useGummyMaterial(colour, baseColour);

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
