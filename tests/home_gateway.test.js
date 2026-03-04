const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

async function load(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await expect
    .poll(async () => page.evaluate(() => Boolean(window.__GN370_BOOT_DONE)), { timeout: 5000 })
    .toBe(true);
}

test("HMG-001: frontespizio GNHM0001 visibile al boot", async ({ page }) => {
  await load(page);
  await expect(page.locator(".gnhm-shell")).toBeVisible();
  await expect(page.locator('[data-gnhm-action="start-guided"]')).toBeVisible();
  await expect(page.locator('[data-gnhm-world]')).toHaveCount(9);
});

test("HMG-002: PF1 avvio guidato mostra home prototipo", async ({ page }) => {
  await load(page);
  await page.click('[data-gnhm-action="start-guided"]');
  await expect
    .poll(async () => page.locator("#gn370-output").innerText(), { timeout: 5000 })
    .toContain("PROTOTIPO HOME PAGE");
});

test("HMG-003: selezione mondo apre world specifico", async ({ page }) => {
  await load(page);
  await page.click('[data-gnhm-world="1"]');
  await expect
    .poll(async () => page.locator("#gn370-output").innerText(), { timeout: 5000 })
    .toContain("MONDO 1:ORIGINI");
});
