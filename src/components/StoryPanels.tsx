import { FlaskConical, Leaf, WheatOff } from "lucide-react";
import {
	type MotionValue,
	motion,
	motionValue,
	useTransform,
} from "motion/react";
import type { ReactNode } from "react";
import { copy } from "../content/copy";
import { type Timeline, timeline } from "../three/storyTimeline";

/**
 * Ingredient cards, benefits and badges (D-63, D-66, D-67). All real HTML, in reading order.
 * `progress` given: overlay on the sticky stage, revealed by scroll (opacity + small lift).
 * `progress` undefined: the same content as normal static sections (reduced motion, no WebGL).
 */
type Select = (t: Timeline) => number;

/** Placeholder source for static (non-scroll) items; their opacity is always 1. */
const STATIC = motionValue(0);

/** Wraps one item. With a progress value the wrapper's opacity follows it; static = plain element. */
function Reveal({
	progress,
	select,
	className,
	children,
}: {
	progress?: MotionValue<number>;
	select: Select;
	className?: string;
	children: ReactNode;
}) {
	const opacity = useTransform(progress ?? STATIC, (p) =>
		progress ? select(timeline(p)) : 1,
	);
	const y = useTransform(opacity, (o) => (progress ? (1 - o) * 14 : 0));
	return (
		<motion.li style={{ opacity, y }} className={className}>
			{children}
		</motion.li>
	);
}

/** Left / right / left (desktop); a bottom strip on phones. */
const SIDE = [
	"left-[4%] max-sm:inset-x-4 max-sm:left-4",
	"right-[4%] max-sm:inset-x-4 max-sm:right-4",
	"left-[4%] max-sm:inset-x-4 max-sm:left-4",
] as const;
/** Sage on the green (left) side, pink on the pink (right) side; border/icons only (D-68). */
const ACCENT = ["border-sage", "border-pink", "border-sage"] as const;

function Heading({
	progress,
	select,
	children,
	id,
}: {
	progress?: MotionValue<number>;
	select: Select;
	children: ReactNode;
	id: string;
}) {
	const opacity = useTransform(progress ?? STATIC, (p) =>
		progress ? select(timeline(p)) : 1,
	);
	return (
		<motion.h2
			id={id}
			style={{ opacity }}
			className={
				progress
					? "absolute inset-x-0 top-24 text-center font-bold text-2xl text-white md:text-3xl"
					: "mb-6 text-center font-bold text-2xl text-olive md:text-3xl"
			}
		>
			{children}
		</motion.h2>
	);
}

const max3 = (a: readonly number[]) => Math.max(...a);

export function Ingredients({ progress }: { progress?: MotionValue<number> }) {
	const live = progress !== undefined;
	return (
		<section
			aria-labelledby="ingredients-h"
			className={live ? "pointer-events-none absolute inset-0" : "px-6 py-12"}
		>
			<Heading
				id="ingredients-h"
				progress={progress}
				select={(t) => max3(t.cards)}
			>
				{copy.sections.ingredients}
			</Heading>
			<ul className={live ? "" : "mx-auto grid max-w-4xl gap-4 sm:grid-cols-3"}>
				{copy.ingredients.map((ing, i) => (
					<Reveal
						key={ing.name}
						progress={progress}
						select={(t) => t.cards[i]}
						className={
							live
								? `absolute top-1/2 w-[min(22rem,28vw)] -translate-y-1/2 rounded-2xl border-2 bg-black/25 p-5 text-white max-sm:top-auto max-sm:bottom-6 max-sm:w-auto ${SIDE[i]} ${ACCENT[i]}`
								: `list-none rounded-2xl border-2 bg-white p-5 text-olive ${ACCENT[i]}`
						}
					>
						<h3 className="font-bold text-xl">{ing.name}</h3>
						<p className="mt-2 text-sm">{ing.text}</p>
					</Reveal>
				))}
			</ul>
		</section>
	);
}

export function Benefits({ progress }: { progress?: MotionValue<number> }) {
	const live = progress !== undefined;
	return (
		<section
			aria-labelledby="benefits-h"
			className={live ? "pointer-events-none absolute inset-0" : "px-6 py-12"}
		>
			<Heading
				id="benefits-h"
				progress={progress}
				select={(t) => max3(t.benefits)}
			>
				{copy.sections.benefits}
			</Heading>
			<ul
				className={
					live
						? ""
						: "mx-auto flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-4"
				}
			>
				{copy.benefits.map((b, i) => (
					<Reveal
						key={b}
						progress={progress}
						select={(t) => t.benefits[i]}
						className={
							live
								? `absolute top-1/2 w-[min(24rem,28vw)] -translate-y-1/2 font-bold font-display text-3xl text-white max-sm:top-auto max-sm:bottom-10 max-sm:w-auto max-sm:text-center max-sm:text-4xl md:text-4xl ${SIDE[i]}`
								: "list-none font-bold font-display text-3xl text-olive"
						}
					>
						{b}
					</Reveal>
				))}
			</ul>
		</section>
	);
}

const BADGE_ICONS = [Leaf, WheatOff, FlaskConical] as const;

export function Badges({ progress }: { progress?: MotionValue<number> }) {
	const live = progress !== undefined;
	return (
		<ul
			aria-label={copy.sections.badges}
			className={
				live
					? "pointer-events-none absolute inset-x-0 top-24 flex flex-wrap justify-center gap-x-8 gap-y-3 px-6 text-olive"
					: "mx-auto flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-3 px-6 py-12 text-olive"
			}
		>
			{copy.badges.map((b, i) => {
				const Icon = BADGE_ICONS[i];
				return (
					<Reveal
						key={b}
						progress={progress}
						select={(t) => t.badges[i]}
						className="flex list-none items-center gap-2 rounded-full border-2 border-olive px-4 py-2 font-medium"
					>
						<Icon aria-hidden="true" className="size-5" />
						{b}
					</Reveal>
				);
			})}
		</ul>
	);
}
