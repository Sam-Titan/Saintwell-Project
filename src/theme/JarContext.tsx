import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import type { JarColour, JarLabel } from "./tokens";

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
