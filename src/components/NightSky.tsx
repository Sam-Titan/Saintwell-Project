import { type MotionValue, motion, useTransform } from "motion/react";
import type { Layout } from "../three/HeroScene";
import { timeline } from "../three/storyTimeline";

/**
 * Split night (D-62, D-64): two CSS layers behind the transparent canvas. A solid olive base with a
 * maroon layer on top, masked by a wide soft gradient, so there is no seam and no cream shows
 * through the middle. Wide screens: left to right. Staggered phone layout: diagonal.
 * The wrapper's opacity follows `night` (MotionValue, no React re-render while scrolling).
 */
export default function NightSky({
	progress,
	layout,
}: {
	progress: MotionValue<number>;
	layout: Layout;
}) {
	const opacity = useTransform(progress, (p) => timeline(p).night);
	const mask =
		layout === "side"
			? "linear-gradient(to right, transparent 15%, black 85%)"
			: "linear-gradient(155deg, transparent 20%, black 80%)";
	return (
		<motion.div
			aria-hidden="true"
			style={{ opacity }}
			className="pointer-events-none absolute inset-0 bg-olive"
			data-night
		>
			<div
				className="absolute inset-0 bg-maroon"
				style={{ maskImage: mask, WebkitMaskImage: mask }}
			/>
		</motion.div>
	);
}
