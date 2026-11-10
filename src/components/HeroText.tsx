import type { MotionValue } from "motion/react";
import { copy } from "../content/copy";
import Reveal from "./Reveal";
import Social from "./Social";

/**
 * Scene 1 text (storyboard): "Restful" (olive, Poppins 700) left and "Sleep." (maroon, Inter 800) right,
 * both inside one h1; label lines under each; scroll hints, social icons, pack line. Fades out in scene 2.
 * Phones: headline stacked at the top, centred.
 */
export default function HeroText({
	progress,
}: {
	progress: MotionValue<number>;
}) {
	const hero = (t: { hero: number }) => t.hero;
	return (
		<>
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute inset-x-[9%] top-[31%] max-sm:inset-x-0 max-sm:top-[12%]"
			>
				<h1 className="flex justify-between leading-[0.95] max-sm:flex-col max-sm:items-center">
					<span className="font-bold font-poppins text-[7.2vw] text-olive max-sm:text-[17vw]">
						{copy.hero.left}
					</span>
					<span className="font-extrabold font-inter text-[7.2vw] text-maroon max-sm:text-[17vw]">
						{copy.hero.right}
					</span>
				</h1>
			</Reveal>
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute top-[45%] left-[10%] text-olive max-sm:hidden"
			>
				<p className="whitespace-nowrap font-medium font-poppins text-[0.9vw] uppercase leading-relaxed tracking-[0.24em]">
					{copy.hero.leftSub}
				</p>
			</Reveal>
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute top-[45%] right-[10%] text-right text-maroon max-sm:hidden"
			>
				<p className="font-inter text-[1.35vw] leading-snug">
					{copy.hero.rightSub[0]}
					<br />
					{copy.hero.rightSub[1]}
				</p>
			</Reveal>
			{/* phones: one sub block under the stacked headline */}
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute inset-x-6 top-[34%] hidden text-center text-olive max-sm:block"
			>
				<p className="font-medium font-poppins text-[0.7rem] uppercase tracking-[0.28em]">
					{copy.hero.leftSub}
				</p>
				<p className="mt-2 font-inter text-sm text-maroon">
					{copy.hero.rightSub[0]} · {copy.hero.rightSub[1]}
				</p>
			</Reveal>
			{/* scroll hints (decorative) */}
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute top-1/2 left-[2.4%] -translate-y-1/2 max-sm:hidden"
			>
				<span
					aria-hidden="true"
					className="block rotate-180 font-poppins text-xs tracking-[0.4em] text-olive uppercase [writing-mode:vertical-rl]"
				>
					{copy.hero.scroll}
				</span>
			</Reveal>
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute top-1/2 right-[2.4%] -translate-y-1/2 max-sm:hidden"
			>
				<span
					aria-hidden="true"
					className="block font-poppins text-xs tracking-[0.4em] text-olive uppercase [writing-mode:vertical-rl]"
				>
					{copy.hero.scroll}
				</span>
			</Reveal>
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 sm:hidden"
			>
				<span
					aria-hidden="true"
					className="font-poppins text-[0.65rem] tracking-[0.4em] text-olive uppercase"
				>
					{copy.hero.scroll}
				</span>
			</Reveal>
			{/* bottom row: social icons left, pack line right */}
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				hideWhenOff
				className="absolute bottom-7 left-[8.5%] text-olive max-sm:bottom-14 max-sm:left-5"
			>
				<Social />
			</Reveal>
			<Reveal
				progress={progress}
				select={hero}
				lift={0}
				className="pointer-events-none absolute right-[8.5%] bottom-9 font-poppins text-olive text-xs uppercase tracking-[0.2em] max-sm:right-5 max-sm:bottom-14 max-sm:text-[0.6rem]"
			>
				{copy.hero.bottom}
			</Reveal>
		</>
	);
}
