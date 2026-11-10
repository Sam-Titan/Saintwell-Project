import { useRef } from "react";

type Option<T extends string> = { value: T; label: string };

/**
 * Real buttons with radio-group semantics. Roving tabindex; arrow keys move and select.
 */
export default function RadioGroup<T extends string>({
	name,
	options,
	value,
	onChange,
}: {
	name: string;
	options: readonly Option<T>[];
	value: T;
	onChange: (v: T) => void;
}) {
	const refs = useRef<(HTMLButtonElement | null)[]>([]);
	const move = (from: number, step: number) => {
		const next = (from + step + options.length) % options.length;
		onChange(options[next].value);
		refs.current[next]?.focus();
	};
	return (
		<div
			role="radiogroup"
			aria-label={name}
			className="inline-flex gap-1 rounded-full border-2 border-(--night) p-1"
		>
			{options.map((o, i) => {
				const checked = o.value === value;
				return (
					// biome-ignore lint/a11y/useSemanticElements: real buttons with radio semantics, as required (arrow keys + roving tabindex)
					<button
						key={o.value}
						ref={(el) => {
							refs.current[i] = el;
						}}
						type="button"
						role="radio"
						aria-checked={checked}
						tabIndex={checked ? 0 : -1}
						onClick={() => onChange(o.value)}
						onKeyDown={(e) => {
							if (e.key === "ArrowRight" || e.key === "ArrowDown") {
								e.preventDefault();
								move(i, 1);
							} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
								e.preventDefault();
								move(i, -1);
							}
						}}
						className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-colors ${
							checked
								? "bg-(--night) text-white"
								: "bg-transparent text-(--night) hover:bg-(--night)/10"
						}`}
					>
						{o.label}
					</button>
				);
			})}
		</div>
	);
}
