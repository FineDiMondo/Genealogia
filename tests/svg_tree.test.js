const { test, expect } = require("@playwright/test");
const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

test("HERALD-005: SVG tree renders", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const svg = await page.evaluate(() => GN370.SVG.tree.build({ root: "GNP000000001", depth: 3 }));
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg.includes("GNP000000001")).toBe(true);
});
