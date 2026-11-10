/** `?poster=1`: freeze the scene at p = 0 at maximum quality, for `just poster` (D-93). */
export const isPoster = (): boolean =>
	typeof window !== "undefined" &&
	new URLSearchParams(window.location.search).has("poster");
