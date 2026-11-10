import { useFrame } from "@react-three/fiber";
import {
	Bloom,
	DepthOfField,
	EffectComposer,
} from "@react-three/postprocessing";
import type { MotionValue } from "motion/react";
import { useRef } from "react";
import type { HeroState } from "./HeroGummy";
import { timelineAt } from "./sceneTime";

/**
 * High tier only, in its own lazy chunk (D-84): Bloom for the glow around the hero gummy and
 * depth of field to blur everything behind it. Both fade in and out with `focus`.
 */
export default function Fx({
	progress,
	hero,
}: {
	progress: MotionValue<number>;
	hero: HeroState;
}) {
	// biome-ignore lint/suspicious/noExplicitAny: the postprocessing effect instance is not typed by r3f
	const dof = useRef<any>(null);
	useFrame(() => {
		const f = timelineAt(progress.get()).focus;
		const d = dof.current;
		if (d) {
			d.bokehScale = 6 * f;
			d.target = hero.target;
		}
	});
	return (
		<EffectComposer multisampling={0}>
			<DepthOfField
				ref={dof}
				focalLength={0.12}
				bokehScale={0}
				worldFocusRange={2.2}
				target={hero.target}
			/>
			<Bloom
				mipmapBlur
				luminanceThreshold={0.85}
				luminanceSmoothing={0.25}
				intensity={0.8}
				radius={0.75}
			/>
		</EffectComposer>
	);
}
