import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { copy } from "../content/copy";

/**
 * Loader that sits only where the jar will appear (not over the page, D-49).
 * Stacked dark logo on the night colour + progress bar; fades out into the jar.
 */
export default function LoadingScreen() {
	const { progress, active } = useProgress();
	const reduce = useReducedMotion();
	const [giveUp, setGiveUp] = useState(false);
	// Failsafe: never keep the logo up forever if a load stalls.
	useEffect(() => {
		const t = window.setTimeout(() => setGiveUp(true), 12000);
		return () => window.clearTimeout(t);
	}, []);
	const done = giveUp || (progress >= 100 && !active);
	return (
		<AnimatePresence>
			{!done && (
				<motion.div
					key="loader"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: reduce ? 0 : 0.6 }}
					className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-3xl bg-(--night)"
				>
					<img
						src="/images/logo-stacked-green-dark.svg"
						alt={copy.ui.logoAlt}
						className="h-28 w-auto"
					/>
					<div
						role="progressbar"
						aria-label={copy.ui.loading}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(progress)}
						className="h-1 w-40 overflow-hidden rounded-full bg-white/25"
					>
						<div
							className="h-full bg-white transition-[width] duration-200"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
