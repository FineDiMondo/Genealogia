export class AppendOnlyJournal {
  constructor(scopeId) {
    this.scopeId = scopeId;
    this.entries = [];
    this.seq = 0;
  }

  append(eventType, payload = {}) {
    this.seq += 1;
    const record = {
      seq: this.seq,
      scopeId: this.scopeId,
      eventType,
      payload
    };
    this.entries.push(record);
    return record;
  }

  snapshot() {
    return this.entries.slice();
  }

  toLines() {
    return this.entries.map((e) => `${String(e.seq).padStart(6, "0")} ${e.eventType} ${JSON.stringify(e.payload)}`);
  }
}
