import fs from "node:fs";
import path from "node:path";

function normDeckLine(line) {
  return String(line).slice(0, 80).trim();
}

function extractDdNames(line) {
  const ddnames = [];
  const ddRegex = /DD=([A-Z0-9]{1,8})/gi;
  for (const match of line.matchAll(ddRegex)) {
    ddnames.push(match[1].toUpperCase());
  }
  const ddsn = /DDNAMES=([A-Z0-9,]+)/i.exec(line);
  if (ddsn) {
    for (const dd of ddsn[1].split(",")) {
      const v = dd.trim().toUpperCase();
      if (v) {
        ddnames.push(v);
      }
    }
  }
  return [...new Set(ddnames)];
}

export function parsePsbDeck(text) {
  const runtime = { psbName: "", pcbs: [] };
  for (const raw of String(text).split(/\r?\n/)) {
    const line = normDeckLine(raw);
    if (!line || line.startsWith("*")) {
      continue;
    }
    if (line.startsWith("PSB ")) {
      runtime.psbName = line.split(/\s+/)[1] || "";
      continue;
    }
    if (line.startsWith("PCB ")) {
      const pcbName = line.split(/\s+/)[1] || "";
      runtime.pcbs.push({ pcbName, ddnames: extractDdNames(line) });
    }
  }
  return runtime;
}

export function parsePcbDeck(text) {
  const runtime = { pcbName: "", pcbs: [] };
  for (const raw of String(text).split(/\r?\n/)) {
    const line = normDeckLine(raw);
    if (!line || line.startsWith("*")) {
      continue;
    }
    if (line.startsWith("END ")) {
      runtime.pcbName = line.split(/\s+/)[1] || runtime.pcbName;
      continue;
    }
    if (line.startsWith("PCB ")) {
      const pcbName = line.split(/\s+/)[1] || "";
      runtime.pcbs.push({ pcbName, ddnames: extractDdNames(line) });
    }
  }
  return runtime;
}

function derivePcbName(psbName) {
  if (!psbName) {
    return "";
  }
  if (psbName.endsWith("PSB")) {
    return `${psbName.slice(0, -3)}PCB`;
  }
  return "";
}

export function loadPsbPcb(gnRoot, psbName, pcbName = "") {
  const result = { psb: { psbName: "", pcbs: [] }, pcb: { pcbName: "", pcbs: [] } };
  const psbPath = path.resolve(gnRoot, "CNTL", "PSB", `${psbName}.psb`);
  if (!fs.existsSync(psbPath)) {
    throw new Error(`PSB deck not found: ${psbPath}`);
  }
  result.psb = parsePsbDeck(fs.readFileSync(psbPath, "utf8"));

  const effectivePcbName = pcbName || derivePcbName(psbName);
  if (effectivePcbName) {
    const pcbPath = path.resolve(gnRoot, "CNTL", "PCB", `${effectivePcbName}.pcb`);
    if (fs.existsSync(pcbPath)) {
      result.pcb = parsePcbDeck(fs.readFileSync(pcbPath, "utf8"));
    }
  }
  return result;
}

export function buildAuthorizedDdSet(runtime) {
  const out = new Set();
  for (const side of [runtime.psb, runtime.pcb]) {
    for (const pcb of side.pcbs || []) {
      for (const dd of pcb.ddnames || []) {
        out.add(dd.toUpperCase());
      }
    }
  }
  return out;
}