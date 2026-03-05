export function classifyRc(rc) {
  const num = Number(rc || 0);
  if (num <= 4) {
    return "OK";
  }
  if (num <= 8) {
    return "WARN";
  }
  return "SEVERE";
}

export function aggregateRc(rcValues) {
  return (rcValues || []).reduce((max, v) => Math.max(max, Number(v || 0)), 0);
}

export function shouldStopOnRc(rc, policy = {}) {
  const cls = classifyRc(rc);
  const stopOnWarn = Boolean(policy.stopOnWarn);
  if (cls === "SEVERE") {
    return true;
  }
  if (cls === "WARN" && stopOnWarn) {
    return true;
  }
  return false;
}
