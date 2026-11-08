import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CliError, UsageError } from "../src/errors.js";
import { run } from "../src/cli.js";

const fixtures = fileURLToPath(new URL("./fixtures/", import.meta.url));
const bin = fileURLToPath(new URL("../bin/bt.js", import.meta.url));
const env = { BT_DATA_DIR: fixtures, BT_TRANSLATION: "" };
const bt = (args, options = {}) => run(args, { env, ...options });

test("prints a single verse", () => {
  assert.equal(bt(["gen", "1", "1"]), "Genesis 1:1  KJV\n1  First verse.\n");
});

test("prints a whole chapter", () => {
  assert.equal(
    bt(["gen", "1"]),
    "Genesis 1  KJV\n1  First verse.\n2  Second verse.\n3  Third verse.\n",
  );
});

test("prints a verse range written as chapter:verse-end", () => {
  assert.equal(bt(["gen", "1:2-3"]), "Genesis 1:2-3  KJV\n2  Second verse.\n3  Third verse.\n");
});

test("resolves numbered books given as separate arguments", () => {
  assert.match(bt(["1 jn", "1", "1"]), /^1 John 1:1/);
  assert.match(bt(["1jn", "1", "1"]), /^1 John 1:1/);
});

test("translation lookup ignores case", () => {
  assert.match(bt(["-t", "KJV", "gen", "1", "1"]), /KJV/);
  assert.match(bt(["--translation=kjv", "gen", "1", "1"]), /KJV/);
});

test("colors only on a TTY unless overridden", () => {
  const ansi = /\x1b\[/;
  assert.doesNotMatch(bt(["gen", "1", "1"]), ansi);
  assert.match(bt(["gen", "1", "1"], { isTTY: true }), ansi);
  assert.match(bt(["gen", "1", "1"], { env: { ...env, FORCE_COLOR: "1" } }), ansi);
  assert.doesNotMatch(bt(["gen", "1", "1"], { isTTY: true, env: { ...env, NO_COLOR: "1" } }), ansi);
  assert.doesNotMatch(bt(["--no-color", "gen", "1", "1"], { isTTY: true }), ansi);
});

test("lists translations and books", () => {
  const out = bt(["-l"]);
  assert.match(out, /Translations\n {2}kjv/);
  assert.match(out, /Genesis/);
});

test("help and version need no data", () => {
  const options = { env: { BT_DATA_DIR: "/nonexistent" } };
  assert.match(run(["--help"], options), /^usage: bt/);
  assert.match(run(["-V"], options), /^\d+\.\d+\.\d+\n$/);
});

test("usage errors", () => {
  assert.throws(() => bt([]), UsageError);
  assert.throws(() => bt(["--bogus"]), /unknown option/);
  assert.throws(() => bt(["-t"]), /requires a value/);
  assert.throws(() => bt(["gen"]), /invalid reference/);
});

test("lookup errors", () => {
  assert.throws(() => bt(["nope", "1"]), /book not found/);
  assert.throws(() => bt(["gen", "9"]), /no chapter 9/);
  assert.throws(() => bt(["-t", "xyz", "gen", "1"]), /unknown translation: xyz \(available: kjv\)/);
  assert.throws(() => bt(["nope", "1"]), CliError);
});

test("binary exits with 0, 1 and 2", () => {
  const exec = (...args) =>
    spawnSync(process.execPath, [bin, ...args], {
      env: { ...process.env, ...env },
      encoding: "utf8",
    });

  assert.equal(exec("gen", "1", "1").status, 0);

  const notFound = exec("gen", "99");
  assert.equal(notFound.status, 1);
  assert.match(notFound.stderr, /^bt: Genesis has no chapter 99/);

  const usage = exec();
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage: bt/);
});
