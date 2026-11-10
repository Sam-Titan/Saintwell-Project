import { expect, test } from "@playwright/test";

// Renders the hero posters from the real scene (D-93). Only runs with POSTER=1 (`just poster`).
// ?poster=1 freezes the scene at p = 0 and draws at maximum quality; we wait for several frames first.
test.skip(!process.env.POSTER, "run with `just poster`");
test.setTimeout(180000);

const sizes = [
	{ name: "desktop", width: 1920, height: 1080, scale: 1, layout: "desktop" },
	{ name: "mobile", width: 414, height: 896, scale: 2, layout: "mobile" },
];

for (const s of sizes) {
	test(`poster ${s.name}`, async ({ browser }) => {
		const ctx = await browser.newContext({
			viewport: { width: s.width, height: s.height },
			deviceScaleFactor: s.scale,
		});
		const page = await ctx.newPage();
		await page.goto(`/?tier=high&poster=1&layout=${s.layout}`);
		const canvas = page.locator("canvas[data-engine]").first();
		await expect(canvas).toBeVisible({ timeout: 60000 });
		// the first frames, the transmission pass and the font for the big word
		await page.waitForTimeout(15000);
		await canvas.screenshot({ path: `blender/out/poster-${s.name}.png` });
		await ctx.close();
	});
}
