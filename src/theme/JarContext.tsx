import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { type JarColour, type JarLabel, themes } from "./tokens";

type JarState = {
	colour: JarColour;
	label: JarLabel;
	setColour: (colour: JarColour) => void;
	setLabel: (label: JarLabel) => void;
};

const JarContext = createContext<JarState | null>(null);

export function JarProvider({ children }: { children: ReactNode }) {
	const [colour, setColour] = useState<JarColour>("green");
	const [label, setLabel] = useState<JarLabel>("a");
	// Theme follows the jar (D-13): CSS variables on <html>, values from tokens.ts
	useEffect(() => {
		const t = themes[colour];
		const root = document.documentElement.style;
		root.setProperty("--night", t.night);
		root.setProperty("--accent", t.accent);
		root.setProperty("--font-body", t.fontBody);
		root.setProperty("--font-display", t.fontDisplay);
		root.setProperty("--jar-colour", colour);
		document.documentElement.dataset.theme = colour;
	}, [colour]);
	const value = useMemo(
		() => ({ colour, label, setColour, setLabel }),
		[colour, label],
	);
	return <JarContext.Provider value={value}>{children}</JarContext.Provider>;
}

export function useJar(): JarState {
	const ctx = useContext(JarContext);
	if (!ctx) throw new Error("useJar must be used inside JarProvider");
	return ctx;
}
