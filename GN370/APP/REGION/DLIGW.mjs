export const STAT = {
  OK: "  ",
  NOT_FOUND: "GE",
  END: "GB",
  DUP: "II",
  AUTH: "DA"
};

export class DLIGateway {
  constructor(vfs, allowedDds) {
    this.vfs = vfs;
    this.allowed = new Set([...allowedDds].map((x) => x.toUpperCase()));
  }

  isAllowed(ddname) {
    return this.allowed.size === 0 || this.allowed.has(ddname.toUpperCase());
  }

  GU(ddname, key) {
    if (!this.isAllowed(ddname)) {
      return { status: STAT.AUTH, record: null };
    }
    const record = this.vfs.readByKey(ddname, key);
    return record ? { status: STAT.OK, record } : { status: STAT.NOT_FOUND, record: null };
  }

  GN(ddname) {
    if (!this.isAllowed(ddname)) {
      return { status: STAT.AUTH, record: null };
    }
    const record = this.vfs.readNext(ddname);
    return record ? { status: STAT.OK, record } : { status: STAT.END, record: null };
  }

  ISRT(ddname, record) {
    if (!this.isAllowed(ddname)) {
      return { status: STAT.AUTH, record: null };
    }
    const ok = this.vfs.insert(ddname, record);
    return ok ? { status: STAT.OK, record } : { status: STAT.DUP, record: null };
  }

  REPL(ddname, key, record) {
    if (!this.isAllowed(ddname)) {
      return { status: STAT.AUTH, record: null };
    }
    const ok = this.vfs.replace(ddname, key, record);
    return ok ? { status: STAT.OK, record } : { status: STAT.NOT_FOUND, record: null };
  }

  DLET(ddname, key) {
    if (!this.isAllowed(ddname)) {
      return { status: STAT.AUTH, record: null };
    }
    const ok = this.vfs.deleteLogical(ddname, key);
    return ok ? { status: STAT.OK, record: null } : { status: STAT.NOT_FOUND, record: null };
  }
}