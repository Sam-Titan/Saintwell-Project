import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// BASE_PATH is set by the GitHub Pages workflow ("/repo-name/"); locally the site lives at "/" (D-103)
export default defineConfig({
	base: process.env.BASE_PATH ?? "/",
	plugins: [react(), tailwindcss()],
});
