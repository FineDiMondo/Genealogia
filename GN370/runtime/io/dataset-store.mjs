import { KsdsIndex } from "./ksds-index.mjs";
import { ABEND, raiseAbend } from "../region/abend.mjs";

function keyFromRecord(record, keyLen = 12) {
  return String(record || "").slice(0, keyLen).trim();
}

export class DatasetStore {
  constructor() {
    this.datasets = new Map();
  }

  ensureDataset(datasetId, attrs = {}) {
    const id = String(datasetId).trim().toUpperCase();
    if (!id) {
      raiseAbend(ABEND.IOOPEN, "Dataset id missing");
    }
    if (!this.datasets.has(id)) {
      this.datasets.set(id, {
        id,
        type: String(attrs.type || "SEQ").toUpperCase(),
        keyLen: Number(attrs.keyLen || 12),
        records: [],
        pointer: 0,
        index: new KsdsIndex(),
        attrs: { ...attrs }
      });
    }
    return this.datasets.get(id);
  }

  openDataset(datasetId) {
    const ds = this.datasets.get(String(datasetId).trim().toUpperCase());
    if (!ds) {
      raiseAbend(ABEND.IOOPEN, `Dataset not allocated: ${datasetId}`);
    }
    ds.pointer = 0;
    return ds;
  }

  readNext(datasetId) {
    const ds = this.openDataset(datasetId);
    if (ds.pointer >= ds.records.length) {
      return null;
    }
    const rec = ds.records[ds.pointer];
    ds.pointer += 1;
    return rec;
  }

  readByKey(datasetId, key) {
    const ds = this.openDataset(datasetId);
    const idx = ds.index.get(key);
    if (idx === undefined) {
      return null;
    }
    return ds.records[idx] ?? null;
  }

  writeRecord(datasetId, record) {
    const ds = this.openDataset(datasetId);
    const rec = String(record || "");
    ds.records.push(rec);
    ds.index.set(keyFromRecord(rec, ds.keyLen), ds.records.length - 1);
    return rec;
  }

  rewriteRecord(datasetId, key, record) {
    const ds = this.openDataset(datasetId);
    const idx = ds.index.get(key);
    if (idx === undefined) {
      return false;
    }
    const rec = String(record || "");
    ds.records[idx] = rec;
    ds.index.set(keyFromRecord(rec, ds.keyLen), idx);
    return true;
  }

  deleteByKey(datasetId, key) {
    const ds = this.openDataset(datasetId);
    const idx = ds.index.get(key);
    if (idx === undefined) {
      return false;
    }
    ds.records[idx] = "";
    ds.index.delete(key);
    return true;
  }

  snapshot() {
    return [...this.datasets.values()]
      .map((ds) => ({
        id: ds.id,
        type: ds.type,
        keyLen: ds.keyLen,
        attrs: { ...ds.attrs },
        records: ds.records.slice()
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }
}
