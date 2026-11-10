import Header from "./components/Header";
import Story from "./components/Story";
import { JarProvider } from "./theme/JarContext";

export default function App() {
	return (
		<JarProvider>
			<Header />
			<Story />
		</JarProvider>
	);
}
