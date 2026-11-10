import { useReducedMotion } from "motion/react";
import Header from "./components/Header";
import StaticStory from "./components/StaticStory";
import Story from "./components/Story";
import { useDeviceTier } from "./hooks/useDeviceTier";
import { JarProvider } from "./theme/JarContext";
import { isPoster } from "./three/mode";

export default function App() {
	const tier = useDeviceTier();
	const reduce = useReducedMotion();
	// no canvas without WebGL or with reduced motion: normal static sections (D-85)
	const live = tier !== "none" && !reduce;
	return (
		<JarProvider>
			{!isPoster() && <Header fixed={live} />}
			{live ? <Story /> : <StaticStory />}
		</JarProvider>
	);
}
