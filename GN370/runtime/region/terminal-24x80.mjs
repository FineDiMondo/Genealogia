function blankLine(width) {
  return "".padEnd(width, " ");
}

export class Terminal24x80 {
  constructor(rows = 24, cols = 80) {
    this.rows = rows;
    this.cols = cols;
    this.output = Array.from({ length: rows }, () => blankLine(cols));
    this.lastInput = { aid: "ENTER", data: "" };
  }

  ingestInput(input = {}) {
    const aid = String(input.aid || "ENTER").toUpperCase();
    const data = String(input.data || "");
    this.lastInput = { aid, data };
    return this.lastInput;
  }

  updateOutput(lines = []) {
    this.output = Array.from({ length: this.rows }, (_, i) => {
      const line = String(lines[i] || "");
      return line.length > this.cols ? line.slice(0, this.cols) : line.padEnd(this.cols, " ");
    });
  }

  snapshot() {
    return {
      rows: this.rows,
      cols: this.cols,
      lastInput: { ...this.lastInput },
      output: this.output.slice()
    };
  }
}
