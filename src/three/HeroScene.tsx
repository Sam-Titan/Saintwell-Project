import { Canvas, useFrame } from "@react-three/fiber";
import { Perf } from "r3f-perf";
import { Suspense, useRef } from "react";
import type * as THREE from "three";
import { copy } from "../content/copy";
import { type Tier, tierSettings } from "../hooks/useDeviceTier";
import type { JarColour, JarLabel } from "../theme/tokens";
import { GummiesInside } from "./GummiesInside";
import { LabeledJar } from "./LabeledJar";
import { Studio } from "./Studio";

function Turntable({
	colour,
	label,
	tier,
	still,
}: {
	colour: JarColour;
	label: JarLabel;
	tier: Exclude<Tier, "none">;
	still: boolean;
}) {
	const spin = useRef<THREE.Group>(null);
	const s = tierSettings(tier);
	useFrame((_, delta) => {
		if (!still && spin.current) spin.current.rotation.y += delta * 0.35;
	});
	return (
		<group position={[0, -1.45, 0]}>
			<group ref={spin}>
				<LabeledJar
					colour={colour}
					label={label}
					textureSize={s.textureSize}
					transmission={s.transmission}
				/>
				{colour === "pink" && (
					<GummiesInside colour="pink" count={s.gummyCount} />
				)}
			</group>
		</group>
	);
}

export default function HeroScene({
	colour,
	label,
	tier,
	still,
}: {
	colour: JarColour;
	label: JarLabel;
	tier: Exclude<Tier, "none">;
	still: boolean;
}) {
	const s = tierSettings(tier);
	return (
		<Canvas
			className="h-full w-full"
			dpr={s.dpr}
			frameloop={still ? "demand" : "always"}
			camera={{ position: [0, 0.7, 8.2], fov: 28 }}
			gl={{ antialias: tier === "high" }}
			role="img"
			aria-label={copy.ui.canvasDescription(
				copy.ui.jarOptions[colour],
				copy.ui.labelOptions[label],
			)}
		>
			{/* real cream background (not transparent): the frosted jar blends what is behind it */}
			<color attach="background" args={["#f8f5ec"]} />
			<Studio />
			<Suspense fallback={null}>
				<Turntable colour={colour} label={label} tier={tier} still={still} />
			</Suspense>
			{import.meta.env.DEV && <Perf position="bottom-left" minimal />}
		</Canvas>
	);
}
