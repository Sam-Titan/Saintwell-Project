import { type MotionValue, motion, useTransform } from "motion/react";
import { backgroundAt, rgbCss, timeline } from "../three/storyTimeline";

/**
 * Behind the canvas: one colour layer (cream, olive, maroon, dark olive from a pure function of p). It only
 * shows while the poster is up and during the cross-fade (D-94: the scene draws its own background and word).
 */
export function StageBackground({
	progress,
}: {
	progress: MotionValue<number>;
}) {
	const backgroundColor = useTransform(progress, (p) =>
		rgbCss(backgroundAt(p)),
	);
	return (
		<motion.div
			aria-hidden="true"
			style={{ backgroundColor }}
			className="pointer-events-none absolute inset-0"
			data-stage-bg
		/>
	);
}

/** Same-colour veil over the canvas for the Numbers scene: the jars are dark and faded behind the text. */
export function Veil({ progress }: { progress: MotionValue<number> }) {
	const opacity = useTransform(progress, (p) => 0.86 * timeline(p).veil);
	return (
		<motion.div
			aria-hidden="true"
			style={{ opacity }}
			className="pointer-events-none absolute inset-0 bg-dark-olive"
		/>
	);
}
