import { ABEND, raiseAbend } from "./abend.mjs";
import { isDdAuthorized } from "./psb-loader.mjs";

const DISP_VALUES = new Set(["SHR", "OLD", "NEW"]);

export class LockTable {
  constructor() {
    this.locks = new Map();
  }

  acquire(regionId, ddname, disp) {
    const key = String(ddname).toUpperCase();
    const mode = String(disp).toUpperCase();
    const holder = this.locks.get(key);

    if (!holder) {
      this.locks.set(key, { mode, holders: new Set([regionId]) });
      return;
    }

    if (mode === "SHR" && holder.mode === "SHR") {
      holder.holders.add(regionId);
      return;
    }

    raiseAbend(ABEND.DDALLOC, `DD ${key} lock conflict (${mode} vs ${holder.mode})`, { ddname: key });
  }

  release(regionId, ddname) {
    const key = String(ddname).toUpperCase();
    const holder = this.locks.get(key);
    if (!holder) {
      return;
    }
    holder.holders.delete(regionId);
    if (holder.holders.size === 0) {
      this.locks.delete(key);
    }
  }
}

function normalizeDdCard(ddCard) {
  const ddname = String(ddCard?.ddname || "").trim().toUpperCase();
  if (!ddname || ddname.length > 8) {
    raiseAbend(ABEND.DDALLOC, `Invalid DDNAME: ${ddname || "<empty>"}`);
  }

  const disp = String(ddCard?.disp || "SHR").trim().toUpperCase();
  if (!DISP_VALUES.has(disp)) {
    raiseAbend(ABEND.DDALLOC, `Invalid DISP ${disp} for DD ${ddname}`, { ddname, disp });
  }

  return {
    ddname,
    disp,
    datasetId: String(ddCard?.datasetId || ddCard?.dsn || ddname).trim(),
    attrs: ddCard?.attrs || {}
  };
}

export function allocateDdSet({ regionId, ddCards, psbModel, datasetStore, lockTable }) {
  const ddMap = new Map();
  for (const raw of ddCards || []) {
    const dd = normalizeDdCard(raw);

    if (!isDdAuthorized(psbModel, dd.ddname, "OPEN")) {
      raiseAbend(ABEND.DDNAUTH, `DD ${dd.ddname} not authorized by active PSB/PCB`, { ddname: dd.ddname, op: "OPEN" });
    }

    lockTable.acquire(regionId, dd.ddname, dd.disp);
    datasetStore.ensureDataset(dd.datasetId, dd.attrs);
    ddMap.set(dd.ddname, dd);
  }
  return ddMap;
}

export function releaseDdSet({ regionId, ddMap, lockTable }) {
  for (const dd of ddMap?.values?.() || []) {
    lockTable.release(regionId, dd.ddname);
  }
}
