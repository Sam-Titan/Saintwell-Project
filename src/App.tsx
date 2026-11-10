import Header from "./components/Header";
import Hero from "./components/Hero";
import { JarProvider } from "./theme/JarContext";

export default function App() {
	return (
		<JarProvider>
			<Header />
			<Hero />
		</JarProvider>
	);
}
