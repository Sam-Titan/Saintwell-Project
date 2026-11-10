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
		window.scrollTo({
			top: s.offsetTop + p * (s.offsetHeight - window.innerHeight),
			behavior: "instant",
		});
	}, p);

test("hero text shows (one two-tone h1), and there is no jar picker", async ({
	page,
}) => {
	await page.goto("/?tier=low");
	await expect(
		page.getByRole("heading", { level: 1, name: "Restful Sleep." }),
	).toBeVisible();
	await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
	await expect(
		page.getByText("Advanced Sleep Support Formula").first(),
	).toBeVisible();
	await expect(page.getByRole("radio")).toHaveCount(0);
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
	await expect(page.locator("canvas[data-engine]").first()).toBeVisible({
		timeout: 20000,
	});
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
	// 100px of a 900vh story is a few percent, never the whole opening
	expect(await progress(page)).toBeLessThan(0.1);
});

// low tier: software WebGL here is too slow in high tier to handle key scrolling in time (no GPU).
// A fresh page per key: Chrome ignores a key scroll right after a programmatic scroll reset.
for (const key of ["PageDown", "Space", "ArrowDown", "End"]) {
	test(`keyboard scrolling: ${key} drives the story`, async ({ page }) => {
		await page.goto("/?tier=low");
		await page.mouse.click(20, 400);
		await page.keyboard.press(key);
		await expect
			.poll(() => progress(page), { timeout: 30000, message: key })
			.toBeGreaterThan(key === "ArrowDown" ? 0.005 : 0.1);
	});
}

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
	await expect(page.locator("canvas[data-engine]").first()).toBeVisible({
		timeout: 20000,
	});
	await scrollToStory(page, 0.4);
	await page.waitForTimeout(2000);
	expect(errors).toEqual([]);
});

test("reduced motion: no canvas, no tall scroll story (D-85)", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const errors = collectErrors(page);
	await page.goto("/?tier=high");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.locator("canvas[data-engine]")).toHaveCount(0);
	await expect(page.locator("section[data-story-progress]")).toHaveCount(0);
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
});
