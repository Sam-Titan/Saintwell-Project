import { expect, test } from "@playwright/test";

function collectErrors(page: import("@playwright/test").Page) {
	const errors: string[] = [];
	page.on("console", (m) => {
		// favicon is added in Phase 5
		if (m.type() === "error" && !m.text().includes("404"))
			errors.push(m.text());
	});
	page.on("pageerror", (e) => errors.push(e.message));
	return errors;
}

test("hero text shows straight away", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Melatonin Gummies" }),
	).toBeVisible();
	await expect(page.getByText("Advanced Sleep Support Formula")).toBeVisible();
	await expect(
		page.getByRole("radiogroup", { name: "Jar colour" }),
	).toBeVisible();
});

test("canvas renders, no console errors, nothing from outside localhost", async ({
	page,
}) => {
	const errors = collectErrors(page);
	const external: string[] = [];
	page.on("request", (r) => {
		const u = new URL(r.url());
		if (
			!["localhost", "127.0.0.1"].includes(u.hostname) &&
			u.protocol.startsWith("http")
		)
			external.push(r.url());
	});
	await page.goto("/");
	await expect(page.locator("canvas")).toBeVisible();
	await expect(page.getByRole("progressbar")).toBeHidden({ timeout: 20000 });
	expect((await page.request.get("/models/jar.glb")).ok()).toBe(true);
	expect(errors).toEqual([]);
	expect(external).toEqual([]);
});

test("picker works with keyboard and the theme follows the jar", async ({
	page,
}) => {
	await page.goto("/");
	const green = page.getByRole("radio", { name: "Green jar" });
	const pink = page.getByRole("radio", { name: "Pink jar" });
	await expect(green).toHaveAttribute("aria-checked", "true");
	await green.focus();
	await page.keyboard.press("ArrowRight");
	await expect(pink).toHaveAttribute("aria-checked", "true");
	await expect(pink).toBeFocused();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "pink");
	expect(
		await page.evaluate(() =>
			document.documentElement.style.getPropertyValue("--night"),
		),
	).toBe("#6a1f2b");
	const b = page.getByRole("radio", { name: "Label B" });
	await b.click();
	await expect(b).toHaveAttribute("aria-checked", "true");
});

test("tier=none shows the fallback jar image, no canvas", async ({ page }) => {
	await page.goto("/?tier=none");
	await expect(page.locator("canvas")).toHaveCount(0);
	await expect(
		page.getByRole("img", { name: /Green jar, Label A/ }),
	).toBeVisible();
	await page.getByRole("radio", { name: "Pink jar" }).click();
	await expect(
		page.getByRole("img", { name: /Pink jar, Label A/ }),
	).toBeVisible();
});

test("tier=low renders without errors", async ({ page }) => {
	const errors = collectErrors(page);
	await page.goto("/?tier=low");
	await page.getByRole("radio", { name: "Pink jar" }).click();
	await expect(page.locator("canvas")).toBeVisible();
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
});

test("reduced motion: still jar, page works", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const errors = collectErrors(page);
	await page.goto("/");
	await expect(page.locator("canvas")).toBeVisible();
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
});
