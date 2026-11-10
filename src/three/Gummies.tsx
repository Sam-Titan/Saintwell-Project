import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { asset } from "../assetUrl";
import type { JarColour } from "../theme/tokens";
import { useGummyMaterial } from "./gummyMaterial";
import { jarColours } from "./looks";
import { type Layout, MOUTH } from "./poses";
import { rng } from "./random";
import { timelineAt } from "./sceneTime";
import { gummyPath, gummyProgress, smooth, type Vec3 } from "./storyTimeline";

export type GummyGLTF = { nodes: { Gummy: THREE.Mesh; GummyHero: THREE.Mesh } };

/** Crowd gummies are drawn this much bigger than the model (jar units), so they read at page size. */
export const CROWD_SCALE = 1.5;

type Spec = {
	rest: Vec3;
	float: Vec3;
	spin: Vec3;
	phase: number;
	scale: number;
};

/** Standing jar: gummies start stacked inside, rise through the neck and float on a ring around it. */
const NECK: Vec3 = [0, MOUTH, 0];
/** Centre of the green float ring, in the standing jar's frame (the jar is left of centre). */
export const FLOAT_CX = 1.9;
/** The first green gummy floats here; the big hero gummy takes off from (and returns to) this spot. */
export const GREEN_FLOAT0: Vec3 = [1.9, 3.4, 0.3];

export function standing(count: number, seed: number): Spec[] {
	const r = rng(seed);
	return Array.from({ length: count }, (_, i) => {
		const a = r() * Math.PI * 2;
		const rad = Math.sqrt(r()) * 0.62;
		const rest: Vec3 = [
			Math.cos(a) * rad,
			0.34 + (i / count) * 1.4 + r() * 0.12,
			Math.sin(a) * rad,
		];
		// they float above and between the jars, inside the clear centre band (D-101)
		const fa = (i / count) * Math.PI * 2 + r() * 0.5;
		const fr = 0.3 + r() * 0.4;
		const float: Vec3 =
			i === 0
				? GREEN_FLOAT0
				: [
						FLOAT_CX + Math.cos(fa) * fr,
						2.7 + r() * 1.2,
						Math.sin(fa) * 0.7 * (0.5 + r()),
					];
		return {
			rest,
			float,
			spin: [r() * 6.28, r() * 6.28, r() * 6.28],
			phase: r() * 6.28,
			scale: 0.85 + r() * 0.3,
		};
	});
}

/** Lying jar (unit-local: origin = base centre, axis along +x, ground 1 below the axis). */
export const GROUND_Y = -1 + 0.2;
export const PINK_MOUTH: Vec3 = [MOUTH + 0.05, -0.45, 0];
/** Where the first pink gummy ends up; the pink hero gummy takes off from here. */
export const PINK_GROUND0: Vec3 = [1.8, GROUND_Y, 1.6];

export function lying(count: number, seed: number): Spec[] {
	const r = rng(seed);
	return Array.from({ length: count }, (_, i) => {
		// a pile along the axis, low in the jar (gravity): local y < 0 is towards the ground
		const along = 0.45 + (i / count) * 1.8 + r() * 0.1;
		const side = (r() - 0.5) * 0.9;
		const down = -(0.1 + r() * 0.5);
		const rest: Vec3 = [along, down, side];
		const ground: Vec3 =
			i === 0 ? PINK_GROUND0 : [1.2 + r() * 0.8, GROUND_Y, 1.2 + r() * 0.8];
		return {
			rest,
			float: ground,
			spin: [r() * 6.28, r() * 6.28, r() * 6.28],
			phase: r() * 6.28,
			scale: 0.85 + r() * 0.3,
		};
	});
}

/**
 * Crowd of gummies for one jar, one draw call (InstancedMesh), driven by scroll `progress`.
 * green: rise out of the neck and float. pink: roll out of the mouth of the lying jar onto the ground.
 * Instance 0 is handed over to the big hero gummy while that one is shown (same position and size,
 * so the hand-over is seamless).
 */
export function Gummies({
	colour,
	count,
	progress,
	seed = 7,
	shrink = 0,
}: {
	colour: JarColour;
	count: number;
	progress: MotionValue<number>;
	seed?: number;
	/** low tier: share the crowd shrinks while a hero gummy has the stage */
	shrink?: number;
}) {
	const { nodes } = useGLTF(asset("models/gummy.glb")) as unknown as GummyGLTF;
	const mesh = useRef<THREE.InstancedMesh>(null);
	const invalidate = useThree((s) => s.invalidate);
	const lie = colour === "pink";
	const gummies = useMemo(
		() => (lie ? lying(count, seed) : standing(count, seed)),
		[lie, count, seed],
	);
	// same matte, sugar-dusted look as the hero gummy, no glow (D-98)
	const material = useGummyMaterial(colour, jarColours[colour].gummy, {
		normalScale: 0.35,
	});
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
			const tl = timelineAt(p);
			const out = lie ? tl.pinkOut : tl.greenOut;
			const heroT = lie ? tl.pinkHero : tl.greenHero;
			const base = nodes.Gummy.scale.x; // the exported mesh is quantised: its node carries the real scale
			const keep = 1 - shrink * tl.focus;
			gummies.forEach((g, i) => {
				const t = gummyProgress(out, i, gummies.length);
				const neck = lie ? PINK_MOUTH : NECK;
				const pos = gummyPath(t, g.rest, neck, g.float, lie ? 0.45 : 0);
				const afloat = lie ? 0 : t;
				const bob = Math.sin(time * 1.1 + g.phase) * 0.07 * afloat;
				tmp.p.set(pos[0], pos[1] + bob, pos[2]);
				// rolling out: turn around the z axis as it travels along the ground
				const roll = lie
					? -(smooth(0.5, 1, t) * (g.float[0] - MOUTH)) / 0.25
					: 0;
				tmp.e.set(
					g.spin[0] + t * 2.2,
					g.spin[1] + t * 3.1 + (lie ? 0 : time * 0.25 * t),
					g.spin[2] + roll,
				);
				tmp.q.setFromEuler(tmp.e);
				const hidden = i === 0 && heroT > 0.001;
				const s = hidden ? 0 : base * CROWD_SCALE * g.scale * keep;
				tmp.s.set(s, s, s);
				m.setMatrixAt(i, tmp.m.compose(tmp.p, tmp.q, tmp.s));
			});
			m.instanceMatrix.needsUpdate = true;
		},
		[gummies, nodes, tmp, lie, shrink],
	);

	useLayoutEffect(() => {
		update(progress.get(), 0);
		invalidate();
	}, [update, progress, invalidate]);

	useFrame((state) => update(progress.get(), state.clock.elapsedTime));

	return (
		<instancedMesh
			ref={mesh}
			args={[nodes.Gummy.geometry, material, gummies.length]}
			frustumCulled={false}
		/>
	);
}

/** A few gummies that float around the hero shot (some small, some big). They fade out as the jars open. */
export function Ambient({
	colour,
	spots,
	progress,
}: {
	colour: JarColour;
	/** [x, y, z, size] in world units */
	spots: readonly (readonly [number, number, number, number])[];
	progress: MotionValue<number>;
}) {
	const { nodes } = useGLTF(asset("models/gummy.glb")) as unknown as GummyGLTF;
	const mesh = useRef<THREE.InstancedMesh>(null);
	const material = useGummyMaterial(colour, jarColours[colour].gummy);
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
	useFrame((state) => {
		const m = mesh.current;
		if (!m) return;
		const tl = timelineAt(progress.get());
		const t = state.clock.elapsedTime;
		const base = nodes.GummyHero.scale.x;
		spots.forEach((sp, i) => {
			tmp.p.set(sp[0], sp[1] + Math.sin(t * 0.8 + i * 2.1) * 0.12, sp[2]);
			tmp.e.set(0.6 + i + t * 0.2, 1.1 * i + t * 0.15, 0.3 * i);
			tmp.q.setFromEuler(tmp.e);
			const s = base * CROWD_SCALE * sp[3] * tl.hero;
			tmp.s.set(s, s, s);
			m.setMatrixAt(i, tmp.m.compose(tmp.p, tmp.q, tmp.s));
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh
			ref={mesh}
			args={[nodes.GummyHero.geometry, material, spots.length]}
			frustumCulled={false}
		/>
	);
}

export type { Layout };
