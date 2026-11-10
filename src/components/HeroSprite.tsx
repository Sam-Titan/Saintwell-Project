import {
	type MotionValue,
	motion,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { heroSpin } from "../three/gummyPaths";
import { HERO_GUMMY_SHARE, type Layout } from "../three/poses";
import {
	SPRITE_FILL,
	SPRITE_FRAMES,
	spritesReady,
	spriteUrl,
} from "../three/sprites";
import { smooth, timeline } from "../three/storyTimeline";

const GLOW = { green: "172, 194, 88", pink: "240, 152, 178" } as const;

/** Loads the turntable frames of one colour; null until all are decoded, and for good if one fails (fail soft). */
function useFrames(colour: "green" | "pink", enabled: boolean) {
	const [frames, setFrames] = useState<HTMLImageElement[] | null>(null);
	useEffect(() => {
		if (!enabled) return;
		let dead = false;
		const imgs = Array.from({ length: SPRITE_FRAMES }, (_, k) => {
			const im = new Image();
			im.decoding = "async";
			im.src = spriteUrl(colour, k);
			return im;
		});
		Promise.all(imgs.map((im) => im.decode()))
			.then(() => {
				if (dead) return;
				spritesReady[colour] = true;
				setFrames(imgs);
			})
			.catch(() => {});
		return () => {
			dead = true;
			spritesReady[colour] = false;
		};
	}, [colour, enabled]);
	return frames;
}

/**
 * The hero gummy of 4a / 4b (D-106): a pre-rendered Blender turntable (spin plus a gentle tilt rock) drawn on a 2D
 * canvas, centred over the stage at the size and place where the real-time gummy arrives. It fades in over the last
 * part of that flight (the 3D mesh hides under it) and rotates on the same clock as the mesh. Soft CSS glow behind.
 * `enabled` = start loading (after the 3D chunk is ready). Reduced motion: frame 0, no animation.
 */
export default function HeroSprite({
	colour,
	layout,
	progress,
	enabled,
}: {
	colour: "green" | "pink";
	layout: Layout;
	progress: MotionValue<number>;
	enabled: boolean;
}) {
	const frames = useFrames(colour, enabled);
	const reduce = useReducedMotion();
	const canvas = useRef<HTMLCanvasElement>(null);
	const hero = (p: number) => {
		const t = timeline(p);
		return colour === "green" ? t.greenHero : t.pinkHero;
	};
	const opacity = useTransform(progress, (p) => smooth(0.9, 1, hero(p)));
	const glow = useTransform(progress, (p) => 0.7 * hero(p));
	const visible = useMotionValue(false);
	useEffect(() => {
		const update = () => visible.set(opacity.get() > 0.01);
		update();
		return opacity.on("change", update);
	}, [opacity, visible]);

	useEffect(() => {
		const c = canvas.current;
		if (!frames || !c) return;
		const ctx = c.getContext("2d");
		if (!ctx) return;
		let raf = 0;
		let last = "";
		let lastT = 0;
		const draw = (now: number) => {
			raf = requestAnimationFrame(draw);
			if (!visible.get() && !reduce) return;
			if (now - lastT < 33) return; // 30 fps at most
			lastT = now;
			const f = reduce
				? 0
				: ((((heroSpin(performance.now() / 1000) / (Math.PI * 2)) % 1) + 1) %
						1) *
					SPRITE_FRAMES;
			const a = Math.floor(f) % SPRITE_FRAMES;
			const w = Math.round((f - Math.floor(f)) * 8) / 8;
			const key = `${a}:${w}`;
			if (key === last) return;
			last = key;
			ctx.clearRect(0, 0, c.width, c.height);
			ctx.globalAlpha = 1;
			ctx.drawImage(frames[a], 0, 0, c.width, c.height);
			if (w > 0 && !reduce) {
				ctx.globalAlpha = w;
				ctx.drawImage(frames[(a + 1) % SPRITE_FRAMES], 0, 0, c.width, c.height);
			}
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [frames, reduce, visible]);

	// the sprite's centre = where the 3D gummy arrives: a little above the middle (HeroGummy)
	const top = layout === "mobile" ? 48 : 46;
	const size = (HERO_GUMMY_SHARE[layout] * 100) / SPRITE_FILL;
	if (!frames) return null;
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0"
			data-hero-sprite={colour}
		>
			<motion.div
				style={{
					opacity: glow,
					left: "50%",
					top: `${top}%`,
					width: `${size * 2.2}%`,
					background: `radial-gradient(closest-side, rgba(${GLOW[colour]}, 0.55), rgba(${GLOW[colour]}, 0))`,
				}}
				className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
			/>
			<motion.canvas
				ref={canvas}
				width={512}
				height={512}
				style={{ opacity, left: "50%", top: `${top}%`, width: `${size}%` }}
				className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
			/>
		</div>
	);
}
