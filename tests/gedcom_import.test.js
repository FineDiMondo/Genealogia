const { test, expect } = require("@playwright/test");
const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

test("GEDCOM-003: name parsing", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const mapped = await page.evaluate(() => GN370.IMPORT.gedcom.mapGedcomDate("ABT 1500"));
  expect(mapped.date).toBe("~1500");
  expect(mapped.qual).toBe("A");
});
