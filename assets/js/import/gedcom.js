(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  function mapGedcomDate(input) {
    var v = String(input || "").trim();
    if (!v) {
      return { date: "", date_end: "", qual: "U", cal: "G" };
    }
    if (/^ABT\s+/i.test(v)) {
      return { date: "~" + v.replace(/^ABT\s+/i, ""), date_end: "", qual: "A", cal: "G" };
    }
    var range = v.match(/^FROM\s+(\d{3,4})\s+TO\s+(\d{3,4})/i);
    if (range) {
      return { date: range[1], date_end: range[2], qual: "N", cal: "G" };
    }
    var jul = v.match(/^@#DJULIAN@\s+(.*)$/i);
    if (jul) {
      return { date: jul[1], date_end: "", qual: "E", cal: "J" };
    }
    return { date: v, date_end: "", qual: "E", cal: "G" };
  }

  function parse(text) {
    var lines = String(text || "").split(/\r?\n/);
    var person = [];
    var family = [];
    var familyLink = [];
    var source = [];
    var citation = [];
    var event = [];

    var current = null;
    var mode = null;

    lines.forEach(function (line) {
      var m0 = line.match(/^0\s+(@[^@]+@)\s+(\w+)/);
      if (m0) {
        mode = null;
        var gid = m0[1];
        var typ = m0[2].toUpperCase();
        if (typ === "INDI") {
          current = {
            __type: "INDI",
            gedcom_id: gid,
            person_id: "GNP" + String(person.length + 1).padStart(9, "0"),
            surname: "",
            given_name: "",
            gender: "U",
            birth_date: "",
            birth_qual: "U",
            birth_cal: "G",
            death_date: "",
            death_qual: "U",
            death_cal: "G",
            notes: ""
          };
          person.push(current);
          return;
        }
        if (typ === "FAM") {
          current = {
            __type: "FAM",
            gedcom_id: gid,
            family_id: "GNF" + String(family.length + 1).padStart(9, "0"),
            father_id: "",
            mother_id: "",
            union_date: "",
            union_date_qual: "U"
          };
          family.push(current);
          return;
        }
        if (typ === "SOUR") {
          current = {
            __type: "SOUR",
            gedcom_id: gid,
            source_id: "GNS" + String(source.length + 1).padStart(9, "0"),
            title: "",
            notes: ""
          };
          source.push(current);
          return;
        }
        current = null;
        return;
      }

      if (!current) {
        return;
      }

      var mName = line.match(/^1\s+NAME\s+(.+)$/);
      if (mName && current.__type === "INDI") {
        var full = mName[1];
        var mm = full.match(/^(.*)\/(.*)\/(.*)$/);
        if (mm) {
          current.given_name = mm[1].trim();
          current.surname = mm[2].trim();
        } else {
          current.given_name = full.trim();
        }
        return;
      }

      var mSex = line.match(/^1\s+SEX\s+([A-Z])/);
      if (mSex && current.__type === "INDI") {
        current.gender = /^(M|F)$/i.test(mSex[1]) ? mSex[1].toUpperCase() : "U";
        return;
      }

      if (/^1\s+BIRT/.test(line)) { mode = "BIRT"; return; }
      if (/^1\s+DEAT/.test(line)) { mode = "DEAT"; return; }
      if (/^1\s+MARR/.test(line)) { mode = "MARR"; return; }

      var mDate = line.match(/^2\s+DATE\s+(.+)$/);
      if (mDate) {
        var mapped = mapGedcomDate(mDate[1]);
        if (current.__type === "INDI" && mode === "BIRT") {
          current.birth_date = mapped.date;
          current.birth_date_end = mapped.date_end;
          current.birth_qual = mapped.qual;
          current.birth_cal = mapped.cal;
          event.push({ event_id: "GNE" + String(event.length + 1).padStart(9, "0"), person_id: current.person_id, event_type: "BIRTH", event_date: mapped.date, event_date_end: mapped.date_end, event_date_qual: mapped.qual, event_cal: mapped.cal });
        } else if (current.__type === "INDI" && mode === "DEAT") {
          current.death_date = mapped.date;
          current.death_date_end = mapped.date_end;
          current.death_qual = mapped.qual;
          current.death_cal = mapped.cal;
        } else if (current.__type === "FAM" && mode === "MARR") {
          current.union_date = mapped.date;
          current.union_date_qual = mapped.qual;
        }
        return;
      }

      var mHusb = line.match(/^1\s+HUSB\s+(@[^@]+@)$/);
      if (mHusb && current.__type === "FAM") {
        var father = person.find(function (p) { return p.gedcom_id === mHusb[1]; });
        current.father_id = father ? father.person_id : "";
        return;
      }

      var mWife = line.match(/^1\s+WIFE\s+(@[^@]+@)$/);
      if (mWife && current.__type === "FAM") {
        var mother = person.find(function (p) { return p.gedcom_id === mWife[1]; });
        current.mother_id = mother ? mother.person_id : "";
        return;
      }

      var mChil = line.match(/^1\s+CHIL\s+(@[^@]+@)$/);
      if (mChil && current.__type === "FAM") {
        var child = person.find(function (p) { return p.gedcom_id === mChil[1]; });
        if (child) {
          familyLink.push({
            link_id: "GFL" + String(familyLink.length + 1).padStart(9, "0"),
            family_id: current.family_id,
            person_id: child.person_id,
            role: "CHILD"
          });
        }
        return;
      }

      var mTitl = line.match(/^1\s+TITL\s+(.+)$/);
      if (mTitl && current.__type === "INDI") {
        current.notes += (current.notes ? " || " : "") + "TITLE:" + mTitl[1].trim();
      }

      var mSour = line.match(/^1\s+SOUR\s+(@[^@]+@)$/);
      if (mSour && current.__type === "INDI") {
        citation.push({
          citation_id: "GNC" + String(citation.length + 1).padStart(9, "0"),
          source_ref_gedcom: mSour[1],
          person_id: current.person_id,
          source_id: ""
        });
      }
    });

    citation.forEach(function (c) {
      var s = source.find(function (x) { return x.gedcom_id === c.source_ref_gedcom; });
      c.source_id = s ? s.source_id : "";
      delete c.source_ref_gedcom;
    });

    person.forEach(function (p) { delete p.__type; });
    family.forEach(function (f) { delete f.__type; });
    source.forEach(function (s) { delete s.__type; });

    return {
      PERSON: person,
      FAMILY: family,
      FAMILY_LINK: familyLink,
      SOURCE: source,
      CITATION: citation,
      EVENT: event
    };
  }

  async function importFile(file) {
    var text = await file.text();
    var tables = parse(text);
    GN370.DB_ENGINE.reset();
    GN370.DB_ENGINE.populate(tables, { source: file.name, format: "GEDCOM" });
    var report = GN370.VALIDATE.run(GN370.DB_ENGINE.dump().tables);
    GN370.JOURNAL.entry("IMPORT_GEDCOM", "DB", "-", "GEDCOM loaded: " + file.name);
    return report;
  }

  GN370.IMPORT = GN370.IMPORT || {};
  GN370.IMPORT.gedcom = {
    parse: parse,
    importFile: importFile,
    mapGedcomDate: mapGedcomDate
  };
}(window));
