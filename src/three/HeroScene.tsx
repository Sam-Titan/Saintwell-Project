import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { Perf } from "r3f-perf";
import { Suspense, useLayoutEffect, useRef } from "react";
import type * as THREE from "three";
import { copy } from "../content/copy";
import { type Tier, tierSettings } from "../hooks/useDeviceTier";
import { Gummies } from "./Gummies";
import { LabeledJar } from "./LabeledJar";
import { jars } from "./looks";
import { Studio } from "./Studio";
import { timeline } from "./storyTimeline";

export type Layout = "side" | "stagger";

/** Jar positions (jar units). Side by side, or pink slightly behind and lower (narrow phones). */
const POSITIONS: Record<Layout, readonly [number, number, number][]> = {
	side: [
		[-1.3, 0, 0],
		[1.3, 0, 0],
	],
	stagger: [
		[-0.95, 0, 0.3],
		[0.95, -0.55, -0.9],
	],
};
/** Width and height of the area that must stay in frame (jars + lifted caps + floating gummies). */
const FRAME: Record<Layout, { w: number; h: number }> = {
	side: { w: 6.9, h: 6.4 },
	stagger: { w: 5.9, h: 6.4 },
};
const FOV = 28;

/** Moves the camera back until the whole frame area fits the canvas (any aspect ratio). */
function FitCamera({ layout }: { layout: Layout }) {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const size = useThree((s) => s.size);
	const invalidate = useThree((s) => s.invalidate);
	useLayoutEffect(() => {
		const half = Math.tan((FOV / 2) * (Math.PI / 180));
		const aspect = size.width / size.height;
		const f = FRAME[layout];
		const z = Math.max(f.h / 2 / half, f.w / 2 / (aspect * half));
		camera.position.set(0, 0.5, z);
		camera.lookAt(0, 0, 0);
		camera.updateProjectionMatrix();
		invalidate();
	}, [camera, size, layout, invalidate]);
	return null;
}

function JarUnit({
	index,
	position,
	tier,
	progress,
}: {
	index: number;
	position: readonly [number, number, number];
	tier: Exclude<Tier, "none">;
	/** undefined = still jar (reduced motion) */
	progress?: MotionValue<number>;
}) {
	const look = jars[index];
	const spin = useRef<THREE.Group>(null);
	const s = tierSettings(tier);
	useFrame((_, delta) => {
		const g = spin.current;
		if (!g || !progress) return;
		const free = timeline(progress.get()).spin;
		g.rotation.y += delta * 0.35 * free;
		// when the story needs the jar facing front, ease to the nearest front position
		const front = Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2;
		g.rotation.y +=
			(front - g.rotation.y) * (1 - free) * Math.min(1, delta * 5);
	});
	return (
		<group position={[position[0], position[1] - 2.4, position[2]]}>
			<group ref={spin}>
				<LabeledJar
					colour={look.colour}
					label={look.label}
					textureSize={s.textureSize}
					transmission={s.transmission}
					progress={progress}
				/>
				<Gummies
					colour={look.colour}
					count={s.gummyCount}
					progress={progress}
					seed={7 + index * 13}
				/>
			</group>
		</group>
	);
}

export default function HeroScene({
	tier,
	progress,
	layout,
}: {
	tier: Exclude<Tier, "none">;
	/** undefined = still (reduced motion) */
	progress?: MotionValue<number>;
	layout: Layout;
}) {
	const s = tierSettings(tier);
	return (
		<Canvas
			className="h-full w-full"
			dpr={s.dpr}
			frameloop={progress ? "always" : "demand"}
			camera={{ position: [0, 0.5, 12], fov: FOV }}
			gl={{ antialias: tier === "high" }}
			role="img"
			aria-label={copy.ui.canvasDescription}
		>
			{/* real cream background (not transparent): the frosted jar blends what is behind it */}
			<color attach="background" args={["#f8f5ec"]} />
			<FitCamera layout={layout} />
			<Studio />
			<Suspense fallback={null}>
				{POSITIONS[layout].map((pos, i) => (
					<JarUnit
						// biome-ignore lint/suspicious/noArrayIndexKey: two fixed jars
						key={i}
						index={i}
						position={pos}
						tier={tier}
						progress={progress}
					/>
				))}
			</Suspense>
			{import.meta.env.DEV && <Perf position="bottom-left" minimal />}
		</Canvas>
	);
}
