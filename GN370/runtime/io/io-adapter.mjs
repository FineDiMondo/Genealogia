import { ABEND, raiseAbend } from "../region/abend.mjs";
import { isDdAuthorized } from "../region/psb-loader.mjs";

export class IoAdapter {
  constructor({ datasetStore, ddMap, psbModel, journal }) {
    this.datasetStore = datasetStore;
    this.ddMap = ddMap || new Map();
    this.psbModel = psbModel;
    this.journal = journal;
    this.openHandles = new Set();
  }

  #resolve(ddname) {
    const dd = String(ddname || "").trim().toUpperCase();
    const entry = this.ddMap.get(dd);
    if (!entry) {
      raiseAbend(ABEND.DDNAUTH, `DD ${dd} not visible in active DD map`, { ddname: dd });
    }
    return entry;
  }

  #authorize(ddname, op) {
    if (!isDdAuthorized(this.psbModel, ddname, op)) {
      raiseAbend(ABEND.DDNAUTH, `DD ${ddname} not authorized for ${op}`, { ddname, op });
    }
  }

  #requireOpen(ddname) {
    const dd = String(ddname || "").trim().toUpperCase();
    if (!this.openHandles.has(dd)) {
      raiseAbend(ABEND.IOOPEN, `DD ${dd} is not OPEN`, { ddname: dd });
    }
  }

  OPEN(ddname, mode = "INPUT") {
    const entry = this.#resolve(ddname);
    const dd = entry.ddname;
    this.#authorize(dd, "OPEN");
    this.datasetStore.openDataset(entry.datasetId);
    this.openHandles.add(dd);
    this.journal?.append("IO.OPEN", { ddname: dd, mode: String(mode).toUpperCase() });
    return { ok: true };
  }

  READ(ddname, opts = {}) {
    const entry = this.#resolve(ddname);
    const dd = entry.ddname;
    this.#authorize(dd, "READ");
    this.#requireOpen(dd);
    const record = opts?.key
      ? this.datasetStore.readByKey(entry.datasetId, opts.key)
      : this.datasetStore.readNext(entry.datasetId);
    this.journal?.append("IO.READ", { ddname: dd, found: record !== null, keyed: Boolean(opts?.key) });
    return record;
  }

  WRITE(ddname, record) {
    const entry = this.#resolve(ddname);
    const dd = entry.ddname;
    this.#authorize(dd, "WRITE");
    this.#requireOpen(dd);
    const out = this.datasetStore.writeRecord(entry.datasetId, record);
    this.journal?.append("IO.WRITE", { ddname: dd });
    return out;
  }

  REWRITE(ddname, record, opts = {}) {
    const entry = this.#resolve(ddname);
    const dd = entry.ddname;
    const key = String(opts?.key || "").trim();
    if (!key) {
      raiseAbend(ABEND.IOWRITE, `REWRITE on DD ${dd} requires key`, { ddname: dd });
    }
    this.#authorize(dd, "REWRITE");
    this.#requireOpen(dd);
    const ok = this.datasetStore.rewriteRecord(entry.datasetId, key, record);
    this.journal?.append("IO.REWRITE", { ddname: dd, ok });
    return ok;
  }

  DELETE(ddname, opts = {}) {
    const entry = this.#resolve(ddname);
    const dd = entry.ddname;
    const key = String(opts?.key || "").trim();
    if (!key) {
      raiseAbend(ABEND.IOWRITE, `DELETE on DD ${dd} requires key`, { ddname: dd });
    }
    this.#authorize(dd, "DELETE");
    this.#requireOpen(dd);
    const ok = this.datasetStore.deleteByKey(entry.datasetId, key);
    this.journal?.append("IO.DELETE", { ddname: dd, ok });
    return ok;
  }

  CLOSE(ddname) {
    const entry = this.#resolve(ddname);
    const dd = entry.ddname;
    this.#authorize(dd, "CLOSE");
    this.openHandles.delete(dd);
    this.journal?.append("IO.CLOSE", { ddname: dd });
    return { ok: true };
  }
}
