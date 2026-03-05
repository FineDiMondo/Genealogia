const DEMO_PSB = {
  psbName: "GN37DEMO",
  pcbs: [
    {
      pcbName: "GNDEMO01",
      ddnames: ["PERSON", "FAMILY", "GEDTOK", "TERMMSG"],
      allow: ["OPEN", "READ", "WRITE", "REWRITE", "DELETE", "CLOSE"]
    }
  ]
};

export default {
  jobName: "GN370DEM",
  steps: [
    {
      stepName: "S001TOKN",
      pgm: "IGBAT01",
      psb: DEMO_PSB,
      dd: [
        { ddname: "PERSON", datasetId: "DSN.PERSON", disp: "SHR", attrs: { type: "KSDS", keyLen: 12 } },
        { ddname: "GEDTOK", datasetId: "WORK.GEDTOK", disp: "NEW", attrs: { type: "SEQ", keyLen: 12 } }
      ],
      parms: { MODE: "BUILD" },
      rcPolicy: { stopOnWarn: false },
      async execute({ io, spool, journal }) {
        io.OPEN("GEDTOK", "OUTPUT");
        io.WRITE("GEDTOK", "TOKEN000001-DEMO");
        io.CLOSE("GEDTOK");
        journal.append("STEP.BUSINESS", { note: "Scaffold demo write only" });
        spool.writeBoth("S001TOKN WRITE GEDTOK OK");
        return { rc: 0 };
      }
    },
    {
      stepName: "S002READ",
      pgm: "IGBAT01",
      psb: DEMO_PSB,
      dd: [{ ddname: "GEDTOK", datasetId: "WORK.GEDTOK", disp: "SHR", attrs: { type: "SEQ", keyLen: 12 } }],
      parms: { MODE: "CHECK" },
      rcPolicy: { stopOnWarn: false },
      async execute({ io, spool, journal }) {
        io.OPEN("GEDTOK", "INPUT");
        const rec = io.READ("GEDTOK");
        io.CLOSE("GEDTOK");
        journal.append("STEP.BUSINESS", { note: "Scaffold demo read only", found: Boolean(rec) });
        spool.writeBoth(`S002READ GEDTOK=${rec ? "FOUND" : "EMPTY"}`);
        return { rc: rec ? 0 : 4 };
      }
    }
  ]
};
