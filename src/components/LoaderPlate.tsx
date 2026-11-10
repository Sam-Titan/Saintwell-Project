import type { ReactNode } from "react";
import { copy } from "../content/copy";

/**
 * Plain placeholder where the jars will appear (D-49): stacked logo on the night colour.
 * No drei/three here, so it ships in the main bundle and is the Suspense fallback while the
 * 3D chunk downloads. The 3D chunk renders the same plate with a progress bar as `children`.
 */
export default function LoaderPlate({ children }: { children?: ReactNode }) {
	return (
		<div className="pointer-events-none absolute top-[58%] left-1/2 h-[min(46vh,22rem)] w-[min(80vw,26rem)] -translate-x-1/2 -translate-y-1/2">
			<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-3xl bg-(--night)">
				<img
					src="/images/logo-stacked-green-dark.svg"
					alt={copy.ui.logoAlt}
					className="h-28 w-auto"
				/>
				{children}
			</div>
		</div>
	);
}
