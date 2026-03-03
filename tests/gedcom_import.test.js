const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";
const FIXTURES = {
  giardina: fs.readFileSync(path.join(__dirname, "../test-fixtures/sample-giardina.ged"), "utf8"),
  conflict: fs.readFileSync(path.join(__dirname, "../test-fixtures/sample-conflict.ged"), "utf8"),
  merge: fs.readFileSync(path.join(__dirname, "../test-fixtures/sample-merge.ged"), "utf8"),
  implicit: fs.readFileSync(path.join(__dirname, "../test-fixtures/sample-implicit-family.ged"), "utf8")
};

async function load(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
}

test.describe("TOK-001..010", () => {
  test("TOK-001: basic tokenization", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => GN370.IMPORT.gedcomTokenizer.tokenize(txt).stats.total, FIXTURES.giardina);
    expect(out).toBeGreaterThan(0);
  });

  test("TOK-002/TOK-003: level and xref", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      const t = GN370.IMPORT.gedcomTokenizer.tokenize(txt).tokens;
      return { hasLevel0: t.some((x) => x.level === 0), hasXref: t.some((x) => /^@.+@$/.test(x.xref)) };
    }, FIXTURES.giardina);
    expect(out.hasLevel0).toBe(true);
    expect(out.hasXref).toBe(true);
  });

  test("TOK-004/TOK-005: CONT and CONC support", async ({ page }) => {
    await load(page);
    const text = "0 @I1@ INDI\n1 NOTE Riga1\n2 CONT Riga2\n2 CONC_R WRONG\n2 CONC Riga3";
    const out = await page.evaluate((txt) => {
      const t = GN370.IMPORT.gedcomTokenizer.tokenize(txt).tokens;
      return {
        hasCont: t.some((x) => x.tag === "CONT" && x.continuation === "C"),
        hasConc: t.some((x) => x.tag === "CONC" && x.continuation === "N")
      };
    }, text);
    expect(out.hasCont).toBe(true);
    expect(out.hasConc).toBe(true);
  });

  test("TOK-006/TOK-007: version and encoding detection", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => GN370.IMPORT.gedcomTokenizer.tokenize(txt).stats, FIXTURES.implicit);
    expect(out.version).toBeTruthy();
    expect(out.encoding).toBeTruthy();
  });

  test("TOK-008/TOK-009: empty and invalid line", async ({ page }) => {
    await load(page);
    const out = await page.evaluate(() => ({
      empty: GN370.IMPORT.gedcomTokenizer.tokenize("").stats.total,
      invalid: GN370.IMPORT.gedcomTokenizer.tokenize("BAD LINE").stats.invalid
    }));
    expect(out.empty).toBe(0);
    expect(out.invalid).toBeGreaterThan(0);
  });

  test("TOK-010: tokenizer perf < 3s", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      const big = Array(400).fill(txt).join("\n");
      const t0 = Date.now();
      const s = GN370.IMPORT.gedcomTokenizer.tokenize(big).stats.total;
      return { ms: Date.now() - t0, total: s };
    }, FIXTURES.giardina);
    expect(out.total).toBeGreaterThan(0);
    expect(out.ms).toBeLessThan(3000);
  });
});

test.describe("MAP-001..010 / NRM-001..012 / CON-001..008", () => {
  test("MAP-001..010 basic mapping and pipeline ids", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      const tok = GN370.IMPORT.gedcomTokenizer.tokenize(txt);
      const map = GN370.IMPORT.gedcomMapper.map(tok, { sessionId: "TESTMAP" });
      return {
        count: map.records.length,
        hasPipeline: map.records.every((r) => /^TESTMAP-/.test(r.pipeline_id)),
        hasTypes: map.records.some((r) => r.record_type === "INDI")
      };
    }, FIXTURES.giardina);
    expect(out.count).toBeGreaterThan(0);
    expect(out.hasPipeline).toBe(true);
    expect(out.hasTypes).toBe(true);
  });

  test("NRM-001..012 normalize names/date/place/title", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      const tok = GN370.IMPORT.gedcomTokenizer.tokenize(txt);
      const map = GN370.IMPORT.gedcomMapper.map(tok, { sessionId: "TESTNRM" });
      const norm = GN370.IMPORT.normAgent.normalize(map.records);
      const one = norm.records[0] || {};
      return {
        count: norm.records.length,
        hasSurnameNorm: !!one.surname_norm,
        hasBirthQual: !!one.birth_date_qual,
        hasPlaceNorm: one.birth_place_norm !== undefined,
        hasTitleField: one.title_norm !== undefined
      };
    }, FIXTURES.merge);
    expect(out.count).toBeGreaterThan(0);
    expect(out.hasSurnameNorm).toBe(true);
    expect(out.hasBirthQual).toBe(true);
    expect(out.hasPlaceNorm).toBe(true);
    expect(out.hasTitleField).toBe(true);
  });

  test("CON-001..008 weighted similarity and severity", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      const tok = GN370.IMPORT.gedcomTokenizer.tokenize(txt);
      const map = GN370.IMPORT.gedcomMapper.map(tok, { sessionId: "TESTCON" });
      const norm = GN370.IMPORT.normAgent.normalize(map.records);
      const existing = { PERSON: [{ person_id: "GNP000000001", surname: "GIARDINA", given_name: "PIETRO", birth_date: "1500", birth_place: "Corleone" }] };
      const con = GN370.IMPORT.conflictDetect.detectAll(norm.records, existing);
      return {
        total: con.reports.length,
        hasSeverity: con.reports.every((r) => ["HIGH", "MEDIUM", "LOW", "NONE"].includes(r.severity)),
        hasScore: con.reports.every((r) => typeof r.similarity_score === "number")
      };
    }, FIXTURES.conflict);
    expect(out.total).toBeGreaterThan(0);
    expect(out.hasSeverity).toBe(true);
    expect(out.hasScore).toBe(true);
  });
});

test.describe("WRT-001..008 / BAT-001..010", () => {
  test("WRT-001..008 write decisions and IMPORT_LOG creation", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      const session = GN370.GEDCOM.startFromText(txt, { autoSkipLow: true, strict: false, dryRun: false });
      const logs = GN370.DB_ENGINE.query("IMPORT_LOG");
      return {
        totalLogs: logs.length,
        hasDecision: logs.every((l) => !!l.stages.s5_decision),
        hasWrittenFlag: logs.every((l) => ["Y", "N"].includes(l.stages.s6_written)),
        totalWritten: session.writer_stats.written
      };
    }, FIXTURES.conflict);
    expect(out.totalLogs).toBeGreaterThan(0);
    expect(out.hasDecision).toBe(true);
    expect(out.hasWrittenFlag).toBe(true);
    expect(out.totalWritten).toBeGreaterThanOrEqual(0);
  });

  test("BAT-001..010 batch execution and log closure", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      const session = GN370.GEDCOM.startFromText(txt, { strict: false, dryRun: false });
      const logs = GN370.DB_ENGINE.query("IMPORT_LOG");
      return {
        ranBatch: session.stage_stats.s7_ran,
        allClosed: logs.every((l) => l.log_closed === true),
        hasBatchResults: logs.some((l) => Array.isArray(l.batch_results) && l.batch_results.length > 0)
      };
    }, FIXTURES.implicit);
    expect(out.ranBatch).toBe(true);
    expect(out.allClosed).toBe(true);
    expect(out.hasBatchResults).toBe(true);
  });

  test("WRT-009: family log mirrors IMPORT_LOG per record", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      GN370.GEDCOM.startFromText(txt, { strict: false, dryRun: false });
      const logs = GN370.DB_ENGINE.query("IMPORT_LOG");
      const familyLogs = GN370.DB_ENGINE.query("IMPORT_LOG_FAMILY");
      return {
        logs: logs.length,
        familyLogs: familyLogs.length,
        allImportHaveFamilyKey: logs.every((l) => !!l.family_key),
        allFamilyRowsHaveKeyTs: familyLogs.every((r) => !!r.family_key && !!r.log_ts)
      };
    }, FIXTURES.implicit);
    expect(out.logs).toBeGreaterThan(0);
    expect(out.familyLogs).toBe(out.logs);
    expect(out.allImportHaveFamilyKey).toBe(true);
    expect(out.allFamilyRowsHaveKeyTs).toBe(true);
  });

  test("WRT-010: family AI uses previous family logs as normalization base", async ({ page }) => {
    await load(page);
    const out = await page.evaluate(() => {
      GN370.DB_ENGINE.reset();
      const seedGed = [
        "0 HEAD",
        "1 SOUR TEST",
        "0 @I1@ INDI",
        "1 NAME Pietro /GIARDINA/",
        "1 BIRT",
        "2 DATE 1500",
        "0 @F1@ FAM",
        "1 HUSB @I1@",
        "0 TRLR"
      ].join("\n");
      const secondGed = [
        "0 HEAD",
        "1 SOUR TEST",
        "0 @I2@ INDI",
        "1 NAME Paolo //",
        "1 BIRT",
        "2 DATE 1601",
        "0 @F1@ FAM",
        "1 CHIL @I2@",
        "0 TRLR"
      ].join("\n");

      GN370.GEDCOM.startFromText(seedGed, { dryRun: false, strict: false });
      const second = GN370.GEDCOM.startFromText(secondGed, { dryRun: false, strict: false });
      const logs = GN370.DB_ENGINE.query("IMPORT_LOG").filter((l) => l.import_session === second.session_id);
      return {
        aiAppliedOnSecond: logs.some((l) => l.ai_norm && l.ai_norm.applied === true),
        familyKeyPresent: logs.some((l) => l.family_key === "FAM:F1"),
        aiRuleApplied: logs.some((l) => Array.isArray(l.norm_details) && l.norm_details.some((d) => d.rule === "AI-FAM-001"))
      };
    });
    expect(out.aiAppliedOnSecond).toBe(true);
    expect(out.familyKeyPresent).toBe(true);
    expect(out.aiRuleApplied).toBe(true);
  });
});

test.describe("E2E-001..005", () => {
  test("E2E-001: import GEDCOM fresh DB full pipeline", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      const s = GN370.GEDCOM.startFromText(txt, { dryRun: false, strict: false });
      return { session: s.session_id, written: s.writer_stats.written, s7: s.stage_stats.s7_ran };
    }, FIXTURES.giardina);
    expect(out.session).toBeTruthy();
    expect(out.s7).toBe(true);
  });

  test("E2E-002: import log created per record", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      const s = GN370.GEDCOM.startFromText(txt, { dryRun: false });
      const logs = GN370.DB_ENGINE.query("IMPORT_LOG");
      return { records: s.mapped.count, logs: logs.length };
    }, FIXTURES.giardina);
    expect(out.logs).toBeGreaterThanOrEqual(out.records);
  });

  test("E2E-003: conflict detection shows pending panel", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      const s = GN370.GEDCOM.startFromText(txt, { dryRun: false });
      return { pending: s.stage_stats.s5_pending, panel: s.panel };
    }, FIXTURES.conflict);
    expect(out.panel).toContain("GN370 CONFLICT PANEL");
    expect(out.pending).toBeGreaterThanOrEqual(0);
  });

  test("E2E-004: merge decision fills blanks only", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      const seed = { PERSON: [{ person_id: "GNP000000001", surname: "GIARDINA", given_name: "", birth_date: "", death_date: "" }] };
      const tok = GN370.IMPORT.gedcomTokenizer.tokenize(txt);
      const map = GN370.IMPORT.gedcomMapper.map(tok, { sessionId: "E2E004" });
      const norm = GN370.IMPORT.normAgent.normalize(map.records);
      const con = GN370.IMPORT.conflictDetect.detectAll(norm.records, seed);
      con.reports.forEach((r) => { r.existing_id = "GNP000000001"; });
      const decisions = {};
      norm.records.forEach((r) => { decisions[r.pipeline_id] = "MERGE"; });
      const s = GN370.IMPORT.dbWriter.write({
        sessionId: "E2E004",
        normRecords: norm.records,
        conflicts: con.reports,
        decisions: decisions,
        tables: seed,
        dryRun: false,
        strict: false,
        stageStats: { s1_tokens: tok.stats.total, s2_warnings: map.stats.warnings }
      });
      const p = GN370.DB_ENGINE.query("PERSON", { person_id: "GNP000000001" })[0];
      return { merged: s.stats.merged, given: p.given_name };
    }, FIXTURES.merge);
    expect(out.merged).toBeGreaterThan(0);
    expect(out.given).toBeTruthy();
  });

  test("E2E-005: AGT_CORRELATE finds family link", async ({ page }) => {
    await load(page);
    const out = await page.evaluate((txt) => {
      GN370.DB_ENGINE.reset();
      GN370.GEDCOM.startFromText(txt, { dryRun: false });
      const corr = GN370.DB_ENGINE.query("CORRELATION_PENDING");
      return { count: corr.length, one: corr[0] || null };
    }, FIXTURES.implicit);
    expect(out.count).toBeGreaterThan(0);
    expect(out.one.status).toBe("PENDING_REVIEW");
  });
});
