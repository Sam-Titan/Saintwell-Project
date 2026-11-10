import { expect, test } from "@playwright/test";

test("3D jar looks viewer renders without console errors", async ({ page }) => {
	const errors: string[] = [];
	page.on("console", (m) => {
		// favicon is added in Phase 5
		if (m.type() === "error" && !m.text().includes("404"))
			errors.push(m.text());
	});
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto("/");
	await expect(page.locator("canvas")).toBeVisible();
	const res = await page.request.get("/models/jar.glb");
	expect(res.ok()).toBe(true);
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
});
