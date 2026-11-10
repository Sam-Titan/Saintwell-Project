import { copy } from "../content/copy";

/**
 * Green logo is the brand default (D-58): wide on desktop, stacked on mobile (D-16).
 * Fixed, so it stays while the story scrolls. Only the matching file is downloaded.
 */
export default function Header() {
	return (
		<header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-center px-6 py-4 md:justify-start md:px-12 md:py-5">
			<picture>
				<source
					media="(min-width: 768px)"
					srcSet="/images/logo-green-wide.svg"
				/>
				<img
					src="/images/logo-stacked-green-light.svg"
					alt={copy.ui.logoAlt}
					className="h-14 w-auto md:h-10"
				/>
			</picture>
		</header>
	);
}
