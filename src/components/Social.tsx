import { copy } from "../content/copy";

/** Instagram and Facebook as small inline outline SVGs (lucide 1.x has no brand icons, D-87). Placeholder links. */
function Instagram() {
	return (
		<svg
			viewBox="0 0 24 24"
			className="size-6"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="3" width="18" height="18" rx="5" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
		</svg>
	);
}

function Facebook() {
	return (
		<svg
			viewBox="0 0 24 24"
			className="size-6"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.4l.6-3.5H14V8.8c0-.2.1-.3.3-.3Z" />
		</svg>
	);
}

export default function Social({ className = "" }: { className?: string }) {
	const icons = [Instagram, Facebook];
	return (
		<ul className={`flex items-center gap-5 ${className}`}>
			{copy.social.map((s, i) => {
				const Icon = icons[i];
				return (
					<li key={s.name}>
						<a
							href={s.href}
							aria-label={s.name}
							className="block rounded-sm p-1"
						>
							<Icon />
						</a>
					</li>
				);
			})}
		</ul>
	);
}
