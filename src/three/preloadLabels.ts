import { useTexture } from "@react-three/drei";
import { labelUrl, looks } from "./looks";

/** Start loading all 4 label textures at once, so swapping looks is instant. Safe to call many times. */
export function preloadLabels(size: 1024 | 2048) {
	useTexture.preload(looks.map((l) => labelUrl(l, size)));
}
