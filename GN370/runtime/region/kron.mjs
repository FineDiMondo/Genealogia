import { IoAdapter } from "../io/io-adapter.mjs";
import { buildDeterministicExport } from "../io/flush-export.mjs";
import { ABEND, AbendedError, toAbendRecord } from "./abend.mjs";
import { aggregateRc, shouldStopOnRc } from "./rc-policy.mjs";
import { loadPsbDocument } from "./psb-loader.mjs";
import { allocateDdSet, releaseDdSet } from "./dd-allocator.mjs";
import { RegionContext } from "./region-context.mjs";

export class Kron {
  constructor({ datasetStore, lockTable }) {
    this.datasetStore = datasetStore;
    this.lockTable = lockTable;
    this.regions = new Map();
  }

  async startBatch(jobDef, options = {}) {
    const jobName = String(jobDef?.jobName || "NONAME").toUpperCase();
    const steps = jobDef?.steps || [];
    const stepReports = [];

    for (const step of steps) {
      const stepReport = await this.#runBatchStep(jobName, step, options);
      stepReports.push(stepReport);
      if (shouldStopOnRc(stepReport.rc, step?.rcPolicy || options.rcPolicy)) {
        break;
      }
    }

    return {
      jobName,
      steps: stepReports,
      rc: aggregateRc(stepReports.map((s) => s.rc))
    };
  }

  async #runBatchStep(jobName, step, options) {
    const stepName = String(step?.stepName || "STEP0001").toUpperCase();
    const regionId = `${jobName}.${stepName}`;
    const context = new RegionContext({ regionId, userId: options.userId || "BATCH" });
    let rc = 0;

    try {
      context.psbModel = loadPsbDocument(step.psb);
      context.ddMap = allocateDdSet({
        regionId,
        ddCards: step.dd || [],
        psbModel: context.psbModel,
        datasetStore: this.datasetStore,
        lockTable: this.lockTable
      });

      const io = new IoAdapter({
        datasetStore: this.datasetStore,
        ddMap: context.ddMap,
        psbModel: context.psbModel,
        journal: context.journal
      });

      if (typeof step.execute === "function") {
        const result = await step.execute({
          io,
          parms: step.parms || {},
          journal: context.journal,
          spool: context.spool
        });
        rc = Number(result?.rc || 0);
      } else {
        context.journal.append("STEP.SKIP", { reason: "No execute handler in scaffold" });
        context.spool.writeBoth(`STEP ${stepName} SKIPPED - scaffold`);
      }
    } catch (err) {
      const abend = toAbendRecord(err);
      context.journal.append("ABEND", abend);
      context.spool.writeBoth(`${abend.abendCode} ${abend.message}`);
      rc = abend.rc;
      if (!(err instanceof AbendedError)) {
        context.journal.append("ABEND.WRAPPED", { wrappedAs: ABEND.RUNTIME });
      }
    } finally {
      releaseDdSet({ regionId, ddMap: context.ddMap, lockTable: this.lockTable });
    }

    return {
      stepName,
      pgm: String(step?.pgm || "UNASSIGNED").toUpperCase(),
      rc,
      journal: context.journal.snapshot(),
      spool: context.spool.snapshot()
    };
  }

  async startRegion(regionDef) {
    const regionId = String(regionDef?.regionId || `REGION-${Date.now()}`).toUpperCase();
    if (this.regions.has(regionId)) {
      throw new AbendedError(ABEND.RUNTIME, `Region already active: ${regionId}`);
    }

    const context = new RegionContext({
      regionId,
      userId: regionDef?.userId || "ONLINE",
      terminal: regionDef?.terminal || {}
    });

    context.psbModel = loadPsbDocument(regionDef?.psb);
    context.ddMap = allocateDdSet({
      regionId,
      ddCards: regionDef?.dd || [],
      psbModel: context.psbModel,
      datasetStore: this.datasetStore,
      lockTable: this.lockTable
    });
    context.onlineProgram = regionDef?.onlineProgram || null;
    context.journal.append("REGION.START", { regionId, userId: context.userId });
    this.regions.set(regionId, context);
    return { regionId };
  }

  async dispatchMessage(regionId, message) {
    const id = String(regionId).toUpperCase();
    const context = this.regions.get(id);
    if (!context) {
      throw new AbendedError(ABEND.RUNTIME, `Region not active: ${id}`);
    }

    const normalized = context.terminal.ingestInput(message || {});
    context.journal.append("MSG.IN", normalized);

    const io = new IoAdapter({
      datasetStore: this.datasetStore,
      ddMap: context.ddMap,
      psbModel: context.psbModel,
      journal: context.journal
    });

    if (typeof context.onlineProgram === "function") {
      const out = await context.onlineProgram({
        input: normalized,
        io,
        journal: context.journal,
        spool: context.spool,
        terminal: context.terminal
      });
      if (Array.isArray(out?.screen)) {
        context.terminal.updateOutput(out.screen);
      }
      context.journal.append("MSG.OUT", { rc: Number(out?.rc || 0) });
      return {
        rc: Number(out?.rc || 0),
        terminal: context.terminal.snapshot()
      };
    }

    context.spool.writeBoth("ONLINE PROGRAM NOT ATTACHED (scaffold)");
    return { rc: 0, terminal: context.terminal.snapshot() };
  }

  async stopRegion(regionId) {
    const id = String(regionId).toUpperCase();
    const context = this.regions.get(id);
    if (!context) {
      return { regionId: id, rc: 0, stopped: false };
    }

    releaseDdSet({ regionId: id, ddMap: context.ddMap, lockTable: this.lockTable });
    context.journal.append("REGION.STOP", { regionId: id });
    this.regions.delete(id);

    return {
      regionId: id,
      rc: 0,
      stopped: true,
      export: buildDeterministicExport({
        datasets: this.datasetStore.snapshot(),
        journal: context.journal.snapshot(),
        spool: context.spool.snapshot()
      })
    };
  }
}
