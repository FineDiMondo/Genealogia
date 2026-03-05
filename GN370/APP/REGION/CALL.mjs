import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadFrom(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const mod = await import(pathToFileURL(filePath).href);
  if (typeof mod.default === "function") {
    return mod.default;
  }
  if (typeof mod.run === "function") {
    return mod.run;
  }
  return null;
}

export class CallResolver {
  constructor(gnRoot) {
    this.gnRoot = gnRoot;
  }

  async resolve(pgmName) {
    const pgm = String(pgmName).toUpperCase();
    const imsPath = path.resolve(this.gnRoot, "LOAD", "IMS", `${pgm}.mjs`);
    const cblPath = path.resolve(this.gnRoot, "LOAD", "CBL", `${pgm}.mjs`);
    return (await loadFrom(imsPath)) || (await loadFrom(cblPath));
  }

  async call(pgmName, context) {
    const handler = await this.resolve(pgmName);
    if (!handler) {
      context.spool.writeBoth(`CALL ${pgmName} STUB RC=00`);
      return { rc: 0 };
    }
    const out = await handler(context);
    return out && typeof out.rc === "number" ? out : { rc: 0 };
  }
}