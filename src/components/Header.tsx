import { copy } from "../content/copy";
import { useJar } from "../theme/JarContext";

/** Wide logo on desktop, stacked logo on mobile (D-16). Only the matching file is downloaded. */
export default function Header() {
	const { colour } = useJar();
	return (
		<header className="flex items-center justify-center px-6 py-5 md:justify-start md:px-12">
			<picture>
				<source
					media="(min-width: 768px)"
					srcSet={`/images/logo-${colour}-wide.svg`}
				/>
				<img
					src={`/images/logo-stacked-${colour}-light.svg`}
					alt={copy.ui.logoAlt}
					className="h-16 w-auto md:h-10"
				/>
			</picture>
		</header>
	);
}
