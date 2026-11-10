import { asset } from "../assetUrl";
import { copy } from "../content/copy";
import Numbers from "./Numbers";
import SceneBlocks from "./SceneBlocks";
import Social from "./Social";
import Stubs from "./Stubs";

/**
 * Reduced motion and no WebGL (D-85): no canvas. Hero with the PDF jar mockups (pink one turned to lie
 * across the green one), then Ingredients, Benefits and Numbers as normal sections on their scene colours.
 */
export default function StaticStory() {
	return (
		<main id="top">
			<section className="relative overflow-hidden bg-cream px-6 pt-28 pb-14 text-center md:px-[9%]">
				<h1 className="flex flex-col items-center justify-center gap-0 leading-[0.95] md:flex-row md:justify-between">
					<span className="font-bold font-poppins text-[17vw] text-olive md:text-[7.2vw]">
						{copy.hero.left}
					</span>
					<span className="font-extrabold font-inter text-[17vw] text-maroon md:text-[7.2vw]">
						{copy.hero.right}
					</span>
				</h1>
				<div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row md:items-start">
					<p className="font-medium font-poppins text-olive text-xs uppercase tracking-[0.3em] md:max-w-[22rem] md:text-left">
						{copy.hero.leftSub}
					</p>
					<p className="font-inter text-maroon md:text-right">
						{copy.hero.rightSub[0]}
						<br />
						{copy.hero.rightSub[1]}
					</p>
				</div>
				<div className="relative mx-auto mt-6 h-[22rem] w-full max-w-xl sm:h-[26rem]">
					<img
						src={asset("images/jar-green-a.webp")}
						alt={copy.ui.fallbackAlt.green}
						className="absolute top-0 left-[8%] h-[85%] w-auto mix-blend-multiply"
					/>
					<img
						src={asset("images/jar-pink-a.webp")}
						alt={copy.ui.fallbackAlt.pink}
						className="absolute right-[2%] bottom-[2%] h-[62%] w-auto rotate-90 mix-blend-multiply"
					/>
				</div>
				<div className="mt-6 flex items-center justify-between text-olive">
					<Social />
					<p className="font-poppins text-xs uppercase tracking-[0.2em]">
						{copy.hero.bottom}
					</p>
				</div>
			</section>
			<SceneBlocks which="ingredients" />
			<SceneBlocks which="benefits" />
			<Numbers />
			<Stubs />
		</main>
	);
}
