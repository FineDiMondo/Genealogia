export function runTxGn01(command) {
  return `TXGN01 ${String(command || "").trim()}`;
}