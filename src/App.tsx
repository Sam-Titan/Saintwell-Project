import AssetTestPage from "./components/AssetTestPage";
import { JarProvider } from "./theme/JarContext";

export default function App() {
	return (
		<JarProvider>
			<AssetTestPage />
		</JarProvider>
	);
}
