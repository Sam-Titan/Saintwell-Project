import { type MotionValue, useMotionValue } from "motion/react";
import { createContext, type ReactNode, useContext } from "react";

type JarState = {
	/** Story scroll progress 0..1 (smoothed). A MotionValue, so scrolling does not re-render React. */
	progress: MotionValue<number>;
};

const JarContext = createContext<JarState | null>(null);

export function JarProvider({ children }: { children: ReactNode }) {
	const progress = useMotionValue(0);
	return (
		<JarContext.Provider value={{ progress }}>{children}</JarContext.Provider>
	);
}

export function useJar(): JarState {
	const ctx = useContext(JarContext);
	if (!ctx) throw new Error("useJar must be used inside JarProvider");
	return ctx;
}
