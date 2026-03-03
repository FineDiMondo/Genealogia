(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function parseLine(line, lineNum) {
    var m = String(line || "").match(/^\s*(\d+)\s+(?:(@[^@]+@)\s+)?([A-Za-z0-9_]+)(?:\s+(.*))?$/);
    if (!m) {
      return {
        line_num: lineNum,
        level: 0,
        xref: "",
        tag: "INVALID",
        value: String(line || ""),
        continuation: " ",
        parent_xref: "",
        parent_tag: "",
        gedcom_ver: "",
        encoding: "",
        proc_status: "E"
      };
    }
    return {
      line_num: lineNum,
      level: Number(m[1]),
      xref: m[2] || "",
      tag: (m[3] || "").toUpperCase(),
      value: m[4] || "",
      continuation: " ",
      parent_xref: "",
      parent_tag: "",
      gedcom_ver: "",
      encoding: "",
      proc_status: "P"
    };
  }

  function tokenize(text) {
    var lines = String(text || "").split(/\r?\n/);
    var tokens = [];
    var stack = {};
    var version = "";
    var encoding = "UTF-8";
    var headerMode = "";

    lines.forEach(function (line, idx) {
      if (!line.trim()) {
        return;
      }
      var tok = parseLine(line, idx + 1);
      if (tok.tag === "INVALID") {
        tokens.push(tok);
        return;
      }

      if (tok.level === 0) {
        stack = {};
      }
      stack[tok.level] = tok;
      var parent = stack[tok.level - 1];
      tok.parent_xref = parent ? parent.xref : "";
      tok.parent_tag = parent ? parent.tag : "";

      if (tok.level === 0 && tok.tag === "HEAD") {
        headerMode = "HEAD";
      }
      if (tok.level === 1 && tok.tag === "GEDC") {
        headerMode = "GEDC";
      }
      if (tok.level === 2 && tok.tag === "VERS" && headerMode === "GEDC") {
        version = tok.value.trim();
      }
      if (tok.level === 1 && tok.tag === "CHAR") {
        encoding = tok.value.trim() || "UTF-8";
      }

      if (tok.tag === "CONT") {
        tok.continuation = "C";
      } else if (tok.tag === "CONC") {
        tok.continuation = "N";
      }
      tok.gedcom_ver = version;
      tok.encoding = encoding;
      tok.proc_status = "D";
      tokens.push(tok);
    });

    return {
      tokens: tokens,
      stats: {
        total: tokens.length,
        version: version || "5.5.1",
        encoding: encoding || "UTF-8",
        invalid: tokens.filter(function (t) { return t.tag === "INVALID"; }).length
      }
    };
  }

  GN370.IMPORT.gedcomTokenizer = {
    tokenize: tokenize
  };
}(window));
