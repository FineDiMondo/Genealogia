const assert = require("assert");
const core = require("../player/commands-core.js");

function test(name, fn) {
  try {
    fn();
    console.log("[PASS]", name);
  } catch (err) {
    console.error("[FAIL]", name, "->", err.message);
    process.exitCode = 1;
  }
}

test("PARSE-001: parse command and args", () => {
  const parsed = core.parse("play 3");
  assert.strictEqual(parsed.cmd, "PLAY");
  assert.deepStrictEqual(parsed.args, ["3"]);
});

test("PARSE-002: known command set", () => {
  assert.strictEqual(core.isKnownCommand("LOAD"), true);
  assert.strictEqual(core.isKnownCommand("foo"), false);
});

test("FLAC-001: extension accepts .flac", () => {
  assert.strictEqual(core.isFlacExtension("https://cdn/site/track.flac"), true);
  assert.strictEqual(core.isFlacExtension("./audio/song.flac?x=1"), true);
});

test("FLAC-002: extension rejects non-flac", () => {
  assert.strictEqual(core.isFlacExtension("/audio/song.mp3"), false);
  assert.strictEqual(core.isFlacExtension(""), false);
});

test("FLAC-003: mime accepts audio/flac", () => {
  assert.strictEqual(core.isFlacMime("audio/flac"), true);
  assert.strictEqual(core.isFlacMime("audio/x-flac; charset=binary"), true);
});

test("FLAC-004: mime rejects others", () => {
  assert.strictEqual(core.isFlacMime("audio/mpeg"), false);
  assert.strictEqual(core.isFlacMime("video/flac"), false);
});

test("REC-001: record format deterministic", () => {
  const rec = core.formatRecord(
    {
      state: "PLAYING",
      trackIndex: 2,
      timeSec: 123,
      durationSec: 301,
      sampleRate: 44100,
      bitDepth: 16,
      channels: 2,
      volume: 85,
      file: "song.flac"
    },
    core.RC.OK,
    core.RSN.NONE,
    "PLAY_OK"
  );

  assert.ok(rec.includes("RC=0"));
  assert.ok(rec.includes("RSN=0"));
  assert.ok(rec.includes("STATE=PLAYING"));
  assert.ok(rec.includes("TRACK=03"));
  assert.ok(rec.includes("TIME=123"));
  assert.ok(rec.includes("DUR=301"));
  assert.ok(rec.includes("SR=44100"));
  assert.ok(rec.includes("BIT=16"));
  assert.ok(rec.includes("CH=2"));
  assert.ok(rec.includes("VOL=85"));
  assert.ok(rec.includes("FILE=song.flac"));
  assert.ok(rec.includes("MSG=PLAY_OK"));
});

if (!process.exitCode) {
  console.log("[OK] player command-core tests passed");
}
