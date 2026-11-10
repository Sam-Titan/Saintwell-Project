import { expect, type Page, test } from "@playwright/test";

const cards = ["Melatonin 5 mg", "Chamomile", "Vitamin B6"];
const benefits = ["Calm Mind", "Restful Sleep", "Wake Refreshed"];
const badges = ["Vegan", "Gluten Free", "Non GMO"];
const all = [...cards, ...benefits, ...badges];

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
		window.scrollTo(0, s.offsetTop + p * (s.offsetHeight - window.innerHeight));
	}, p);

/** Playwright's toBeVisible ignores opacity, so check the computed opacity of the item. */
const item = (page: Page, name: string) =>
	page.locator("li", { hasText: new RegExp(`^${name}`) }).first();

async function goTo(page: Page, p: number) {
	await scrollToStory(page, p);
	await expect.poll(() => progress(page), { timeout: 20000 }).toBeCloseTo(p, 1);
	// let the smoothed value settle
	await expect.poll(() => progress(page), { timeout: 20000 }).toBeCloseTo(p, 2);
}

// low tier: same story and timeline, fast enough here (no GPU)
const moments: [number, string][] = [
	[0.375, "Melatonin 5 mg"],
	[0.445, "Chamomile"],
	[0.515, "Vitamin B6"],
	[0.635, "Calm Mind"],
	[0.685, "Restful Sleep"],
	[0.735, "Wake Refreshed"],
];

for (const [p, name] of moments) {
	test(`story at p=${p}: only "${name}" is shown`, async ({ page }) => {
		await page.goto("/?tier=low");
		await goTo(page, p);
		await expect(item(page, name)).toHaveCSS("opacity", "1");
		for (const other of [...cards, ...benefits].filter((n) => n !== name)) {
			await expect(item(page, other)).toHaveCSS("opacity", "0");
		}
		for (const b of badges)
			await expect(item(page, b)).toHaveCSS("opacity", "0");
	});
}

test("night falls and the badges show in the morning", async ({ page }) => {
	await page.goto("/?tier=low");
	const night = page.locator("[data-night]");
	await expect(night).toHaveCSS("opacity", "0");
	await goTo(page, 0.5);
	await expect(night).toHaveCSS("opacity", "1");
	await goTo(page, 1);
	await expect(night).toHaveCSS("opacity", "0");
	for (const b of badges) await expect(item(page, b)).toHaveCSS("opacity", "1");
	for (const n of [...cards, ...benefits])
		await expect(item(page, n)).toHaveCSS("opacity", "0");
	// and back up: symmetric
	await goTo(page, 0.5);
	await expect(night).toHaveCSS("opacity", "1");
	for (const b of badges) await expect(item(page, b)).toHaveCSS("opacity", "0");
});

test("headings Ingredients and Benefits are real h2s", async ({ page }) => {
	await page.goto("/?tier=low");
	await expect(
		page.getByRole("heading", { level: 2, name: "Ingredients" }),
	).toHaveCount(1);
	await expect(
		page.getByRole("heading", { level: 2, name: "Benefits" }),
	).toHaveCount(1);
});

function expectStatic(label: string) {
	test(`${label}: every card, benefit and badge is readable as static content`, async ({
		page,
	}) => {
		for (const h of ["Ingredients", "Benefits"]) {
			await expect(
				page.getByRole("heading", { level: 2, name: h }),
			).toBeVisible();
		}
		for (const name of all) {
			const el = item(page, name);
			await expect(el).toBeVisible();
			await expect(el).toHaveCSS("opacity", "1");
		}
		// nothing is positioned over a sticky stage and there is no night layer
		await expect(page.locator("[data-night]")).toHaveCount(0);
		const box = await page
			.locator("section[data-story-progress]")
			.count()
			.then(async (n) =>
				n ? page.locator("section[data-story-progress]").boundingBox() : null,
			);
		if (box)
			expect(box.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
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
	await expect(page.getByRole("progressbar")).toBeHidden({ timeout: 30000 });
	for (const p of [0.12, 0.45, 0.7, 0.95]) {
		await scrollToStory(page, p);
		await page.waitForTimeout(1500);
	}
	expect(errors).toEqual([]);
	expect(external).toEqual([]);
});
