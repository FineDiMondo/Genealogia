const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

async function load(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await expect
    .poll(async () => page.evaluate(() => Boolean(window.__GN370_BOOT_DONE)), { timeout: 5000 })
    .toBe(true);
}

async function runCmd(page, cmd) {
  await page.fill("#gn370-input", cmd);
  await page.press("#gn370-input", "Enter");
}

test("SALV-001: lista mostra gli zip in salvataggi", async ({ page }) => {
  await load(page);
  await runCmd(page, "lista");
  await expect
    .poll(async () => page.locator("#gn370-output").innerText(), { timeout: 5000 })
    .toContain("demo-minimo.zip");
});

test("SALV-002: carica importa zip da salvataggi", async ({ page }) => {
  await load(page);
  await runCmd(page, "carica demo-minimo.zip");
  await expect
    .poll(async () => page.locator("#gn370-output").innerText(), { timeout: 5000 })
    .toContain("CARICA OK: demo-minimo.zip");
  await expect
    .poll(async () => page.evaluate(() => window.__GN370_DB_STATUS), { timeout: 5000 })
    .toBe("READY");
  await runCmd(page, "db list");
  await expect
    .poll(async () => page.locator("#gn370-output").innerText(), { timeout: 5000 })
    .toContain("PERSON");
});
