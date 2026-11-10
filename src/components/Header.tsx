import { Menu, X } from "lucide-react";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "../assetUrl";
import { copy } from "../content/copy";
import { useJar } from "../theme/JarContext";
import { timeline } from "../three/storyTimeline";

const OLIVE: readonly [number, number, number] = [0x3e, 0x4a, 0x2f];

/**
 * Logo left, nav right (D-86). Light logo and olive text on the light scenes, white "Saint" and white
 * text on the dark ones (D-73). Fixed over the story; static pages let it scroll away (it would sit on
 * dark sections). Phones: logo + a menu button; the overlay takes focus, Esc / link tap close it, focus
 * returns to the button, the page behind does not scroll.
 */
export default function Header({ fixed }: { fixed: boolean }) {
	const { progress } = useJar();
	const reduce = useReducedMotion();
	const dark = useTransform(progress, (p) =>
		fixed && !reduce ? timeline(p).dark : 0,
	);
	const light = useTransform(dark, (d) => 1 - d);
	const color = useTransform(
		dark,
		(d) => `rgb(${OLIVE.map((c) => Math.round(c + (255 - c) * d)).join(",")})`,
	);
	const [open, setOpen] = useState(false);
	const button = useRef<HTMLButtonElement>(null);
	const overlay = useRef<HTMLDivElement>(null);

	const close = useCallback(() => {
		setOpen(false);
		document.body.style.overflow = "";
		button.current?.focus();
	}, []);

	useEffect(() => {
		if (!open) return;
		document.body.style.overflow = "hidden";
		overlay.current?.querySelector<HTMLElement>("a, button")?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
			if (e.key === "Tab") {
				// keep focus inside the overlay
				const items =
					overlay.current?.querySelectorAll<HTMLElement>("a, button");
				if (!items?.length) return;
				const first = items[0];
				const last = items[items.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [open, close]);

	const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
		e.preventDefault();
		setOpen(false);
		document.body.style.overflow = "";
		button.current?.focus({ preventScroll: true });
		document
			.getElementById(href.slice(1))
			?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
		history.replaceState(null, "", href);
	};

	return (
		<motion.header
			style={{ color }}
			className={`${fixed ? "fixed" : "absolute"} inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 md:px-[5%] md:py-7`}
		>
			<a
				href="#top"
				aria-label={copy.ui.logoAlt}
				className="relative block rounded-sm"
			>
				<motion.span style={{ opacity: light }} className="block">
					<picture>
						<source
							media="(min-width: 768px)"
							srcSet={asset("images/logo-green-wide.svg")}
						/>
						<img
							src={asset("images/logo-stacked-green-light.svg")}
							alt=""
							className="h-14 w-auto md:h-10"
						/>
					</picture>
				</motion.span>
				<motion.span
					style={{ opacity: dark }}
					className="absolute inset-0 block"
					aria-hidden="true"
				>
					<picture>
						<source
							media="(min-width: 768px)"
							srcSet={asset("images/logo-green-wide-dark.svg")}
						/>
						<img
							src={asset("images/logo-stacked-green-dark.svg")}
							alt=""
							className="h-14 w-auto md:h-10"
						/>
					</picture>
				</motion.span>
			</a>
			<nav aria-label="Main" className="max-sm:hidden">
				<ul className="flex gap-[3.4vw] font-poppins text-[1.05rem]">
					{copy.nav.map((n) => (
						<li key={n.href}>
							<a href={n.href} className="rounded-sm px-1 py-2">
								{n.label}
							</a>
						</li>
					))}
				</ul>
			</nav>
			<button
				ref={button}
				type="button"
				aria-label={copy.menu.open}
				aria-expanded={open}
				aria-controls="mobile-menu"
				onClick={() => setOpen(true)}
				className="rounded-sm p-2 sm:hidden"
			>
				<Menu aria-hidden="true" className="size-7" />
			</button>
			{open && (
				<div
					ref={overlay}
					id="mobile-menu"
					role="dialog"
					aria-modal="true"
					aria-label={copy.menu.label}
					className="fixed inset-0 z-40 flex flex-col bg-olive px-6 py-4 text-white sm:hidden"
				>
					<div className="flex justify-end">
						<button
							type="button"
							aria-label={copy.menu.close}
							onClick={close}
							className="rounded-sm p-2"
						>
							<X aria-hidden="true" className="size-7" />
						</button>
					</div>
					<ul className="mt-10 flex flex-col gap-6 font-bold font-poppins text-3xl">
						{copy.nav.map((n) => (
							<li key={n.href}>
								<a
									href={n.href}
									onClick={(e) => go(e, n.href)}
									className="block rounded-sm py-1"
								>
									{n.label}
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
		</motion.header>
	);
}
