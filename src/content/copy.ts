/**
 * ALL site text lives here.
 * Label text is copied from the pack (docs/SPEC.md "Approved copy").
 * Everything else is [PLACEHOLDER] until SAINTWELL supplies it.
 */
const PLACEHOLDER = "[PLACEHOLDER]";

export const copy = {
	brand: "SAINTWELL",
	product: {
		name: "Melatonin Gummies",
		subtitle: "Advanced Sleep Support Formula",
		description:
			"A tasty, easy-to-take gummy with Melatonin, Chamomile & Vitamin B6 to support restful sleep.",
		melatonin: "5 mg Melatonin",
		with: "with Chamomile & Vitamin B6",
		count: "30 Gummies",
		category: "Nutraceutical",
	},
	ui: {
		loading: "Loading the jars",
		canvasDescription:
			"3D view of two SAINTWELL Melatonin Gummies jars, a green one standing and a pink one lying on its side. Scrolling opens the jars and shows the gummies, then the jars close again.",
		fallbackAlt: {
			green: "SAINTWELL Melatonin Gummies, green jar",
			pink: "SAINTWELL Melatonin Gummies, pink jar",
		},
		gummyAlt: {
			green: "A green SAINTWELL Melatonin gummy",
			pink: "A pink SAINTWELL Melatonin gummy",
		},
		logoAlt: "SAINTWELL",
	},
	nav: [
		{ label: "Ingredients", href: "#ingredients" },
		{ label: "Benefits", href: "#benefits" },
		{ label: "About", href: "#about" },
		{ label: "Contact", href: "#contact" },
	],
	menu: { open: "Open menu", close: "Close menu", label: "Menu" },
	hero: {
		left: "Restful",
		right: "Sleep.",
		leftSub: "Advanced Sleep Support Formula",
		rightSub: ["5 mg Melatonin", "with Chamomile & Vitamin B6"],
		scroll: "Scroll down",
		bottom: "30 Gummies · Nutraceutical",
	},
	social: [
		{ name: "Instagram", href: "#" },
		{ name: "Facebook", href: "#" },
	],
	sections: {
		ingredients: "Ingredients",
		benefits: "Benefits",
		glance: "At a glance",
	},
	steps: ["Ingredients", "Benefits"],
	// 4a: left column then right column (D-79)
	ingredientBlocks: [
		{ title: "Melatonin 5 mg", text: PLACEHOLDER },
		{ title: "Chamomile", text: PLACEHOLDER },
		{ title: "Vitamin B6", text: PLACEHOLDER },
		{ title: "Tasty & easy to take", text: PLACEHOLDER },
	],
	// 4b
	benefitBlocks: [
		{ title: "Calm Mind", text: PLACEHOLDER },
		{ title: "Restful Sleep", text: PLACEHOLDER },
		{ title: "Wake Refreshed", text: PLACEHOLDER },
		{ title: "Advanced sleep support formula", text: PLACEHOLDER },
	],
	numbers: {
		melatonin: { value: "5", unit: "mg", label: "Melatonin" },
		gummies: { value: "30", label: "Gummies" },
		with: "with Chamomile & Vitamin B6",
	},
	badges: ["Vegan", "Gluten Free", "Non GMO"],
	about: { heading: "About", text: PLACEHOLDER },
	contact: { heading: "Contact", text: PLACEHOLDER },
	footer: {
		contact: PLACEHOLDER,
		socials: PLACEHOLDER,
		fssai: PLACEHOLDER,
		disclaimer: PLACEHOLDER,
	},
} as const;
