import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import {
	lazy,
	Suspense,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import * as THREE from "three";
import { copy } from "../content/copy";
import { type Tier, tierSettings } from "../hooks/useDeviceTier";
import { FpsMeter } from "./FpsMeter";
import { Ambient, Gummies } from "./Gummies";
import { HeroGummy, type HeroState } from "./HeroGummy";
import { LabeledJar } from "./LabeledJar";
import { isPoster } from "./mode";
import {
	AMBIENT,
	CAP_STASH_SCALE,
	cameraFor,
	capStashLocal,
	FOV,
	HERO_RAISE,
	type Layout,
	unitPosition,
} from "./poses";
import { Studio } from "./Studio";
import { timelineAt } from "./sceneTime";
import { backgroundAt, rgbCss } from "./storyTimeline";
import { WordPlane } from "./WordPlane";

export type { Layout };

// Bloom + depth of field: own chunk, fetched on the high tier only (D-84)
const Fx = lazy(() => import("./Fx"));

// r3f-perf is a dev tool only (D-99): never part of the production build
const Perf = import.meta.env.DEV
	? lazy(() => import("r3f-perf").then((m) => ({ default: m.Perf })))
	: null;

/** Puts the camera where `cameraFor` says (any aspect ratio; keeps top / bottom space clear). */
function FitCamera({ layout }: { layout: Layout }) {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const size = useThree((s) => s.size);
	const invalidate = useThree((s) => s.invalidate);
	useLayoutEffect(() => {
		const { position, target } = cameraFor(layout, size.width / size.height);
		camera.position.set(...position);
		camera.lookAt(...target);
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
	const poster = useMemo(isPoster, []);
	const scene = useThree((st) => st.scene);
	const green = useRef<THREE.Group>(null);
	const greenSpin = useRef<THREE.Group>(null);
	const pink = useRef<THREE.Group>(null);
	const pinkRoll = useRef<THREE.Group>(null);
	const fadeLast = useRef(-1);
	// the scene draws its own background (D-94): colour from backgroundAt(p), updated every frame.
	// It is also what the frosted jar sees through its glass (the D-51 fix).
	const behind = useMemo(() => new THREE.Color(), []);
	useLayoutEffect(() => {
		behind.setStyle(rgbCss(backgroundAt(progress.get())));
		scene.background = behind;
		return () => {
			scene.background = null;
		};
	}, [scene, behind, progress]);
	const capStash = useMemo(
		() => ({
			green: capStashLocal(layout, "green"),
			pink: capStashLocal(layout, "pink"),
		}),
		[layout],
	);
	// shadows are redrawn only while something moves (D-99)
	const lastP = useRef(-1);
	const still = useRef(0);
	const [shadowFrames, setShadowFrames] = useState(Number.POSITIVE_INFINITY);
	const shadowMode = useRef(Number.POSITIVE_INFINITY);

	useFrame((state) => {
		const { clock } = state;
		const p = progress.get();
		const tl = timelineAt(p);
		behind.setStyle(rgbCss(backgroundAt(p)));
		const g = green.current;
		const gs = greenSpin.current;
		const pk = pink.current;
		const pr = pinkRoll.current;
		if (!g || !gs || !pk || !pr) return;
		const gp = unitPosition(layout, "green", tl.settle);
		const pp = unitPosition(layout, "pink", tl.settle);
		g.position.set(gp[0], gp[1], gp[2]);
		pk.position.set(pp[0], pp[1], pp[2]);
		// both jars sway gently while they are free, so their labels always stay readable (D-96)
		const time = poster ? 0 : clock.elapsedTime;
		gs.rotation.y = Math.sin(time * 0.45) * 0.25 * tl.spin;
		pr.rotation.x = Math.sin(time * 0.5 + 1) * 0.25 * tl.spin;
		// while a hero gummy has the stage the rest fades (and, on the low tier, shrinks and moves back)
		const f = tl.focus;
		if (Math.abs(f - fadeLast.current) > 0.004) {
			fadeLast.current = f;
			const k = 1 - (tier === "high" ? 0.3 : 0.6) * f;
			setOpacity(g, k);
			setOpacity(pk, k);
			if (tier !== "high") {
				g.scale.setScalar(1 - 0.18 * f);
				pk.scale.setScalar(1 - 0.18 * f);
			}
		}
		hero.amount = 0;
		// the view starts raised, so the jars sit lower under the headline; it settles with the jars (D-96)
		const cam = state.camera as THREE.PerspectiveCamera;
		const c = cameraFor(
			layout,
			state.size.width / state.size.height,
			HERO_RAISE[layout] * (1 - tl.settle),
		);
		cam.position.set(...c.position);
		cam.lookAt(...c.target);
		// contact shadows: redraw while p changes or a jar still sways; rest otherwise
		const moving = Math.abs(p - lastP.current) > 1e-4 || tl.spin > 0.001;
		lastP.current = p;
		still.current = moving ? 0 : still.current + 1;
		const want = still.current > 20 ? 1 : Number.POSITIVE_INFINITY;
		if (want !== shadowMode.current) {
			shadowMode.current = want;
			setShadowFrames(want);
		}
	});

	const crowd = s.gummyCount;
	const shrink = tier === "high" ? 0 : 0.3;
	return (
		<>
			{/* the giant faint SAINTWELL word, drawn in the scene (D-94) */}
			<WordPlane layout={layout} progress={progress} />
			{/* ground: soft real contact shadows (no network, D-82) */}
			<ContactShadows
				position={[0, -0.015, 0]}
				opacity={0.55}
				scale={tier === "high" ? 11 : 12}
				blur={3.2}
				far={2.6}
				resolution={tier === "high" ? 1024 : 512}
				frames={shadowFrames}
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
						capStash={capStash.green}
						capStashScale={CAP_STASH_SCALE}
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
							capStash={capStash.pink}
							capStashScale={CAP_STASH_SCALE}
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
		</>
	);
}

/** Tells the page the first frame has been drawn (the poster can fade out). */
function ReadySignal({ onReady }: { onReady: () => void }) {
	const done = useRef(false);
	const frames = useRef(0);
	useFrame(() => {
		if (done.current) return;
		// a few frames, so textures and the first transmission pass are in
		if (++frames.current >= 4) {
			done.current = true;
			onReady();
		}
	});
	return null;
}

export default function HeroScene({
	tier,
	progress,
	layout,
	active = true,
	onReady,
}: {
	tier: Exclude<Tier, "none">;
	progress: MotionValue<number>;
	layout: Layout;
	/** false = stage is off screen: stop rendering (D-71) */
	active?: boolean;
	/** called once, after the first frames are drawn */
	onReady?: () => void;
}) {
	const hero = useMemo<HeroState>(
		() => ({ target: new THREE.Vector3(0, 2, 0), amount: 0 }),
		[],
	);
	const s = tierSettings(tier);
	const poster = useMemo(isPoster, []);
	const [fx, setFx] = useState(false);
	// effects (high tier): fetched and compiled at idle, then they stay mounted (D-97)
	useEffect(() => {
		if (tier !== "high") return;
		const ric =
			window.requestIdleCallback ??
			((cb: () => void) => window.setTimeout(cb, 600));
		const id = ric(() => setFx(true));
		return () => {
			if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
		};
	}, [tier]);
	return (
		<Canvas
			className="h-full w-full"
			dpr={poster ? [2, 2] : s.dpr}
			frameloop={active ? "always" : "never"}
			camera={{ position: [0, 3, 12], fov: FOV }}
			gl={{ antialias: tier === "high", alpha: false }}
			// the scene draws its own background; render targets (contact shadows) must clear to transparent
			onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
			role="img"
			aria-label={copy.ui.canvasDescription}
		>
			<FitCamera layout={layout} />
			<Studio />
			<Suspense fallback={null}>
				<Scene tier={tier} progress={progress} layout={layout} hero={hero} />
				{onReady && <ReadySignal onReady={onReady} />}
			</Suspense>
			{tier === "high" && fx && (
				<Suspense fallback={null}>
					<Fx progress={progress} hero={hero} />
				</Suspense>
			)}
			{!poster && new URLSearchParams(window.location.search).has("fps") && (
				<FpsMeter progress={progress} />
			)}
			{Perf && !poster && (
				<Suspense fallback={null}>
					<Perf position="bottom-left" minimal />
				</Suspense>
			)}
		</Canvas>
	);
}
