export const ABEND = Object.freeze({
  DDNAUTH: "ABEND12-DDNAUTH",
  PSB: "ABEND14-PSB",
  DDALLOC: "ABEND16-DDALLOC",
  IOOPEN: "ABEND20-IOOPEN",
  IOREAD: "ABEND22-IOREAD",
  IOWRITE: "ABEND24-IOWRITE",
  RUNTIME: "ABEND30-RUNTIME",
  NOT_IMPL: "ABEND88-NOTIMPL"
});

const RC_BY_ABEND = Object.freeze({
  [ABEND.DDNAUTH]: 12,
  [ABEND.PSB]: 14,
  [ABEND.DDALLOC]: 16,
  [ABEND.IOOPEN]: 20,
  [ABEND.IOREAD]: 22,
  [ABEND.IOWRITE]: 24,
  [ABEND.RUNTIME]: 30,
  [ABEND.NOT_IMPL]: 88
});

export class AbendedError extends Error {
  constructor(abendCode, message, meta = {}) {
    super(message);
    this.name = "AbendedError";
    this.abendCode = abendCode;
    this.rc = RC_BY_ABEND[abendCode] ?? 30;
    this.meta = meta;
  }
}

export function raiseAbend(abendCode, message, meta = {}) {
  throw new AbendedError(abendCode, message, meta);
}

export function toAbendRecord(err) {
  if (err instanceof AbendedError) {
    return {
      abendCode: err.abendCode,
      rc: err.rc,
      message: err.message,
      meta: err.meta
    };
  }
  return {
    abendCode: ABEND.RUNTIME,
    rc: RC_BY_ABEND[ABEND.RUNTIME],
    message: err?.message || "Unexpected runtime error",
    meta: {}
  };
}
