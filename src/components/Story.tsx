import {
	useInView,
	useMotionValueEvent,
	useScroll,
	useSpring,
} from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { tierSettings, useDeviceTier } from "../hooks/useDeviceTier";
import { useJar } from "../theme/JarContext";
import type { Layout } from "../three/poses";
import { ANCHORS } from "../three/storyTimeline";
import HeroText from "./HeroText";
import LoaderPlate from "./LoaderPlate";
import Numbers from "./Numbers";
import SceneBlocks from "./SceneBlocks";
import { StageBackground, Veil } from "./StageBackground";
import StepMarker from "./StepMarker";
import Stubs from "./Stubs";

// three.js is only downloaded when WebGL is available and motion is allowed
const HeroScene = lazy(() => import("../three/HeroScene"));

/** desktop / mobile layout: phones (< 640 px) get the stacked layout. `?layout=mobile|desktop` overrides (testing). */
function pickLayout(): Layout {
	const q = new URLSearchParams(window.location.search).get("layout");
	if (q === "mobile" || q === "desktop") return q;
	return window.matchMedia("(max-width: 639px)").matches ? "mobile" : "desktop";
}

function useLayout(): Layout {
	const [layout, setLayout] = useState<Layout>(pickLayout);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 639px)");
		const on = () => setLayout(pickLayout());
		mq.addEventListener("change", on);
		return () => mq.removeEventListener("change", on);
	}, []);
	return layout;
}

/** The scroll story (D-79): one sticky stage inside a 900vh (800vh on phones) section. Only used with WebGL and motion. */
export default function Story() {
	const { progress } = useJar();
	const tier = useDeviceTier() as "high" | "low";
	const layout = useLayout();
	const wrap = useRef<HTMLElement>(null);
	// stop rendering once the story has scrolled away (D-71)
	const onScreen = useInView(wrap, { margin: "100px" });

	// native scroll -> progress, smoothed so keyboard jumps (PageDown, Space) and nav links still feel steady
	const { scrollYProgress } = useScroll({
		target: wrap,
		offset: ["start start", "end end"],
	});
	const smoothed = useSpring(scrollYProgress, {
		stiffness: 120,
		damping: 30,
		mass: 0.5,
	});
	useMotionValueEvent(smoothed, "change", (v) => {
		progress.set(v);
		wrap.current?.setAttribute("data-story-progress", v.toFixed(3));
	});

	// start loading the labels at once; dynamic import keeps three/drei out of the main bundle
	useEffect(() => {
		const size = tierSettings(tier).textureSize;
		import("../three/preloadLabels").then((m) => m.preloadLabels(size));
	}, [tier]);

	return (
		<main id="top">
			<section
				ref={wrap}
				data-story-progress="0.000"
				className="relative h-[800vh] sm:h-[900vh]"
			>
				<div className="sticky top-0 h-screen overflow-hidden">
					<StageBackground progress={progress} />
					<Suspense fallback={<LoaderPlate />}>
						<HeroScene
							tier={tier}
							progress={progress}
							layout={layout}
							active={onScreen}
						/>
					</Suspense>
					<Veil progress={progress} />
					<HeroText progress={progress} />
					<SceneBlocks which="ingredients" progress={progress} />
					<SceneBlocks which="benefits" progress={progress} />
					<StepMarker progress={progress} />
					<Numbers progress={progress} />
				</div>
				{/* nav targets: each sits where its scene is fully in view (D-86) */}
				<span
					id="ingredients"
					aria-hidden="true"
					className="absolute left-0 h-px w-px"
					style={{ top: `calc((100% - 100vh) * ${ANCHORS.ingredients})` }}
				/>
				<span
					id="benefits"
					aria-hidden="true"
					className="absolute left-0 h-px w-px"
					style={{ top: `calc((100% - 100vh) * ${ANCHORS.benefits})` }}
				/>
			</section>
			<Stubs />
		</main>
	);
}
