(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function upper(v) {
    return String(v || "").trim().toUpperCase();
  }

  function clean(v) {
    return String(v || "").trim();
  }

  function cleanXref(xref) {
    return String(xref || "").replace(/^@+|@+$/g, "").trim().toUpperCase();
  }

  function sanitizeKey(v) {
    return upper(v).replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function familyKeyFromXref(xref) {
    var cleaned = cleanXref(xref);
    return cleaned ? "FAM:" + cleaned : "";
  }

  function familyKeyFromSurname(surname) {
    var cleaned = sanitizeKey(surname);
    return cleaned ? "SUR:" + cleaned : "";
  }

  function buildFamilyKeyMap(rawRecords, normRecords) {
    var out = {};
    var byMember = {};
    var byFamXref = {};
    var normByXref = {};

    (normRecords || []).forEach(function (n) {
      if (n && n.gedcom_xref) {
        normByXref[n.gedcom_xref] = n;
      }
    });

    (rawRecords || []).forEach(function (r) {
      if (!r || r.record_type !== "FAM") {
        return;
      }
      var key = familyKeyFromXref(r.gedcom_xref);
      if (!key) {
        var husb = normByXref[r.raw_husb] || null;
        var wife = normByXref[r.raw_wife] || null;
        var chil = normByXref[r.raw_chil] || null;
        key = familyKeyFromSurname(
          (husb && husb.surname_norm) ||
          (wife && wife.surname_norm) ||
          (chil && chil.surname_norm) ||
          ""
        );
      }
      if (!key) {
        key = "FAM:UNASSIGNED";
      }
      byFamXref[r.gedcom_xref] = key;

      [r.raw_husb, r.raw_wife, r.raw_chil].forEach(function (xref) {
        if (xref && !byMember[xref]) {
          byMember[xref] = key;
        }
      });
      (r.raw_chil_refs || []).forEach(function (xref) {
        if (xref && !byMember[xref]) {
          byMember[xref] = key;
        }
      });
    });

    (rawRecords || []).forEach(function (r) {
      if (!r || r.record_type !== "INDI") {
        return;
      }
      var refs = (r.raw_famc_refs || []).concat(r.raw_fams_refs || []);
      for (var i = 0; i < refs.length; i += 1) {
        var familyKey = byFamXref[refs[i]] || familyKeyFromXref(refs[i]);
        if (familyKey && !byMember[r.gedcom_xref]) {
          byMember[r.gedcom_xref] = familyKey;
          break;
        }
      }
    });

    (normRecords || []).forEach(function (n) {
      var key;
      if (n.record_type === "FAM") {
        key = byFamXref[n.gedcom_xref] || familyKeyFromXref(n.gedcom_xref);
      } else {
        key = byMember[n.gedcom_xref] || familyKeyFromSurname(n.surname_norm);
      }
      if (!key) {
        key = "FAM:UNASSIGNED";
      }
      out[n.pipeline_id] = key;
    });

    return out;
  }

  function parsePayload(row) {
    if (!row) {
      return {};
    }
    if (row.norm_payload_json && typeof row.norm_payload_json === "object") {
      return row.norm_payload_json;
    }
    if (typeof row.norm_payload_json === "string" && row.norm_payload_json) {
      try {
        return JSON.parse(row.norm_payload_json);
      } catch (_) {
        return {};
      }
    }
    return {};
  }

  function bump(map, key) {
    if (!key) {
      return;
    }
    map[key] = (map[key] || 0) + 1;
  }

  function pickTop(map) {
    var best = "";
    var bestCount = 0;
    Object.keys(map || {}).forEach(function (k) {
      if (map[k] > bestCount) {
        best = k;
        bestCount = map[k];
      }
    });
    return { value: best, count: bestCount };
  }

  function buildProfiles(familyLogs) {
    var work = {};
    (familyLogs || []).forEach(function (row) {
      var key = row && row.family_key ? row.family_key : "FAM:UNASSIGNED";
      work[key] = work[key] || {
        total: 0,
        surnames: {},
        birthPlaces: {}
      };
      work[key].total += 1;
      var payload = parsePayload(row);
      bump(work[key].surnames, upper(payload.surname_norm));
      bump(work[key].birthPlaces, clean(payload.birth_place_norm));
    });

    var profiles = {};
    Object.keys(work).forEach(function (k) {
      var surname = pickTop(work[k].surnames);
      var birthPlace = pickTop(work[k].birthPlaces);
      var total = work[k].total || 1;
      profiles[k] = {
        total: work[k].total,
        surname_norm: surname.value,
        surname_conf: Math.round((surname.count / total) * 100),
        birth_place_norm: birthPlace.value,
        birth_place_conf: Math.round((birthPlace.count / total) * 100)
      };
    });
    return profiles;
  }

  function apply(params) {
    var p = params || {};
    var familyKeys = buildFamilyKeyMap(p.rawRecords || [], p.normRecords || []);
    var profiles = buildProfiles(p.familyLogs || []);
    var applied = 0;

    var out = (p.normRecords || []).map(function (rec) {
      var norm = clone(rec);
      var key = familyKeys[norm.pipeline_id] || "FAM:UNASSIGNED";
      var profile = profiles[key] || null;
      var changes = [];

      norm.family_key = key;
      norm.ai_norm = {
        source: "IMPORT_LOG_FAMILY",
        applied: false,
        confidence: 0,
        reason: ""
      };

      if (profile && norm.record_type === "INDI") {
        if (profile.surname_norm && (!norm.surname_norm || (norm.surname_conf || 0) <= 95)) {
          var beforeSurname = norm.surname_norm || "";
          if (beforeSurname !== profile.surname_norm) {
            norm.surname_norm = profile.surname_norm;
            norm.surname_conf = Math.max(norm.surname_conf || 0, profile.surname_conf || 0);
            norm.norm_details = norm.norm_details || [];
            norm.norm_details.push({
              field: "surname",
              from: beforeSurname,
              to: profile.surname_norm,
              conf: profile.surname_conf || 0,
              rule: "AI-FAM-001"
            });
            changes.push("surname");
          }
        }
        if (profile.birth_place_norm && !norm.birth_place_norm) {
          norm.birth_place_norm = profile.birth_place_norm;
          norm.birth_place_conf = Math.max(norm.birth_place_conf || 0, profile.birth_place_conf || 0);
          norm.norm_details = norm.norm_details || [];
          norm.norm_details.push({
            field: "birth_place",
            from: "",
            to: profile.birth_place_norm,
            conf: profile.birth_place_conf || 0,
            rule: "AI-FAM-002"
          });
          changes.push("birth_place");
        }
      }

      if (changes.length) {
        applied += 1;
        norm.ai_norm.applied = true;
        norm.ai_norm.confidence = Math.max(profile.surname_conf || 0, profile.birth_place_conf || 0);
        norm.ai_norm.reason = "profile:" + key + " fields=" + changes.join(",");
      }

      return norm;
    });

    return {
      records: out,
      familyKeys: familyKeys,
      profiles: profiles,
      stats: {
        profiles: Object.keys(profiles).length,
        applied: applied
      }
    };
  }

  GN370.IMPORT.familyLogAgent = {
    apply: apply,
    buildFamilyKeyMap: buildFamilyKeyMap,
    buildProfiles: buildProfiles
  };
}(window));
