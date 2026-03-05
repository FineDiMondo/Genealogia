function fit80(text, width = 80) {
  const s = String(text ?? "");
  return s.length > width ? s.slice(0, width) : s.padEnd(width, " ");
}

export class SpoolBuffer {
  constructor(width = 80) {
    this.width = width;
    this.sysout = [];
    this.sysprint = [];
  }

  writeSysout(line) {
    this.sysout.push(fit80(line, this.width));
  }

  writeSysprint(line) {
    this.sysprint.push(fit80(line, this.width));
  }

  writeBoth(line) {
    this.writeSysout(line);
    this.writeSysprint(line);
  }

  snapshot() {
    return {
      sysout: this.sysout.slice(),
      sysprint: this.sysprint.slice()
    };
  }
}
