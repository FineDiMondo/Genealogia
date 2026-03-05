import { AppendOnlyJournal } from "./journal.mjs";
import { SpoolBuffer } from "./spool.mjs";
import { Terminal24x80 } from "./terminal-24x80.mjs";

export class RegionContext {
  constructor({ regionId, userId = "ANON", terminal = {} }) {
    this.regionId = regionId;
    this.userId = userId;
    this.onlineProgram = null;
    this.ddMap = new Map();
    this.psbModel = null;
    this.journal = new AppendOnlyJournal(regionId);
    this.spool = new SpoolBuffer(80);
    this.terminal = new Terminal24x80(terminal.rows || 24, terminal.cols || 80);
  }
}
