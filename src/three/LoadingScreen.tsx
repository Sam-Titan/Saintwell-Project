import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import LoaderPlate from "../components/LoaderPlate";
import { copy } from "../content/copy";

/**
 * Progress bar part of the loader (D-49). Lives in the lazy 3D chunk because it needs drei's
 * `useProgress`. Shows the same plate as the Suspense fallback, plus the bar, and fades out
 * into the jars.
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
				>
					<LoaderPlate>
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
					</LoaderPlate>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
