export class KsdsIndex {
  constructor() {
    this.map = new Map();
  }

  set(key, offset) {
    this.map.set(String(key).trim(), Number(offset));
  }

  get(key) {
    return this.map.get(String(key).trim());
  }

  has(key) {
    return this.map.has(String(key).trim());
  }

  delete(key) {
    return this.map.delete(String(key).trim());
  }

  entriesSorted() {
    return [...this.map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
}
