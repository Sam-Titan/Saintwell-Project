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
	badges: ["Vegan", "Gluten Free", "Non GMO"],
	benefits: ["Calm Mind", "Restful Sleep", "Wake Refreshed"],
	ingredients: [
		{ name: "Melatonin 5 mg", text: PLACEHOLDER },
		{ name: "Chamomile", text: PLACEHOLDER },
		{ name: "Vitamin B6", text: PLACEHOLDER },
	],
	about: { heading: PLACEHOLDER, text: PLACEHOLDER },
	footer: {
		contact: PLACEHOLDER,
		socials: PLACEHOLDER,
		fssai: PLACEHOLDER,
		disclaimer: PLACEHOLDER,
	},
} as const;
