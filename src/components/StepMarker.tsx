import { type MotionValue, motion, useTransform } from "motion/react";
import { copy } from "../content/copy";
import { timeline } from "../three/storyTimeline";
import Reveal from "./Reveal";

/** "01 INGREDIENTS  02 BENEFITS" at the bottom; the active step is bright (decorative, aria-hidden). */
export default function StepMarker({
	progress,
}: {
	progress: MotionValue<number>;
}) {
	const first = useTransform(progress, (p) => 1 - 0.58 * timeline(p).step);
	const second = useTransform(progress, (p) => 0.42 + 0.58 * timeline(p).step);
	return (
		<Reveal
			progress={progress}
			select={(t) => t.marker}
			lift={0}
			className="pointer-events-none absolute inset-x-0 bottom-[4.5%] flex justify-center gap-8 font-bold font-poppins text-white text-xs uppercase tracking-[0.3em]"
		>
			<span aria-hidden="true" className="flex gap-8">
				<motion.span style={{ opacity: first }}>01 {copy.steps[0]}</motion.span>
				<motion.span style={{ opacity: second }}>
					02 {copy.steps[1]}
				</motion.span>
			</span>
		</Reveal>
	);
}
