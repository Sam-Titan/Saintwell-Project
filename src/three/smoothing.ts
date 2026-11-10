/**
 * Scroll progress smoothing (D-100). Critically damped (damping = 2 * sqrt(stiffness * mass)): the 3D and all
 * the text ease to the scroll position in about a quarter of a second, with no overshoot. It never limits how
 * fast the user can scroll: the target always is the real scroll position.
 */
export const PROGRESS_SPRING = {
	stiffness: 300,
	damping: 34.6,
	mass: 1,
} as const;
