import fs from "node:fs";
import path from "node:path";

const ALLOWED_DISP = new Set(["SHR", "NEW"]);

export function parseParams(text) {
  const out = {};
  for (const raw of String(text).split(",")) {
    const token = raw.trim();
    if (!token) {
      continue;
    }
    const eq = token.indexOf("=");
    if (eq < 0) {
      out[token.toUpperCase()] = "";
      continue;
    }
    const k = token.slice(0, eq).trim().toUpperCase();
    const v = token.slice(eq + 1).trim();
    out[k] = v;
  }
  return out;
}

export function parseDdCard(line) {
  const m = /^\/\/([A-Z0-9]{1,8})\s+DD\s+(.+)$/i.exec(String(line).trim());
  if (!m) {
    return null;
  }
  const ddname = m[1].toUpperCase();
  if (ddname.length > 8) {
    throw new Error(`DDNAME too long: ${ddname}`);
  }
  const params = parseParams(m[2]);
  if (!params.DSN) {
    throw new Error(`DD ${ddname} missing DSN`);
  }
  const disp = (params.DISP || "SHR").toUpperCase();
  if (!ALLOWED_DISP.has(disp)) {
    throw new Error(`DD ${ddname} invalid DISP=${disp}`);
  }
  return { ddname, dsn: params.DSN, disp };
}

export function allocateStepDds(ddCards, gnRoot) {
  const dds = new Map();
  for (const dd of ddCards) {
    const fullPath = path.resolve(gnRoot, dd.dsn);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    if (dd.disp === "NEW") {
      fs.writeFileSync(fullPath, "", "utf8");
    } else if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, "", "utf8");
    }
    dds.set(dd.ddname, {
      ddname: dd.ddname,
      dsn: dd.dsn,
      disp: dd.disp,
      path: fullPath
    });
  }
  return dds;
}