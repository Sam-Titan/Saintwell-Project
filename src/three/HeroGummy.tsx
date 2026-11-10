import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { asset } from "../assetUrl";
import type { Tier } from "../hooks/useDeviceTier";
import type { JarColour } from "../theme/tokens";
import type { GummyGLTF } from "./Gummies";
import { useHeroMaterial } from "./gummyMaterial";
import {
	CROWD_SCALE,
	GREEN_FLOAT0,
	heroSpin,
	heroTilt,
	PINK_GROUND0,
} from "./gummyPaths";
import { jarColours } from "./looks";
import { HERO_GUMMY_SHARE, type Layout, unitPosition } from "./poses";
import { timelineAt } from "./sceneTime";
import { spritesReady } from "./sprites";
import { smooth } from "./storyTimeline";

/** Distance from the camera where the hero gummy hangs, and the model's natural width (jar units). */
const DISTANCE = 8;
const MODEL_WIDTH = 0.375;

/**
 * The flight of the hero gummy (D-79, D-106). It takes off from the spot where its crowd gummy (the seat) floats,
 * flies to a point in front of the camera, grows to a share of the screen and turns slowly. Once it is there, the
 * pre-rendered sprite (HeroSprite, a DOM layer) takes over at the same size, position and pose, and this mesh
 * hides. It is back when scrolling on. Green = 4a (Ingredients), pink = 4b (Benefits).
 * The pose at arrival = the sprite's: tilted 38 degrees towards the camera, spinning on the shared clock.
 */
export function HeroGummy({
	colour,
	layout,
	progress,
}: {
	colour: JarColour;
	tier: Exclude<Tier, "none">;
	layout: Layout;
	progress: MotionValue<number>;
}) {
	const { nodes } = useGLTF(asset("models/gummy.glb")) as unknown as GummyGLTF;
	const material = useHeroMaterial(colour, jarColours[colour].gummy);
	const group = useRef<THREE.Group>(null);
	const body = useRef<THREE.Mesh>(null);
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
		// hidden while it is still a crowd gummy, and once the sprite has taken over (if the sprite is there)
		g.visible = t > 0.001 && (t < 0.999 || !spritesReady[colour]);
		if (!g.visible) return;
		const cam = s.camera as THREE.PerspectiveCamera;
		// where it takes off from (world): above the green jar, or on the ground beside the pink one
		const seat = colour === "green" ? GREEN_FLOAT0 : PINK_GROUND0;
		const u = unitPosition(layout, colour, 1);
		tmp.start.set(u[0] + seat[0], u[1] + seat[1], u[2] + seat[2]);
		// where it ends up: DISTANCE in front of the camera, a little above the centre (the sprite's place)
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
		b.scale.setScalar((CROWD_SCALE + (endScale - CROWD_SCALE) * t) * baseScale);
		// same clock as the seat before and the sprite after: no turn at either hand-over
		const phi = heroSpin(performance.now() / 1000);
		b.rotation.set(heroTilt(phi) * smooth(0, 1, t), phi, 0, "XYZ");
	});

	return (
		<group ref={group} visible={false}>
			<mesh
				ref={body}
				geometry={nodes.GummyHero.geometry}
				material={material}
			/>
		</group>
	);
}
