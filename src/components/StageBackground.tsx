import { type MotionValue, motion, useTransform } from "motion/react";
import { copy } from "../content/copy";
import { backgroundAt, rgbCss, timeline } from "../three/storyTimeline";

/**
 * Behind the transparent canvas (D-80): one colour layer (cream, olive, maroon, dark olive from a pure
 * function of p), a faint floor shade, and the giant decorative "SAINTWELL" word.
 */
export function StageBackground({
	progress,
}: {
	progress: MotionValue<number>;
}) {
	const backgroundColor = useTransform(progress, (p) =>
		rgbCss(backgroundAt(p)),
	);
	const wordOpacity = useTransform(progress, (p) => timeline(p).word);
	const light = useTransform(progress, (p) => 1 - timeline(p).dark);
	const dark = useTransform(progress, (p) => timeline(p).dark);
	const floor = useTransform(progress, (p) => 0.55 * (1 - timeline(p).dark));
	return (
		<motion.div
			aria-hidden="true"
			style={{ backgroundColor }}
			className="pointer-events-none absolute inset-0 overflow-hidden"
			data-stage-bg
		>
			<motion.div
				style={{ opacity: floor }}
				className="absolute inset-x-0 bottom-0 h-[38%] bg-linear-to-b from-transparent to-[#ece7d6]"
			/>
			<motion.div
				style={{ opacity: wordOpacity }}
				className="absolute inset-x-0 top-[44%] -translate-y-1/2 select-none text-center font-bold font-poppins text-[22vw] leading-none tracking-tight max-sm:top-[58%] max-sm:text-[27vw]"
			>
				<motion.span
					style={{ opacity: light }}
					className="absolute inset-x-0 text-olive/[0.07]"
				>
					{copy.brand}
				</motion.span>
				<motion.span
					style={{ opacity: dark }}
					className="block text-white/[0.06]"
				>
					{copy.brand}
				</motion.span>
			</motion.div>
		</motion.div>
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
