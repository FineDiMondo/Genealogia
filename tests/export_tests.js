const { test, expect } = require("@playwright/test");
const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

test("I6: export filename matches 12-digit pattern", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const name = await page.evaluate(() => GN370.DB_ENGINE.nowAAAAGGMMHHMM() + ".zip");
  expect(name).toMatch(/^\d{12}\.zip$/);
});
