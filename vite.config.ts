import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** Preview builds (GitHub Pages workflow sets NOINDEX=1) ask search engines to stay away (D-105). */
const noindex = (): Plugin => ({
	name: "noindex",
	transformIndexHtml: () =>
		process.env.NOINDEX
			? [
					{
						tag: "meta",
						attrs: { name: "robots", content: "noindex, nofollow" },
						injectTo: "head",
					},
				]
			: [],
});

// BASE_PATH is set by the GitHub Pages workflow ("/repo-name/"); locally the site lives at "/" (D-103)
export default defineConfig({
	base: process.env.BASE_PATH ?? "/",
	plugins: [react(), tailwindcss(), noindex()],
});
