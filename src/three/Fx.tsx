import { useFrame } from "@react-three/fiber";
import {
	Bloom,
	DepthOfField,
	EffectComposer,
} from "@react-three/postprocessing";
import type { MotionValue } from "motion/react";
import { useRef, useState } from "react";
import type { HeroState } from "./HeroGummy";
import { timelineAt } from "./sceneTime";

/** Frames the composer renders at the start so its shaders compile before anyone scrolls (D-97). */
const WARM_FRAMES = 4;

/**
 * High tier only, in its own lazy chunk (D-84, D-97): depth of field to blur everything behind the hero gummy
 * and Bloom for its glow. The composer stays mounted (no first-use hitch): it warms up for a few frames, then
 * is switched off (`enabled={false}` = plain render, no extra passes) outside 4a/4b, with the effects at zero.
 * Bloom only catches the hero gummy: its rim is pushed above the threshold, nothing else gets there.
 */
export default function Fx({
	progress,
	hero,
}: {
	progress: MotionValue<number>;
	hero: HeroState;
}) {
	// biome-ignore lint/suspicious/noExplicitAny: the postprocessing effect instances are not typed by r3f
	const dof = useRef<any>(null);
	// biome-ignore lint/suspicious/noExplicitAny: same
	const bloom = useRef<any>(null);
	const frames = useRef(0);
	const [on, setOn] = useState(true);
	const onRef = useRef(true);
	useFrame(({ gl }) => {
		frames.current++;
		const f = timelineAt(progress.get()).focus;
		const want = frames.current <= WARM_FRAMES || f > 0.004;
		if (want !== onRef.current) {
			onRef.current = want;
			setOn(want);
		}
		// the composer keeps renderer.autoClear off while it is mounted; when it is switched off the plain render
		// needs it on again, or transparent things (ground shadow, word) pile up frame after frame
		gl.autoClear = !onRef.current;
		const d = dof.current;
		if (d) {
			d.bokehScale = 6 * f;
			d.target = hero.target;
		}
		if (bloom.current) bloom.current.intensity = 0.9 * f;
	});
	return (
		<EffectComposer multisampling={0} enabled={on}>
			<DepthOfField
				ref={dof}
				focalLength={0.12}
				bokehScale={0}
				worldFocusRange={2.2}
				target={hero.target}
			/>
			<Bloom
				ref={bloom}
				mipmapBlur
				luminanceThreshold={1}
				luminanceSmoothing={0.08}
				intensity={0}
				radius={0.75}
			/>
		</EffectComposer>
	);
}
