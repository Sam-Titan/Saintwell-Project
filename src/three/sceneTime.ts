import { type Timeline, timeline } from "./storyTimeline";

let lastP = Number.NaN;
let last: Timeline = timeline(0);

/** timeline(p), remembered for the last p: several scene parts ask for it every frame. */
export function timelineAt(p: number): Timeline {
	if (p !== lastP) {
		lastP = p;
		last = timeline(p);
	}
	return last;
}
