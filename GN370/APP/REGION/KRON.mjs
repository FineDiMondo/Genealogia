import fs from "node:fs";
import path from "node:path";
import { parseParams, parseDdCard, allocateStepDds } from "./DDALOC.mjs";
import { loadPsbPcb, buildAuthorizedDdSet } from "./PSBPCB.mjs";
import { VFS } from "./VFS.mjs";
import { DLIGateway } from "./DLIGW.mjs";
import { StepSpool } from "./SPOOL.mjs";
import { CallResolver } from "./CALL.mjs";

const SYS_DD = new Set(["SYSIN", "SYSPRINT", "SYSOUT"]);

function parseExecCard(line) {
  const m = /^\/\/([A-Z0-9]{1,8})\s+EXEC\s+(.+)$/i.exec(String(line).trim());
  if (!m) {
    return null;
  }
  const stepName = m[1].toUpperCase();
  const params = parseParams(m[2]);
  const pgm = (params.PGM || "").toUpperCase();
  if (!pgm) {
    throw new Error(`STEP ${stepName} missing PGM`);
  }
  return { stepName, pgm, execParams: params, ddCards: [] };
}

export function parseControlCards(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("*")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq < 0) {
      continue;
    }
    out[line.slice(0, eq).trim().toUpperCase()] = line.slice(eq + 1).trim();
  }
  return out;
}

export function parseJcl(text) {
  const job = { jobName: "NONAME", steps: [] };
  let currentStep = null;

  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === "//*" || line.startsWith("//*")) {
      continue;
    }

    const jobCard = /^\/\/([A-Z0-9]{1,8})\s+JOB\b/i.exec(line);
    if (jobCard) {
      job.jobName = jobCard[1].toUpperCase();
      continue;
    }

    const exec = parseExecCard(line);
    if (exec) {
      currentStep = exec;
      job.steps.push(currentStep);
      continue;
    }

    const dd = parseDdCard(line);
    if (dd && currentStep) {
      currentStep.ddCards.push(dd);
    }
  }

  return job;
}

function getSpoolPaths(gnRoot, jobName, stepName, ddMap) {
  const defaultDir = path.resolve(gnRoot, "SPOOL", jobName);
  const sysprint = ddMap.get("SYSPRINT")?.path || path.resolve(defaultDir, `${stepName}.SYSPRINT`);
  const sysout = ddMap.get("SYSOUT")?.path || path.resolve(defaultDir, `${stepName}.SYSOUT`);
  return { sysprint, sysout };
}

function mountVfsDatasets(vfs, ddMap, controls) {
  const keyLen = Number(controls.KEYLEN || "12");
  for (const dd of ddMap.values()) {
    if (SYS_DD.has(dd.ddname)) {
      continue;
    }
    vfs.mount(dd.ddname, dd.path, keyLen);
  }
}

function enforceDdGating(ddMap, allowedDds) {
  for (const dd of ddMap.values()) {
    if (dd.ddname.length > 8) {
      throw new Error(`DDNAME too long: ${dd.ddname}`);
    }
    if (SYS_DD.has(dd.ddname)) {
      continue;
    }
    if (allowedDds.size > 0 && !allowedDds.has(dd.ddname)) {
      throw new Error(`DD ${dd.ddname} not authorized by PSB/PCB`);
    }
  }
}

export class KronRegion {
  constructor(gnRoot) {
    this.gnRoot = gnRoot;
    this.calls = new CallResolver(gnRoot);
  }

  loadJclFile(jclPath) {
    const fullPath = path.isAbsolute(jclPath) ? jclPath : path.resolve(this.gnRoot, jclPath);
    const text = fs.readFileSync(fullPath, "utf8");
    return { fullPath, job: parseJcl(text) };
  }

  async run(jclPath) {
    const loaded = this.loadJclFile(jclPath);
    const report = {
      jobName: loaded.job.jobName,
      rc: 0,
      steps: []
    };

    for (const step of loaded.job.steps) {
      const ddMap = allocateStepDds(step.ddCards, this.gnRoot);
      const spoolPaths = getSpoolPaths(this.gnRoot, loaded.job.jobName, step.stepName, ddMap);
      const spool = new StepSpool(spoolPaths.sysprint, spoolPaths.sysout, 80);
      let rc = 0;

      spool.writeBoth(`JOB=${loaded.job.jobName} STEP=${step.stepName} PGM=${step.pgm}`);

      try {
        const sysinPath = ddMap.get("SYSIN")?.path;
        const controls = parseControlCards(sysinPath ? fs.readFileSync(sysinPath, "utf8") : "");
        const psbName = (step.execParams.PSB || "").toUpperCase();
        const pcbName = (step.execParams.PCB || "").toUpperCase();

        const runtime = psbName ? loadPsbPcb(this.gnRoot, psbName, pcbName) : { psb: { pcbs: [] }, pcb: { pcbs: [] } };
        const allowedDds = buildAuthorizedDdSet(runtime);
        enforceDdGating(ddMap, allowedDds);

        const vfs = new VFS();
        mountVfsDatasets(vfs, ddMap, controls);
        const dli = new DLIGateway(vfs, allowedDds);

        const result = await this.calls.call(step.pgm, {
          jobName: loaded.job.jobName,
          stepName: step.stepName,
          controls,
          dds: ddMap,
          vfs,
          dli,
          spool
        });

        rc = Number(result.rc || 0);
        vfs.flushAll();
      } catch (err) {
        rc = 12;
        spool.writeBoth(`ABEND RC=12 ${err.message}`);
      }

      spool.writeBoth(`STEP ${step.stepName} RC=${String(rc).padStart(2, "0")}`);
      spool.close();

      report.steps.push({ stepName: step.stepName, pgm: step.pgm, rc });
      if (rc > report.rc) {
        report.rc = rc;
      }
      if (rc !== 0) {
        break;
      }
    }

    return report;
  }
}