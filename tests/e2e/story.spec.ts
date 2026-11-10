import { expect, type Page, test } from "@playwright/test";

const ingredients = [
	"Melatonin 5 mg",
	"Chamomile",
	"Vitamin B6",
	"Tasty & easy to take",
];
const benefits = [
	"Calm Mind",
	"Restful Sleep",
	"Wake Refreshed",
	"Advanced sleep support formula",
];
const badges = ["Vegan", "Gluten Free", "Non GMO"];

const progress = (page: Page) =>
	page
		.locator("section[data-story-progress]")
		.getAttribute("data-story-progress")
		.then(Number);

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

/** Playwright's toBeVisible ignores opacity, so check the computed opacity of the revealing wrapper. */
const block = (page: Page, title: string) =>
	page.locator("h3", { hasText: title }).first().locator("..");
const badge = (page: Page, name: string) =>
	page.locator("li", { hasText: new RegExp(`^${name}`) }).first();

async function goTo(page: Page, p: number) {
	await scrollToStory(page, p);
	await expect.poll(() => progress(page), { timeout: 20000 }).toBeCloseTo(p, 1);
	// let the smoothed value settle
	await expect.poll(() => progress(page), { timeout: 20000 }).toBeCloseTo(p, 2);
}

// low tier: same story and timeline, fast enough here (no GPU)
test("scene 1 hero text shows at p=0 and is gone in the settled scene", async ({
	page,
}) => {
	await page.goto("/?tier=low");
	const fade = page.getByRole("heading", { level: 1 }).locator("..");
	await expect(fade).toHaveCSS("opacity", "1");
	await goTo(page, 0.15);
	await expect(fade).toHaveCSS("opacity", "0");
	for (const t of [...ingredients, ...benefits])
		await expect(block(page, t)).toHaveCSS("opacity", "0");
});

test("scene 4a: the four ingredient blocks show, no benefits", async ({
	page,
}) => {
	await page.goto("/?tier=low");
	await goTo(page, 0.38);
	for (const t of ingredients)
		await expect(block(page, t)).toHaveCSS("opacity", "1");
	for (const t of benefits)
		await expect(block(page, t)).toHaveCSS("opacity", "0");
	await expect(page.locator("h2", { hasText: "Ingredients" })).toHaveCSS(
		"opacity",
		"1",
	);
});

test("scene 4b: the four benefit blocks show, no ingredients", async ({
	page,
}) => {
	await page.goto("/?tier=low");
	await goTo(page, 0.6);
	for (const t of benefits)
		await expect(block(page, t)).toHaveCSS("opacity", "1");
	for (const t of ingredients)
		await expect(block(page, t)).toHaveCSS("opacity", "0");
	await expect(page.locator("h2", { hasText: "Benefits" })).toHaveCSS(
		"opacity",
		"1",
	);
});

test("scene 6: numbers and badges show, blocks gone; scrolling back reverses", async ({
	page,
}) => {
	await page.goto("/?tier=low");
	await goTo(page, 1);
	await expect(page.locator("h2", { hasText: "At a glance" })).toHaveCSS(
		"opacity",
		"1",
	);
	for (const b of badges)
		await expect(badge(page, b)).toHaveCSS("opacity", "1");
	for (const t of [...ingredients, ...benefits])
		await expect(block(page, t)).toHaveCSS("opacity", "0");
	await goTo(page, 0.6);
	for (const b of badges)
		await expect(badge(page, b)).toHaveCSS("opacity", "0");
	for (const t of benefits)
		await expect(block(page, t)).toHaveCSS("opacity", "1");
});

test("nav links land with their scene fully in view", async ({ page }) => {
	await page.goto("/?tier=low");
	await page.getByRole("link", { name: "Ingredients" }).first().click();
	await expect
		.poll(() => progress(page), { timeout: 30000 })
		.toBeCloseTo(0.38, 1);
	await expect
		.poll(() => progress(page), { timeout: 30000 })
		.toBeCloseTo(0.38, 2);
	for (const t of ingredients)
		await expect(block(page, t)).toHaveCSS("opacity", "1");
	await page.getByRole("link", { name: "Benefits" }).first().click();
	await expect
		.poll(() => progress(page), { timeout: 30000 })
		.toBeCloseTo(0.6, 2);
	for (const t of benefits)
		await expect(block(page, t)).toHaveCSS("opacity", "1");
});

test("About and Contact are real sections with an h2", async ({ page }) => {
	await page.goto("/?tier=low");
	for (const h of ["About", "Contact"])
		await expect(page.getByRole("heading", { level: 2, name: h })).toHaveCount(
			1,
		);
});

test.describe("phone menu", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test("opens, traps focus, closes on Esc and returns focus, locks scroll", async ({
		page,
	}) => {
		await page.goto("/?tier=low&layout=mobile");
		const button = page.getByRole("button", { name: "Open menu" });
		await expect(button).toHaveAttribute("aria-expanded", "false");
		await button.click();
		await expect(button).toHaveAttribute("aria-expanded", "true");
		const dialog = page.getByRole("dialog", { name: "Menu" });
		await expect(dialog).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: "Close menu" }),
		).toBeFocused();
		expect(await page.evaluate(() => document.body.style.overflow)).toBe(
			"hidden",
		);
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await expect(button).toBeFocused();
		await expect(button).toHaveAttribute("aria-expanded", "false");
		expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
	});

	test("tapping a link closes the menu and scrolls to the scene", async ({
		page,
	}) => {
		await page.goto("/?tier=low&layout=mobile");
		await page.getByRole("button", { name: "Open menu" }).click();
		await page
			.getByRole("dialog", { name: "Menu" })
			.getByRole("link", { name: "Benefits" })
			.click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect
			.poll(() => progress(page), { timeout: 30000 })
			.toBeCloseTo(0.6, 1);
	});
});

function expectStatic(label: string) {
	test(`${label}: everything is readable as static content, no canvas`, async ({
		page,
	}) => {
		await expect(page.locator("canvas[data-engine]")).toHaveCount(0);
		await expect(page.locator("section[data-story-progress]")).toHaveCount(0);
		await expect(
			page.getByRole("heading", { level: 1, name: "Restful Sleep." }),
		).toBeVisible();
		for (const h of ["Ingredients", "Benefits", "At a glance", "About"]) {
			await expect(
				page.getByRole("heading", { level: 2, name: h }),
			).toBeVisible();
		}
		for (const t of [...ingredients, ...benefits]) {
			const el = block(page, t);
			await expect(el).toBeVisible();
			await expect(el).toHaveCSS("opacity", "1");
		}
		for (const b of badges) {
			await expect(badge(page, b)).toBeVisible();
			await expect(badge(page, b)).toHaveCSS("opacity", "1");
		}
		await expect(
			page.getByText("with Chamomile & Vitamin B6").last(),
		).toBeVisible();
		// nav anchors exist as sections
		for (const id of ["ingredients", "benefits", "about", "contact"])
			await expect(page.locator(`#${id}`)).toHaveCount(1);
		await expect(page.getByRole("img", { name: /green jar/ })).toBeVisible();
		await expect(page.getByRole("img", { name: /pink jar/ })).toBeVisible();
	});
}

test.describe("tier none", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/?tier=none");
	});
	expectStatic("tier=none");
});

test.describe("reduced motion", () => {
	test.beforeEach(async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/?tier=low");
	});
	expectStatic("reduced motion");

	test("nav anchor brings the section into view at once", async ({ page }) => {
		await page.getByRole("link", { name: "Benefits" }).first().click();
		await expect(page.locator("#benefits")).toBeInViewport({ ratio: 0.3 });
	});
});

test("whole story at high tier: no console errors, nothing from outside localhost", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("console", (m) => {
		if (m.type() === "error" && !m.text().includes("404"))
			errors.push(m.text());
	});
	page.on("pageerror", (e) => errors.push(e.message));
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
	await expect(page.locator("canvas[data-engine]").first()).toBeAttached({
		timeout: 30000,
	});
	for (const p of [0.1, 0.38, 0.6, 0.95]) {
		await scrollToStory(page, p);
		await page.waitForTimeout(1500);
	}
	expect(errors).toEqual([]);
	expect(external).toEqual([]);
});
