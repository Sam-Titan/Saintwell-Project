import {
	type MotionValue,
	motion,
	motionValue,
	useTransform,
} from "motion/react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { type Timeline, timeline } from "../three/storyTimeline";

/** Placeholder source for static items: their opacity is always 1. */
const STATIC = motionValue(0);

/**
 * Wrapper whose opacity (and a small lift) follows one value of the timeline.
 * Without `progress` it is a plain element (static sections: reduced motion, no WebGL).
 */
export default function Reveal({
	progress,
	select,
	className,
	style,
	children,
	lift = 14,
	as = "div",
	hideWhenOff = false,
}: {
	progress?: MotionValue<number>;
	select: (t: Timeline) => number;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
	lift?: number;
	as?: "div" | "p" | "li" | "span" | "h2";
	/** also set visibility hidden when fully off (for anything with links: keeps it out of the tab order) */
	hideWhenOff?: boolean;
}) {
	const live = progress !== undefined;
	const opacity = useTransform(progress ?? STATIC, (p) =>
		live ? select(timeline(p)) : 1,
	);
	const y = useTransform(opacity, (o) => (live ? (1 - o) * lift : 0));
	const visibility = useTransform(opacity, (o) =>
		hideWhenOff && live && o < 0.02 ? "hidden" : "visible",
	);
	const Tag = motion[as] as ElementType;
	return (
		<Tag style={{ opacity, y, visibility, ...style }} className={className}>
			{children}
		</Tag>
	);
}
