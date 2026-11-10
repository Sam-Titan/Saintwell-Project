import { FlaskConical, Leaf, WheatOff } from "lucide-react";
import type { MotionValue } from "motion/react";
import { copy } from "../content/copy";
import Reveal from "./Reveal";

const ICONS = [Leaf, WheatOff, FlaskConical] as const;

/**
 * Scene 6, "AT A GLANCE": 5 mg Melatonin, 30 Gummies, "with Chamomile & Vitamin B6", then the three
 * badges (D-79). With `progress`: overlay on the stage; without: a static section on dark olive.
 * Never "per jar" / "per gummy": the label does not say that (D-88).
 */
export default function Numbers({
	progress,
}: {
	progress?: MotionValue<number>;
}) {
	const live = progress !== undefined;
	const n = copy.numbers;
	const wrap = live
		? "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[3.2vh] text-white"
		: "flex flex-col items-center gap-10 bg-dark-olive px-6 py-20 text-white";
	return (
		<section
			id={live ? undefined : "glance"}
			aria-labelledby="glance-h"
			className={wrap}
		>
			<Reveal
				progress={progress}
				select={(t) => t.glance}
				as="h2"
				lift={0}
				className="font-bold font-poppins text-xs uppercase tracking-[0.5em] sm:text-sm"
			>
				<span id="glance-h">{copy.sections.glance}</span>
			</Reveal>
			<div className="flex items-start gap-[7vw] max-sm:gap-8">
				<Reveal
					progress={progress}
					select={(t) => t.five}
					className="text-center"
				>
					<p className="flex items-baseline justify-center font-extrabold font-inter text-[10vw] leading-none max-sm:text-[22vw]">
						{n.melatonin.value}
						<span className="ml-1 text-[3.6vw] text-sage max-sm:text-[8vw]">
							{n.melatonin.unit}
						</span>
					</p>
					<p className="mt-3 font-poppins font-semibold text-[1vw] uppercase tracking-[0.35em] max-sm:text-[0.7rem]">
						{n.melatonin.label}
					</p>
				</Reveal>
				<Reveal
					progress={progress}
					select={(t) => t.thirty}
					className="text-center"
				>
					<p className="font-extrabold font-inter text-[10vw] leading-none max-sm:text-[22vw]">
						{n.gummies.value}
					</p>
					<p className="mt-3 font-poppins font-semibold text-[1vw] uppercase tracking-[0.35em] max-sm:text-[0.7rem]">
						{n.gummies.label}
					</p>
				</Reveal>
			</div>
			<Reveal
				progress={progress}
				select={(t) => t.with}
				className="text-center font-lora font-bold text-[2.4vw] italic max-sm:text-[1.35rem]"
			>
				{n.with}
			</Reveal>
			<ul className="flex items-start gap-[5vw] max-sm:gap-5">
				{copy.badges.map((b, i) => {
					const Icon = ICONS[i];
					return (
						<Reveal
							key={b}
							as="li"
							progress={progress}
							select={(t) => t.badges[i]}
							className="flex list-none flex-col items-center gap-3"
						>
							<span className="grid size-[5.2vw] place-items-center rounded-full border border-white/70 max-sm:size-16">
								<Icon
									aria-hidden="true"
									className="size-[2.2vw] max-sm:size-7"
									strokeWidth={1.4}
								/>
							</span>
							<span className="font-poppins font-semibold text-[0.95vw] uppercase tracking-[0.3em] max-sm:text-[0.65rem]">
								{b}
							</span>
						</Reveal>
					);
				})}
			</ul>
		</section>
	);
}
