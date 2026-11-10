import { useReducedMotion } from "motion/react";
import { lazy, Suspense } from "react";
import { copy } from "../content/copy";
import { tierSettings, useDeviceTier } from "../hooks/useDeviceTier";
import { useJar } from "../theme/JarContext";
import { preloadLabels } from "../three/preloadLabels";
import LoadingScreen from "./LoadingScreen";
import RadioGroup from "./RadioGroup";

// three.js is only downloaded when WebGL is available
const HeroScene = lazy(() => import("../three/HeroScene"));

export default function Hero() {
	const { colour, label, setColour, setLabel } = useJar();
	const tier = useDeviceTier();
	const reduce = useReducedMotion() ?? false;
	if (tier !== "none") preloadLabels(tierSettings(tier).textureSize);

	return (
		<main className="mx-auto grid max-w-6xl gap-x-12 px-6 pb-12 md:grid-cols-2 md:grid-rows-[1fr_auto] md:px-12">
			<div className="flex flex-col justify-end gap-3 pt-4 text-center md:text-left">
				<h1 className="text-4xl font-bold md:text-6xl">{copy.product.name}</h1>
				<p className="text-lg md:text-xl">{copy.product.subtitle}</p>
			</div>

			<div className="relative order-2 mx-auto mt-6 aspect-[4/5] w-full max-w-md md:order-none md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:max-w-none">
				{tier === "none" ? (
					<img
						src={`/images/jar-${colour}-${label}.webp`}
						alt={copy.ui.fallbackAlt(
							copy.ui.jarOptions[colour],
							copy.ui.labelOptions[label],
						)}
						className="h-full w-full object-contain"
					/>
				) : (
					<>
						<Suspense fallback={null}>
							<HeroScene
								colour={colour}
								label={label}
								tier={tier}
								still={reduce}
							/>
						</Suspense>
						<LoadingScreen />
					</>
				)}
			</div>

			<div className="order-3 mt-6 flex flex-wrap justify-center gap-4 md:order-none md:col-start-1 md:row-start-2 md:justify-start">
				<RadioGroup
					name={copy.ui.jarPicker}
					value={colour}
					onChange={setColour}
					options={[
						{ value: "green", label: copy.ui.jarOptions.green },
						{ value: "pink", label: copy.ui.jarOptions.pink },
					]}
				/>
				<RadioGroup
					name={copy.ui.labelPicker}
					value={label}
					onChange={setLabel}
					options={[
						{ value: "a", label: copy.ui.labelOptions.a },
						{ value: "b", label: copy.ui.labelOptions.b },
					]}
				/>
			</div>
		</main>
	);
}
