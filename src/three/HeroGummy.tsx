import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { asset } from "../assetUrl";
import type { Tier } from "../hooks/useDeviceTier";
import type { JarColour } from "../theme/tokens";
import {
	CROWD_SCALE,
	GREEN_FLOAT0,
	type GummyGLTF,
	PINK_GROUND0,
} from "./Gummies";
import { glowTexture, useHeroMaterial } from "./gummyMaterial";
import { jarColours } from "./looks";
import { HERO_GUMMY_SHARE, type Layout, unitPosition } from "./poses";
import { timelineAt } from "./sceneTime";

/** Distance from the camera where the hero gummy hangs, and the model's natural width (jar units). */
const DISTANCE = 8;
const MODEL_WIDTH = 0.36;

export type HeroState = {
	/** world position of the gummy that is currently the hero (for depth of field) */
	target: THREE.Vector3;
	/** 0..1 */
	amount: number;
};

/**
 * The one big gummy (D-79, D-83). It takes off from the spot where its crowd gummy floats, flies to a point in
 * front of the camera, grows to a share of the screen, and turns slowly. It flies back when scrolling on.
 * Green = 4a (Ingredients), pink = 4b (Benefits). Fake translucency (see gummyMaterial), same on all tiers.
 */
export function HeroGummy({
	colour,
	tier,
	layout,
	progress,
	state,
}: {
	colour: JarColour;
	tier: Exclude<Tier, "none">;
	layout: Layout;
	progress: MotionValue<number>;
	state: HeroState;
}) {
	const { nodes } = useGLTF(asset("models/gummy.glb")) as unknown as GummyGLTF;
	const material = useHeroMaterial(
		colour,
		jarColours[colour].gummy,
		tier === "high",
	);
	const group = useRef<THREE.Group>(null);
	const body = useRef<THREE.Mesh>(null);
	const halo = useRef<THREE.SpriteMaterial>(null);
	const haloMap = useMemo(glowTexture, []);
	useEffect(() => () => haloMap.dispose(), [haloMap]);
	const tmp = useMemo(
		() => ({
			end: new THREE.Vector3(),
			fwd: new THREE.Vector3(),
			up: new THREE.Vector3(),
			start: new THREE.Vector3(),
		}),
		[],
	);
	const baseScale = nodes.GummyHero.scale.x;

	useFrame((s) => {
		const g = group.current;
		const b = body.current;
		if (!g || !b) return;
		const tl = timelineAt(progress.get());
		const t = colour === "green" ? tl.greenHero : tl.pinkHero;
		g.visible = t > 0.001;
		if (!g.visible) return;
		const cam = s.camera as THREE.PerspectiveCamera;
		// where it takes off from (world): above the green jar, or on the ground beside the pink one
		if (colour === "green") {
			const u = unitPosition(layout, "green", 1);
			tmp.start.set(
				u[0] + GREEN_FLOAT0[0],
				u[1] + GREEN_FLOAT0[1],
				u[2] + GREEN_FLOAT0[2],
			);
		} else {
			const u = unitPosition(layout, "pink", 1);
			tmp.start.set(
				u[0] + PINK_GROUND0[0],
				u[1] + PINK_GROUND0[1],
				u[2] + PINK_GROUND0[2],
			);
		}
		// where it ends up: DISTANCE in front of the camera, a little above the centre
		tmp.fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
		tmp.up.set(0, 1, 0).applyQuaternion(cam.quaternion);
		const viewH = 2 * DISTANCE * Math.tan((cam.fov * Math.PI) / 360);
		const viewW = viewH * cam.aspect;
		tmp.end
			.copy(cam.position)
			.addScaledVector(tmp.fwd, DISTANCE)
			.addScaledVector(tmp.up, viewH * (layout === "mobile" ? 0.02 : 0.04));
		g.position.lerpVectors(tmp.start, tmp.end, t);
		const endScale = (viewW * HERO_GUMMY_SHARE[layout]) / MODEL_WIDTH;
		const sc = (CROWD_SCALE + (endScale - CROWD_SCALE) * t) * baseScale;
		b.scale.setScalar(sc);
		const time = s.clock.elapsedTime;
		b.rotation.set(0.35 + Math.sin(time * 0.4) * 0.18, time * 0.28, 0.1);
		material.opacity = 1;
		// shared with depth of field and the DOM
		state.target.copy(g.position);
		state.amount = Math.max(state.amount, t);
		if (halo.current) halo.current.opacity = t * (tier === "high" ? 0.55 : 0.9);
		// the halo is as big as the gummy and a bit more; it faces the camera
		const h = g.children[1] as THREE.Sprite | undefined;
		if (h) h.scale.setScalar(endScale * MODEL_WIDTH * 2.4 * t + 0.001);
	});

	return (
		<group ref={group} visible={false}>
			<mesh
				ref={body}
				geometry={nodes.GummyHero.geometry}
				material={material}
			/>
			{/* soft radial glow behind the gummy, every tier (D-97); Bloom adds to it on high */}
			{
				<sprite renderOrder={-1}>
					<spriteMaterial
						ref={halo}
						map={haloMap}
						color={colour === "green" ? "#dfe6b4" : "#f3d3da"}
						transparent
						opacity={0}
						depthWrite={false}
						toneMapped={false}
					/>
				</sprite>
			}
		</group>
	);
}
