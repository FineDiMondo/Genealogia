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
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await expect
    .poll(async () => page.evaluate(() => Boolean(window.__GN370_BOOT_DONE)), { timeout: 5000 })
    .toBe(true);
  const bootMs = await page.evaluate(() => Number(window.__GN370_BOOT_MS || 0));
  const terminalVisible = await page.isVisible("#gn370-prompt");
  expect(bootMs).toBeLessThan(2000);
  expect(terminalVisible).toBe(true);
});
