import { expect, test } from "@playwright/test";

test("home page shows SAINTWELL", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "SAINTWELL" })).toBeVisible();
});
