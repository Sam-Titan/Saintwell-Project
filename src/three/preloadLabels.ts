import { useTexture } from "@react-three/drei";
import { jars, labelUrl } from "./looks";

/** Start loading both jar labels at once. Safe to call many times. */
export function preloadLabels(size: 1024 | 2048) {
	useTexture.preload(jars.map((l) => labelUrl(l, size)));
}
