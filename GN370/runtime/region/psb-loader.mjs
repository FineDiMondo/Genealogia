import { ABEND, raiseAbend } from "./abend.mjs";

const DEFAULT_ALLOW = ["OPEN", "READ", "WRITE", "REWRITE", "DELETE", "CLOSE"];

function normalizePcb(pcb) {
  return {
    pcbName: String(pcb?.pcbName || "").trim().toUpperCase(),
    ddnames: [...new Set((pcb?.ddnames || []).map((dd) => String(dd).trim().toUpperCase()).filter(Boolean))],
    allow: [...new Set((pcb?.allow || DEFAULT_ALLOW).map((op) => String(op).trim().toUpperCase()).filter(Boolean))]
  };
}

export function normalizePsbDocument(doc) {
  const psbName = String(doc?.psbName || "").trim().toUpperCase();
  if (!psbName) {
    raiseAbend(ABEND.PSB, "PSB name missing");
  }

  const pcbs = (doc?.pcbs || []).map(normalizePcb).filter((pcb) => pcb.pcbName || pcb.ddnames.length > 0);
  if (pcbs.length === 0) {
    raiseAbend(ABEND.PSB, `PSB ${psbName} has no PCB definitions`);
  }

  return { psbName, pcbs };
}

export function loadPsbDocument(input) {
  if (typeof input === "string") {
    return normalizePsbDocument(JSON.parse(input));
  }
  return normalizePsbDocument(input);
}

export function buildAuthorizationMap(psbModel) {
  const auth = new Map();
  for (const pcb of psbModel.pcbs) {
    for (const ddname of pcb.ddnames) {
      const dd = ddname.toUpperCase();
      const allow = auth.get(dd) || new Set();
      for (const op of pcb.allow) {
        allow.add(op.toUpperCase());
      }
      auth.set(dd, allow);
    }
  }
  return auth;
}

export function isDdAuthorized(psbModel, ddname, op = "READ") {
  const auth = buildAuthorizationMap(psbModel);
  const allow = auth.get(String(ddname).toUpperCase());
  if (!allow) {
    return false;
  }
  return allow.has(String(op).toUpperCase());
}
