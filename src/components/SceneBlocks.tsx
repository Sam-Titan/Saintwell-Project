import type { MotionValue } from "motion/react";
import { copy } from "../content/copy";
import Reveal from "./Reveal";

type Which = "ingredients" | "benefits";

const CFG = {
	ingredients: {
		id: "ingredients",
		eyebrow: copy.sections.ingredients,
		blocks: copy.ingredientBlocks,
		font: "font-poppins",
		bg: "bg-olive",
	},
	benefits: {
		id: "benefits",
		eyebrow: copy.sections.benefits,
		blocks: copy.benefitBlocks,
		font: "font-inter",
		bg: "bg-maroon",
	},
} as const;

/** Where each of the 4 blocks sits on the stage (storyboard): left column, then right column. Phones: two above and two below the gummy. */
const SLOT = [
	"left-[8.3%] top-[28%] max-sm:left-6 max-sm:top-[16%]",
	"left-[8.3%] top-[53%] max-sm:left-6 max-sm:top-[29%]",
	"right-[8.3%] top-[28%] text-right max-sm:right-6 max-sm:top-[63%]",
	"right-[8.3%] top-[53%] text-right max-sm:right-6 max-sm:top-[76%]",
] as const;

function Block({
	title,
	text,
	font,
}: {
	title: string;
	text: string;
	font: string;
}) {
	return (
		<>
			<h3
				className={`font-bold ${font} text-[3.9vw] leading-[1.02] tracking-tight max-sm:text-[1.7rem]`}
			>
				{title}
			</h3>
			<p className="mt-3 font-inter text-[1.35vw] text-white/80 max-sm:mt-1.5 max-sm:text-sm">
				{text}
			</p>
		</>
	);
}

/**
 * Scenes 4a / 4b. With `progress`: overlay on the sticky stage (eyebrow + 4 blocks, revealed one after another).
 * Without: a static section on the scene colour (reduced motion, no WebGL; D-85).
 */
export default function SceneBlocks({
	which,
	progress,
}: {
	which: Which;
	progress?: MotionValue<number>;
}) {
	const c = CFG[which];
	const live = progress !== undefined;
	const eyebrowSel = (t: {
		eyebrowIngredients: number;
		eyebrowBenefits: number;
	}) => (which === "ingredients" ? t.eyebrowIngredients : t.eyebrowBenefits);
	const blockSel =
		(i: number) =>
		(t: { ingredients: readonly number[]; benefits: readonly number[] }) =>
			which === "ingredients" ? t.ingredients[i] : t.benefits[i];
	const eyebrowClass = `text-center font-bold ${c.font} text-xs uppercase tracking-[0.5em] text-white sm:text-sm`;
	if (!live) {
		return (
			<section
				id={c.id}
				aria-labelledby={`${c.id}-h`}
				className={`${c.bg} px-6 py-16 text-white md:px-16`}
			>
				<h2 id={`${c.id}-h`} className={`${eyebrowClass} mb-10`}>
					{c.eyebrow}
				</h2>
				<div className="mx-auto grid max-w-5xl gap-x-12 gap-y-10 sm:grid-cols-2">
					{c.blocks.map((b, i) => (
						<div key={b.title} className={i % 2 === 1 ? "sm:text-right" : ""}>
							<Block title={b.title} text={b.text} font={c.font} />
						</div>
					))}
				</div>
			</section>
		);
	}
	return (
		<section
			aria-labelledby={`${c.id}-h`}
			className="pointer-events-none absolute inset-0 text-white"
		>
			<Reveal
				progress={progress}
				select={eyebrowSel}
				as="h2"
				lift={0}
				className={`${eyebrowClass} absolute inset-x-0 top-[16.5%] max-sm:top-[10%]`}
			>
				<span id={`${c.id}-h`}>{c.eyebrow}</span>
			</Reveal>
			{c.blocks.map((b, i) => (
				<Reveal
					key={b.title}
					progress={progress}
					select={blockSel(i)}
					className={`absolute max-w-[30vw] max-sm:max-w-[62vw] ${SLOT[i]}`}
				>
					<Block title={b.title} text={b.text} font={c.font} />
				</Reveal>
			))}
		</section>
	);
}
