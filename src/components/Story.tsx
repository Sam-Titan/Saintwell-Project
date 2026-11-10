import {
	motion,
	useInView,
	useMotionValueEvent,
	useScroll,
	useSpring,
} from "motion/react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { asset } from "../assetUrl";
import { copy } from "../content/copy";
import { tierSettings, useDeviceTier } from "../hooks/useDeviceTier";
import { useJar } from "../theme/JarContext";
import { isPoster } from "../three/mode";
import type { Layout } from "../three/poses";
import { PROGRESS_SPRING } from "../three/smoothing";
import { ANCHORS } from "../three/storyTimeline";
import HeroText from "./HeroText";
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
	// critically damped (damping = 2 * sqrt(stiffness * mass)): the 3D and all text ease to the scroll
	// position in about 0.25 s, nothing limits the scroll speed (D-100)
	const smoothed = useSpring(scrollYProgress, PROGRESS_SPRING);
	// the poster hero (D-92): static image first, 3D loads behind it, cross-fades in on the first scroll
	const poster = isPoster();
	const [load3d, setLoad3d] = useState(poster);
	const [ready, setReady] = useState(false);
	const [scrolled, setScrolled] = useState(poster);
	const onReady = useCallback(() => setReady(true), []);
	useMotionValueEvent(smoothed, "change", (v) => {
		progress.set(v);
		wrap.current?.setAttribute("data-story-progress", v.toFixed(3));
	});
	// "scrolled" = the user has moved the page (also true after a reload that restores the scroll position)
	useEffect(() => {
		const check = () => {
			if (window.scrollY > 4) setScrolled(true);
		};
		check();
		window.addEventListener("scroll", check, { passive: true });
		return () => window.removeEventListener("scroll", check);
	}, []);
	useEffect(() => {
		if (load3d) return;
		const start = () => {
			const ric =
				window.requestIdleCallback ??
				((cb: () => void) => window.setTimeout(cb, 300));
			ric(() => setLoad3d(true));
		};
		if (document.readyState === "complete") start();
		else window.addEventListener("load", start, { once: true });
		return () => window.removeEventListener("load", start);
	}, [load3d]);
	const show3d = ready && scrolled;

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
				className="relative h-[700vh] sm:h-[800vh]"
			>
				<div className="sticky top-0 h-screen overflow-hidden">
					<StageBackground progress={progress} />
					{!poster && (
						<motion.picture
							initial={false}
							animate={{ opacity: show3d ? 0 : 1 }}
							transition={{ duration: 0.35 }}
							style={{ pointerEvents: "none" }}
							className="absolute inset-0 block"
							data-hero-poster
						>
							<source
								media="(max-width: 639px)"
								srcSet={asset("images/poster-mobile.webp")}
							/>
							<img
								src={asset("images/poster-desktop.webp")}
								alt={copy.ui.canvasDescription}
								fetchPriority="high"
								className="h-full w-full object-cover"
							/>
						</motion.picture>
					)}
					{load3d && (
						<motion.div
							initial={false}
							animate={{ opacity: show3d || poster ? 1 : 0 }}
							transition={{ duration: 0.35 }}
							aria-hidden={!(show3d || poster)}
							data-hero-3d
							className="absolute inset-0"
						>
							<Suspense fallback={null}>
								<HeroScene
									tier={tier}
									progress={progress}
									layout={layout}
									active={onScreen && (!ready || scrolled)}
									onReady={onReady}
								/>
							</Suspense>
						</motion.div>
					)}
					{/* poster mode (`just poster`): the scene alone, no page text over it */}
					{!poster && (
						<>
							<Veil progress={progress} />
							<HeroText progress={progress} />
							<SceneBlocks which="ingredients" progress={progress} />
							<SceneBlocks which="benefits" progress={progress} />
							<StepMarker progress={progress} />
							<Numbers progress={progress} />
						</>
					)}
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
