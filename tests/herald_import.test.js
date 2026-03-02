const { test, expect } = require("@playwright/test");
const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

test("HERALD-001: parse csv", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const out = await page.evaluate(() => {
    return GN370.IMPORT.herald.parse("house_id,house_name,blazon_ita,blazon_lat,svg_filename\nH1,Altavilla,oro e nero,aurum et nigrum,altavilla.svg");
  });
  expect(out.HOUSE.length).toBe(1);
  expect(out.HERALD[0].svg_filename).toBe("altavilla.svg");
});
