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

export function buildGn370DemoRegion() {
  return {
    regionId: "GN370R01",
    userId: "DEMOUSR",
    terminal: { rows: 24, cols: 80 },
    psb: DEMO_PSB,
    dd: [{ ddname: "TERMMSG", datasetId: "WORK.TERMMSG", disp: "NEW", attrs: { type: "SEQ", keyLen: 12 } }],
    async onlineProgram({ input, io, spool }) {
      io.OPEN("TERMMSG", "EXTEND");
      io.WRITE("TERMMSG", `${input.aid}:${input.data}`.slice(0, 80));
      io.CLOSE("TERMMSG");
      spool.writeBoth(`ONLINE INPUT ${input.aid}`);
      return {
        rc: 0,
        screen: [
          "GN370 ONLINE DEMO",
          `AID=${input.aid}`.padEnd(80, " "),
          `DATA=${input.data}`.padEnd(80, " "),
          "PF3=EXIT  ENTER=SEND".padEnd(80, " ")
        ]
      };
    }
  };
}
