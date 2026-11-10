import { expect, type Page, test } from "@playwright/test";

function collectErrors(page: Page) {
	const errors: string[] = [];
	page.on("console", (m) => {
		// favicon is added in Phase 5
		if (m.type() === "error" && !m.text().includes("404"))
			errors.push(m.text());
	});
	page.on("pageerror", (e) => errors.push(e.message));
	return errors;
}

const progress = (page: Page) =>
	page
		.locator("section[data-story-progress]")
		.getAttribute("data-story-progress")
		.then(Number);

/** Scroll the page to story progress p (0..1). */
const scrollToStory = (page: Page, p: number) =>
	page.evaluate((p) => {
		const s = document.querySelector(
			"section[data-story-progress]",
		) as HTMLElement;
		window.scrollTo(0, s.offsetTop + p * (s.offsetHeight - window.innerHeight));
	}, p);

test("hero text shows, and there is no jar picker", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Melatonin Gummies" }),
	).toBeVisible();
	await expect(page.getByText("Advanced Sleep Support Formula")).toBeVisible();
	await expect(page.getByRole("radio")).toHaveCount(0);
	await expect(page.getByRole("button")).toHaveCount(0);
});

test("two jars render, no console errors, nothing from outside localhost", async ({
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
	await page.goto("/?tier=high");
	await expect(page.locator("canvas[data-engine]")).toBeVisible();
	await expect(page.getByRole("progressbar")).toBeHidden({ timeout: 30000 });
	await scrollToStory(page, 0.4);
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
	expect(external).toEqual([]);
});

test("scrolling drives the story and the headline fades out and back", async ({
	page,
}) => {
	await page.goto("/?tier=low");
	const h1 = page.getByRole("heading", { level: 1 });
	const fade = h1.locator(".."); // the fade is on the wrapper
	await expect(h1).toBeVisible();
	await scrollToStory(page, 0.4);
	await expect
		.poll(() => progress(page), { timeout: 15000 })
		.toBeGreaterThan(0.35);
	await expect(fade).toHaveCSS("opacity", "0");
	await scrollToStory(page, 0);
	await expect
		.poll(() => progress(page), { timeout: 15000 })
		.toBeLessThan(0.03);
	await expect(fade).toHaveCSS("opacity", "1");
});

test("a small wheel scroll does not jump past the open state", async ({
	page,
}) => {
	await page.goto("/?tier=high");
	await page.mouse.move(400, 400);
	await page.mouse.wheel(0, 100);
	await page.waitForTimeout(2000);
	// 100px of a 500vh story is a few percent, never the whole opening
	expect(await progress(page)).toBeLessThan(0.1);
});

test("keyboard scrolling (Space, PageDown, arrows) drives the story", async ({
	page,
}) => {
	// low tier: software WebGL here is too slow in high tier to handle key scrolling in time (no GPU)
	await page.goto("/?tier=low");
	await page.mouse.click(20, 400);
	for (const key of ["PageDown", "Space", "ArrowDown", "End"]) {
		await scrollToStory(page, 0);
		await expect
			.poll(() => progress(page), { timeout: 15000 })
			.toBeLessThan(0.02);
		await page.keyboard.press(key);
		await expect
			.poll(() => progress(page), { timeout: 15000, message: key })
			.toBeGreaterThan(key === "ArrowDown" ? 0.005 : 0.1);
	}
});

test("tier=none shows the two fallback jar images, no canvas", async ({
	page,
}) => {
	await page.goto("/?tier=none");
	await expect(page.locator("canvas[data-engine]")).toHaveCount(0);
	await expect(page.getByRole("img", { name: /green jar/ })).toBeVisible();
	await expect(page.getByRole("img", { name: /pink jar/ })).toBeVisible();
});

test("software renderer (headless Chromium) falls back to images by default", async ({
	page,
}) => {
	await page.goto("/");
	await expect(page.locator("canvas[data-engine]")).toHaveCount(0);
	await expect(page.getByRole("img", { name: /green jar/ })).toBeVisible();
});

test("tier=low renders without errors", async ({ page }) => {
	const errors = collectErrors(page);
	await page.goto("/?tier=low");
	await expect(page.locator("canvas[data-engine]")).toBeVisible();
	await scrollToStory(page, 0.4);
	await page.waitForTimeout(2000);
	expect(errors).toEqual([]);
});

test("reduced motion: still jars, no tall scroll story", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const errors = collectErrors(page);
	await page.goto("/?tier=high");
	await expect(page.locator("canvas[data-engine]")).toBeVisible();
	const box = await page.locator("section[data-story-progress]").boundingBox();
	expect(box?.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
	await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
		"opacity",
		"1",
	);
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
});
