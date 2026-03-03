const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";

async function load(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
}

test.describe("TX-STATIC-001..002", () => {
  test("TX-STATIC-001: add tx statico writes journal entry", async ({ page }) => {
    await load(page);
    const out = await page.evaluate(async () => {
      GN370.DB_ENGINE.reset();
      await GN370.ROUTER.dispatch("add tx statico nota manuale");
      GN370.DB_ENGINE.populate({}, { source: "TEST_TX_STATICO" });
      const rows = GN370.JOURNAL.grep("nota manuale");
      const hit = rows.find((r) => r.op_type === "TX_STATIC_ADD") || null;
      return {
        count: rows.length,
        opType: hit ? hit.op_type : null,
        description: hit ? hit.description : ""
      };
    });
    expect(out.count).toBeGreaterThan(0);
    expect(out.opType).toBe("TX_STATIC_ADD");
    expect(out.description).toContain("nota manuale");
  });

  test("TX-STATIC-002: add tx statico requires text", async ({ page }) => {
    await load(page);
    const out = await page.evaluate(async () => {
      GN370.RENDER.clear();
      await GN370.ROUTER.dispatch("add tx statico");
      return document.getElementById("gn370-output").textContent;
    });
    expect(out).toContain("Uso: add tx statico <testo>");
  });
});
