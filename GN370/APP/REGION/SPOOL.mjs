import fs from "node:fs";
import path from "node:path";

function fit(text, width) {
  const raw = String(text ?? "");
  return raw.length >= width ? raw.slice(0, width) : raw.padEnd(width, " ");
}

class SpoolFile {
  constructor(filePath, width = 80) {
    this.filePath = filePath;
    this.width = width;
    this.lines = [];
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  write(line) {
    this.lines.push(fit(line, this.width));
  }

  close() {
    const body = this.lines.join("\n");
    fs.writeFileSync(this.filePath, `${body}${body ? "\n" : ""}`, "utf8");
  }
}

export class StepSpool {
  constructor(sysprintPath, sysoutPath, width = 80) {
    this.print = new SpoolFile(sysprintPath, width);
    this.out = new SpoolFile(sysoutPath, width);
  }

  writePrint(line) {
    this.print.write(line);
  }

  writeOut(line) {
    this.out.write(line);
  }

  writeBoth(line) {
    this.writePrint(line);
    this.writeOut(line);
  }

  close() {
    this.print.close();
    this.out.close();
  }
}