import path from "node:path";
import { fileURLToPath } from "node:url";
import { KronRegion } from "../APP/REGION/KRON.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gnRoot = path.resolve(__dirname, "..");

function resolveJcl(input) {
  if (!input) {
    return path.resolve(gnRoot, "CNTL", "JCL", "GNVALJOB.jcl");
  }
  if (path.isAbsolute(input)) {
    return input;
  }
  if (input.startsWith("GN370/")) {
    return path.resolve(path.dirname(gnRoot), input);
  }
  return path.resolve(gnRoot, input);
}

const jclPath = resolveJcl(process.argv[2]);
const kron = new KronRegion(gnRoot);
const report = await kron.run(jclPath);

console.log(`JOBNAME ${report.jobName}`);
for (const step of report.steps) {
  console.log(`STEP ${step.stepName} PGM ${step.pgm} RC=${String(step.rc).padStart(2, "0")}`);
}
console.log(`JOBRC=${String(report.rc).padStart(2, "0")}`);

process.exit(report.rc);