import { useState } from "react";
import { copy } from "../content/copy";
import { spriteUrl } from "../three/sprites";

/**
 * One still gummy for the static sections (reduced motion and no WebGL, D-85): frame 00 of the hero turntable.
 * Fails soft: if the sprites are not there (not rendered yet), nothing is shown.
 */
export default function StillGummy({ colour }: { colour: "green" | "pink" }) {
	const [failed, setFailed] = useState(false);
	if (failed) return null;
	return (
		<img
			src={spriteUrl(colour, 0)}
			alt={copy.ui.gummyAlt[colour]}
			width={512}
			height={512}
			loading="lazy"
			onError={() => setFailed(true)}
			className="mx-auto mb-8 block h-auto w-40 sm:w-52"
		/>
	);
}
