const { test, expect } = require("@playwright/test");
const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

test("I1: zero data fetch at boot", async ({ page }) => {
  const dataFetches = [];
  page.on("request", (r) => {
    if (/tables\/|\.table|\/data\//.test(r.url())) dataFetches.push(r.url());
  });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  expect(dataFetches).toHaveLength(0);
});

test("I2: DB.status EMPTY at boot", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const s = await page.evaluate(() => window.__GN370_DB_STATUS);
  expect(s).toBe("EMPTY");
});

test("I3: CTX.openedRecord null at boot", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const v = await page.evaluate(() => window.__GN370_CTX.openedRecord);
  expect(v).toBeNull();
});

test("I9: boot completes < 2000ms", async ({ page }) => {
  const t0 = Date.now();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const terminalVisible = await page.isVisible("#gn370-prompt");
  expect(Date.now() - t0).toBeLessThan(2000);
  expect(terminalVisible).toBe(true);
});
