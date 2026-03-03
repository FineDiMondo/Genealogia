(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  var SURNAME_VARIANTS = {
    "JARDINE": "GIARDINA",
    "DI GIARDINA": "GIARDINA",
    "DE GIARDINA": "GIARDINA",
    "GIARDINA": "GIARDINA"
  };

  function cleanupSpaces(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  function normalizeSurname(input) {
    var orig = cleanupSpaces(input).toUpperCase();
    var stripped = orig.replace(/^(DI|DE|DEGLI|DELLA|DEL)\s+/, "");
    var mapped = SURNAME_VARIANTS[stripped] || stripped;
    var conf = mapped === orig ? 100 : 90;
    return { norm: mapped, orig: orig, conf: conf, changed: mapped !== orig };
  }

  function normalizeGiven(input) {
    var orig = cleanupSpaces(input);
    var norm = orig.replace(/\s+/g, " ");
    return { norm: norm, orig: orig, conf: norm ? 98 : 0, changed: norm !== orig };
  }

  function monthToNum(mon) {
    var map = {
      JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
      JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12"
    };
    return map[(mon || "").toUpperCase()] || "01";
  }

  function mapGedcomDate(v) {
    var value = cleanupSpaces(v);
    if (!value) {
      return { iso: "", qual: "U", conf: 0, end: "", cal: "G", display: "" };
    }
    var jul = value.match(/^@#DJULIAN@\s+(.+)$/i);
    if (jul) {
      return { iso: cleanupSpaces(jul[1]), qual: "E", conf: 95, end: "", cal: "J", display: "~" + cleanupSpaces(jul[1]) };
    }
    var range = value.match(/^FROM\s+(\d{3,4})\s+TO\s+(\d{3,4})$/i);
    if (range) {
      return { iso: range[1], qual: "N", conf: 92, end: range[2], cal: "G", display: range[1] + "-" + range[2] };
    }
    var abt = value.match(/^ABT\s+(.+)$/i);
    if (abt) {
      return { iso: cleanupSpaces(abt[1]), qual: "A", conf: 85, end: "", cal: "G", display: "~" + cleanupSpaces(abt[1]) };
    }
    var exact = value.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (exact) {
      var day = String(exact[1]).padStart(2, "0");
      var month = monthToNum(exact[2]);
      return { iso: exact[3] + "-" + month + "-" + day, qual: "E", conf: 98, end: "", cal: "G", display: exact[3] + "-" + month + "-" + day };
    }
    if (/^\d{4}$/.test(value)) {
      return { iso: value, qual: "E", conf: 90, end: "", cal: "G", display: value };
    }
    return { iso: value, qual: "U", conf: 60, end: "", cal: "G", display: value };
  }

  function titleCase(v) {
    return cleanupSpaces(v)
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(function (x) { return x[0].toUpperCase() + x.slice(1); })
      .join(" ");
  }

  function mkPlaceId(placeNorm) {
    if (!placeNorm) {
      return "";
    }
    var h = 0;
    for (var i = 0; i < placeNorm.length; i += 1) {
      h = (h * 31 + placeNorm.charCodeAt(i)) % 999999;
    }
    return "GPL" + String(h).padStart(6, "0");
  }

  function classifyTitle(titleText) {
    var t = cleanupSpaces(titleText);
    if (!t) {
      return { title: "", rank: "", conf: 0 };
    }
    var up = t.toUpperCase();
    if (up.indexOf("PRINCIPE") >= 0) { return { title: t, rank: "PRINCIPE", conf: 95 }; }
    if (up.indexOf("DUCA") >= 0) { return { title: t, rank: "DUCA", conf: 92 }; }
    if (up.indexOf("CONTE") >= 0) { return { title: t, rank: "CONTE", conf: 90 }; }
    if (up.indexOf("BARONE") >= 0) { return { title: t, rank: "BARONE", conf: 88 }; }
    return { title: t, rank: "NOBILE", conf: 70 };
  }

  function normalizeOne(raw) {
    var details = [];
    var warnings = [];
    var s = normalizeSurname(raw.raw_surname || "");
    var g = normalizeGiven(raw.raw_given || "");
    var bd = mapGedcomDate(raw.raw_birth_date || "");
    var dd = mapGedcomDate(raw.raw_death_date || "");
    var bpNorm = titleCase(raw.raw_birth_place || "");
    var dpNorm = titleCase(raw.raw_death_place || "");
    var ti = classifyTitle(raw.raw_title || "");

    function detail(field, from, to, conf, rule) {
      if (String(from || "") !== String(to || "")) {
        details.push({ field: field, from: String(from || ""), to: String(to || ""), conf: conf, rule: rule });
      }
    }

    detail("surname", s.orig, s.norm, s.conf, "NR-N001/NR-N002");
    detail("given", g.orig, g.norm, g.conf, "NR-N003");
    detail("birth_date", raw.raw_birth_date, bd.iso, bd.conf, "NR-D001/NR-D002");
    detail("death_date", raw.raw_death_date, dd.iso, dd.conf, "NR-D001/NR-D002");
    detail("birth_place", raw.raw_birth_place, bpNorm, 90, "NR-P001/NR-P002");
    detail("death_place", raw.raw_death_place, dpNorm, 90, "NR-P001/NR-P002");
    detail("title", raw.raw_title, ti.title, ti.conf, "NR-T001");

    if (!s.norm) {
      warnings.push({ code: "NRM-EMPTY-SURNAME", msg: "Surname empty after normalization" });
    }

    var norm = {
      pipeline_id: raw.pipeline_id,
      gedcom_xref: raw.gedcom_xref,
      record_type: raw.record_type,
      surname_norm: s.norm,
      surname_orig: s.orig,
      surname_conf: s.conf,
      given_norm: g.norm,
      given_orig: g.orig,
      given_conf: g.conf,
      birth_date_iso: bd.iso,
      birth_date_qual: bd.qual,
      birth_date_conf: bd.conf,
      birth_place_id: mkPlaceId(bpNorm),
      birth_place_norm: bpNorm,
      birth_place_conf: bpNorm ? 90 : 0,
      death_date_iso: dd.iso,
      death_date_qual: dd.qual,
      death_date_conf: dd.conf,
      death_place_id: mkPlaceId(dpNorm),
      death_place_norm: dpNorm,
      title_norm: ti.title,
      title_conf: ti.conf,
      noble_rank: ti.rank,
      norm_flags: {
        name_modified: details.some(function (d) { return d.field === "surname" || d.field === "given"; }) ? "Y" : "N",
        date_modified: details.some(function (d) { return d.field.indexOf("_date") >= 0; }) ? "Y" : "N",
        place_modified: details.some(function (d) { return d.field.indexOf("_place") >= 0; }) ? "Y" : "N",
        title_modified: details.some(function (d) { return d.field === "title"; }) ? "Y" : "N"
      },
      norm_warnings: warnings,
      warn_count: warnings.length,
      norm_ts: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
      norm_status: warnings.length ? "P" : "K",
      norm_details: details
    };
    return norm;
  }

  function normalize(records) {
    var out = (records || []).map(normalizeOne);
    return {
      records: out,
      stats: {
        count: out.length,
        norm_count: out.reduce(function (a, r) { return a + (r.norm_details.length > 0 ? 1 : 0); }, 0),
        conf_avg: out.length
          ? Math.round(out.reduce(function (a, r) { return a + ((r.surname_conf + r.given_conf + r.birth_date_conf + r.birth_place_conf) / 4); }, 0) / out.length)
          : 0
      }
    };
  }

  GN370.IMPORT.normAgent = {
    normalize: normalize,
    normalizeOne: normalizeOne,
    mapGedcomDate: mapGedcomDate
  };
}(window));
