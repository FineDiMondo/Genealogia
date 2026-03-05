import fs from "node:fs";

function splitLines(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((x) => x.length > 0);
}

export class VFS {
  constructor() {
    this.datasets = new Map();
  }

  mount(ddname, filePath, keyLen = 12) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "", "utf8");
    }
    const records = splitLines(fs.readFileSync(filePath, "utf8"));
    const state = {
      ddname,
      filePath,
      keyLen,
      records,
      pointer: 0,
      index: new Map(),
      dirty: false
    };
    for (let i = 0; i < records.length; i += 1) {
      state.index.set(this.keyOf(records[i], keyLen), i);
    }
    this.datasets.set(ddname, state);
    return state;
  }

  keyOf(record, keyLen) {
    return String(record).slice(0, keyLen).trim();
  }

  getState(ddname) {
    const st = this.datasets.get(ddname);
    if (!st) {
      throw new Error(`Dataset not mounted: ${ddname}`);
    }
    return st;
  }

  readByKey(ddname, key) {
    const st = this.getState(ddname);
    const idx = st.index.get(String(key).trim());
    if (idx === undefined) {
      return null;
    }
    return st.records[idx];
  }

  readNext(ddname) {
    const st = this.getState(ddname);
    if (st.pointer >= st.records.length) {
      return null;
    }
    const rec = st.records[st.pointer];
    st.pointer += 1;
    return rec;
  }

  insert(ddname, record) {
    const st = this.getState(ddname);
    const key = this.keyOf(record, st.keyLen);
    if (st.index.has(key)) {
      return false;
    }
    st.records.push(record);
    st.index.set(key, st.records.length - 1);
    st.dirty = true;
    return true;
  }

  replace(ddname, key, record) {
    const st = this.getState(ddname);
    const idx = st.index.get(String(key).trim());
    if (idx === undefined) {
      return false;
    }
    st.records[idx] = record;
    st.index.set(this.keyOf(record, st.keyLen), idx);
    st.dirty = true;
    return true;
  }

  deleteLogical(ddname, key) {
    const st = this.getState(ddname);
    const idx = st.index.get(String(key).trim());
    if (idx === undefined) {
      return false;
    }
    const old = st.records[idx];
    st.records[idx] = `D${old.slice(1)}`;
    st.dirty = true;
    return true;
  }

  flush(ddname) {
    const st = this.getState(ddname);
    if (!st.dirty) {
      return;
    }
    const body = st.records.join("\n");
    fs.writeFileSync(st.filePath, `${body}${body ? "\n" : ""}`, "utf8");
    st.dirty = false;
  }

  flushAll() {
    for (const ddname of this.datasets.keys()) {
      this.flush(ddname);
    }
  }
}