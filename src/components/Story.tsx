import {
	motion,
	useInView,
	useMotionValueEvent,
	useReducedMotion,
	useScroll,
	useSpring,
	useTransform,
} from "motion/react";
import { lazy, Suspense, useEffect, useRef } from "react";
import { copy } from "../content/copy";
import { tierSettings, useDeviceTier } from "../hooks/useDeviceTier";
import { useJar } from "../theme/JarContext";
import type { Layout } from "../three/HeroScene";
import { jars } from "../three/looks";
import { timeline } from "../three/storyTimeline";
import LoaderPlate from "./LoaderPlate";
import NightSky from "./NightSky";
import { Badges, Benefits, Ingredients } from "./StoryPanels";

// three.js is only downloaded when WebGL is available
const HeroScene = lazy(() => import("../three/HeroScene"));

/** Side by side on wide screens, staggered on narrow ones. `?layout=stagger|side` overrides (testing). */
function pickLayout(): Layout {
	const q = new URLSearchParams(window.location.search).get("layout");
	if (q === "stagger" || q === "side") return q;
	// narrow phones: staggered (pink slightly behind and lower) keeps the jars bigger (D-61)
	return window.matchMedia("(max-width: 639px)").matches ? "stagger" : "side";
}

/** Same content as the story, as normal sections (reduced motion, no WebGL; D-67). */
function StaticSections() {
	return (
		<>
			<Ingredients />
			<Benefits />
			<Badges />
		</>
	);
}

function Headline() {
	return (
		<>
			<h1 className="font-bold text-4xl md:text-6xl">{copy.product.name}</h1>
			<p className="mt-2 text-lg md:text-xl">{copy.product.subtitle}</p>
		</>
	);
}

export default function Story() {
	const { progress } = useJar();
	const tier = useDeviceTier();
	const reduce = useReducedMotion() ?? false;
	const wrap = useRef<HTMLElement>(null);
	const layout = pickLayout();
	// stop rendering once the story has scrolled away (D-71)
	const onScreen = useInView(wrap, { margin: "100px" });

	// native scroll -> progress, smoothed so keyboard jumps (PageDown, Space) still feel steady
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
	const textOpacity = useTransform(progress, (p) => timeline(p).text);

	// Start loading both labels at once (swapping is not needed any more, but this keeps the first
	// frame fast). Dynamic import: three/drei stay out of the main bundle (no-WebGL path stays light).
	useEffect(() => {
		if (tier === "none") return;
		const size = tierSettings(tier).textureSize;
		import("../three/preloadLabels").then((m) => m.preloadLabels(size));
	}, [tier]);

	// no WebGL: two jar images, normal page (D-59)
	if (tier === "none") {
		return (
			<main className="mx-auto max-w-3xl px-6 pt-28 pb-12 text-center">
				<Headline />
				<div className="mt-8 grid grid-cols-2 gap-6">
					{jars.map((j) => (
						<img
							key={j.colour}
							src={`/images/jar-${j.colour}-${j.label}.webp`}
							alt={copy.ui.fallbackAlt[j.colour]}
							className="h-auto w-full object-contain"
						/>
					))}
				</div>
				<StaticSections />
			</main>
		);
	}

	return (
		<main>
			<section
				ref={wrap}
				data-story-progress="0.000"
				className={
					reduce ? "relative h-screen" : "relative h-[800vh] sm:h-[900vh]"
				}
			>
				<div className="sticky top-0 h-screen overflow-hidden">
					{!reduce && <NightSky progress={progress} layout={layout} />}
					<Suspense fallback={<LoaderPlate />}>
						<HeroScene
							tier={tier}
							progress={reduce ? undefined : progress}
							layout={layout}
							active={onScreen}
						/>
					</Suspense>
					<motion.div
						style={{ opacity: reduce ? 1 : textOpacity }}
						className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-24 text-center md:pt-24"
					>
						<Headline />
					</motion.div>
					{!reduce && (
						<>
							<Ingredients progress={progress} />
							<Benefits progress={progress} />
							<Badges progress={progress} />
						</>
					)}
				</div>
			</section>
			{reduce && <StaticSections />}
		</main>
	);
}
