import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { Perf } from "r3f-perf";
import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { copy } from "../content/copy";
import { type Tier, tierSettings } from "../hooks/useDeviceTier";
import { Ambient, Gummies } from "./Gummies";
import { HeroGummy, type HeroState } from "./HeroGummy";
import { LabeledJar } from "./LabeledJar";
import LoadingScreen from "./LoadingScreen";
import { FRAME, type Layout, unitPosition } from "./poses";
import { Studio } from "./Studio";
import { timelineAt } from "./sceneTime";
import { backgroundAt, rgbCss } from "./storyTimeline";

export type { Layout };

// Bloom + depth of field: own chunk, fetched on the high tier only (D-84)
const Fx = lazy(() => import("./Fx"));

const FOV = 28;
const TILT = 0.1; // camera looks slightly down on the ground (radians)

/** Moves the camera back until the frame box fits (any aspect ratio); keeps top / bottom space clear. */
function FitCamera({ layout }: { layout: Layout }) {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const size = useThree((s) => s.size);
	const invalidate = useThree((s) => s.invalidate);
	useLayoutEffect(() => {
		const half = Math.tan((FOV / 2) * (Math.PI / 180));
		const aspect = size.width / size.height;
		const f = FRAME[layout];
		const H = Math.max(f.h / (1 - f.top - f.bottom), f.w / aspect);
		const z = H / 2 / half;
		const viewTop = f.cy + f.h / 2 + f.top * H;
		const viewBottom = f.cy - f.h / 2 - f.bottom * H;
		const centre = (viewTop + viewBottom) / 2;
		camera.position.set(f.cx, centre + z * Math.tan(TILT), z);
		camera.lookAt(f.cx, centre, 0);
		camera.updateProjectionMatrix();
		invalidate();
	}, [camera, size, layout, invalidate]);
	return null;
}

/** Sets an opacity on every material under `group` (remembering the original). */
function setOpacity(group: THREE.Object3D, k: number) {
	group.traverse((o) => {
		const mesh = o as THREE.Mesh;
		const mats = mesh.material
			? Array.isArray(mesh.material)
				? mesh.material
				: [mesh.material]
			: [];
		for (const m of mats) {
			const ud = m.userData as { o0?: number; t0?: boolean };
			if (ud.o0 === undefined) {
				ud.o0 = m.opacity;
				ud.t0 = m.transparent;
			}
			m.transparent = k < 0.999 ? true : (ud.t0 ?? false);
			m.opacity = ud.o0 * k;
		}
	});
}

/** Ambient floating gummies per layout (world units: x, y, z, size). */
const AMBIENT: Record<
	Layout,
	{
		green: readonly (readonly [number, number, number, number])[];
		pink: readonly (readonly [number, number, number, number])[];
	}
> = {
	desktop: {
		green: [
			[-3.1, 1.3, 0.6, 1.5],
			[-2.1, 0.55, 1.0, 0.85],
		],
		pink: [
			[3.1, 3.9, -0.4, 1.4],
			[3.6, 2.7, -0.6, 0.85],
		],
	},
	mobile: {
		green: [
			[-1.9, 1.5, 0.4, 1.2],
			[-1.2, 0.5, 0.8, 0.75],
		],
		pink: [
			[1.8, 4.1, -0.4, 1.1],
			[2.2, 3.0, -0.6, 0.7],
		],
	},
};

/** Both jars, their gummies, the ground shadow and the hero gummies. One useFrame moves the units. */
function Scene({
	tier,
	progress,
	layout,
	hero,
}: {
	tier: Exclude<Tier, "none">;
	progress: MotionValue<number>;
	layout: Layout;
	hero: HeroState;
}) {
	const s = tierSettings(tier);
	const green = useRef<THREE.Group>(null);
	const greenSpin = useRef<THREE.Group>(null);
	const pink = useRef<THREE.Group>(null);
	const pinkRoll = useRef<THREE.Group>(null);
	const fadeLast = useRef(-1);
	// colour behind the transparent canvas, used as the frosted jar's transmission background (D-80)
	const behind = useMemo(() => new THREE.Color(), []);

	useFrame(({ clock }, delta) => {
		const tl = timelineAt(progress.get());
		behind.setStyle(rgbCss(backgroundAt(progress.get())));
		const g = green.current;
		const gs = greenSpin.current;
		const p = pink.current;
		const pr = pinkRoll.current;
		if (!g || !gs || !p || !pr) return;
		const gp = unitPosition(layout, "green", tl.settle);
		const pp = unitPosition(layout, "pink", tl.settle);
		g.position.set(gp[0], gp[1], gp[2]);
		p.position.set(pp[0], pp[1], pp[2]);
		// slow spin while it is free, ease to face the front when the story needs it
		const turn = (obj: THREE.Object3D, axis: "x" | "y") => {
			obj.rotation[axis] += delta * 0.35 * tl.spin;
			const front =
				Math.round(obj.rotation[axis] / (Math.PI * 2)) * Math.PI * 2;
			obj.rotation[axis] +=
				(front - obj.rotation[axis]) * (1 - tl.spin) * Math.min(1, delta * 5);
		};
		turn(gs, "y");
		// the lying jar sways gently around its axis, so its label keeps facing the front
		pr.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.45 * tl.spin;
		// while a hero gummy has the stage the rest fades (and, on the low tier, shrinks and moves back)
		const f = tl.focus;
		if (Math.abs(f - fadeLast.current) > 0.004) {
			fadeLast.current = f;
			const k = 1 - (tier === "high" ? 0.3 : 0.6) * f;
			setOpacity(g, k);
			setOpacity(p, k);
			if (tier !== "high") {
				g.scale.setScalar(1 - 0.18 * f);
				p.scale.setScalar(1 - 0.18 * f);
			}
		}
		hero.amount = 0;
	});

	const crowd = s.gummyCount;
	const shrink = tier === "high" ? 0 : 0.3;
	return (
		<>
			{/* ground: soft real contact shadows (no network, D-82) */}
			<ContactShadows
				position={[0, 0.01, 0]}
				opacity={0.5}
				scale={22}
				blur={2.6}
				far={3.2}
				resolution={tier === "high" ? 512 : 256}
				frames={Number.POSITIVE_INFINITY}
				color="#1c2214"
			/>

			<group ref={green}>
				<group ref={greenSpin}>
					<LabeledJar
						colour="green"
						label="a"
						textureSize={s.textureSize}
						transmission={false}
						progress={progress}
					/>
					<Gummies
						colour="green"
						count={crowd}
						progress={progress}
						seed={7}
						shrink={shrink}
					/>
				</group>
			</group>

			<group ref={pink}>
				<group ref={pinkRoll}>
					{/* lay the jar down, cap to the right (+x) */}
					<group rotation={[0, 0, -Math.PI / 2]}>
						<LabeledJar
							colour="pink"
							label="a"
							textureSize={s.textureSize}
							transmission={s.transmission}
							progress={progress}
							behind={behind}
							capOffset={[-1.1, 0, 0]}
						/>
					</group>
				</group>
				<Gummies
					colour="pink"
					count={crowd}
					progress={progress}
					seed={21}
					shrink={shrink}
				/>
			</group>

			<Ambient
				colour="green"
				spots={AMBIENT[layout].green}
				progress={progress}
			/>
			<Ambient colour="pink" spots={AMBIENT[layout].pink} progress={progress} />
			<HeroGummy
				colour="green"
				tier={tier}
				layout={layout}
				progress={progress}
				state={hero}
			/>
			<HeroGummy
				colour="pink"
				tier={tier}
				layout={layout}
				progress={progress}
				state={hero}
			/>
			{tier === "high" && (
				<Suspense fallback={null}>
					<Fx progress={progress} hero={hero} />
				</Suspense>
			)}
		</>
	);
}

export default function HeroScene({
	tier,
	progress,
	layout,
	active = true,
}: {
	tier: Exclude<Tier, "none">;
	progress: MotionValue<number>;
	layout: Layout;
	/** false = stage is off screen: stop rendering (D-71) */
	active?: boolean;
}) {
	const hero = useMemo<HeroState>(
		() => ({ target: new THREE.Vector3(0, 2, 0), amount: 0 }),
		[],
	);
	const s = tierSettings(tier);
	return (
		<>
			<Canvas
				className="h-full w-full"
				dpr={s.dpr}
				frameloop={active ? "always" : "never"}
				camera={{ position: [0, 3, 12], fov: FOV }}
				gl={{ antialias: tier === "high", alpha: true }}
				role="img"
				aria-label={copy.ui.canvasDescription}
			>
				<FitCamera layout={layout} />
				<Studio />
				<Suspense fallback={null}>
					<Scene tier={tier} progress={progress} layout={layout} hero={hero} />
				</Suspense>
				{import.meta.env.DEV && <Perf position="bottom-left" minimal />}
			</Canvas>
			<LoadingScreen />
		</>
	);
}
