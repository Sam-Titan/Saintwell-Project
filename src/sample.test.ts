import { expect, test } from "vitest";
import { BRAND_NAME } from "./sample";

test("brand name is SAINTWELL", () => {
	expect(BRAND_NAME).toBe("SAINTWELL");
});
