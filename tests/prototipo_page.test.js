const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

async function waitBoot(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await expect
    .poll(async () => page.evaluate(() => Boolean(window.__GN370_BOOT_DONE)), { timeout: 5000 })
    .toBe(true);
}

test("PROT-001: pagina /prototipo mostra mappa iniziale", async ({ page }) => {
  await page.goto(BASE_URL + "/prototipo/", { waitUntil: "networkidle" });
  await expect(page.locator("h1")).toContainText("Visione Web Del Prodotto Finito");
  await expect(page.locator("#proto-map-title")).toContainText("MAPPA 1");
  await expect(page.locator("#proto-canvas")).toContainText("MAPPA 1");
});

test("PROT-002: cambio mappa e variante aggiorna canvas", async ({ page }) => {
  await page.goto(BASE_URL + "/prototipo/", { waitUntil: "networkidle" });
  await page.click('[data-map="3"]');
  await page.click('[data-variant="C"]');
  await expect(page.locator("#proto-map-title")).toContainText("MAPPA 3");
  await expect(page.locator("#proto-canvas")).toContainText("WIREFRAME");
});

test("PROT-003: comando shell prototipo apre pagina dedicata", async ({ page }) => {
  await waitBoot(page);
  await page.fill("#gn370-input", "prototipo");
  await page.press("#gn370-input", "Enter");
  await expect(page).toHaveURL(/\/prototipo\/?(#.*)?$/);
});
