import assert from "node:assert/strict";
import { test } from "node:test";
import { createStyle, renderPassage, wrap } from "../src/render.js";

const plain = createStyle(false);
const book = { name: "Genesis" };
const verse = (verse, text) => ({ verse, text });

test("wrap breaks on word boundaries", () => {
  assert.deepEqual(wrap("one two three four", 9), ["one two", "three", "four"]);
  assert.deepEqual(wrap("", 9), []);
});

test("style emits ANSI codes only when enabled", () => {
  assert.equal(createStyle(true).bold("x"), "\x1b[1mx\x1b[0m");
  assert.equal(plain.bold("x"), "x");
});

test("renders header and verse numbers", () => {
  const out = renderPassage(
    { book, chapter: 1, from: 1, to: 2, verses: [verse(1, "alpha"), verse(2, "beta")] },
    { translation: "kjv", style: plain, width: 80 },
  );
  assert.equal(out, "Genesis 1:1-2  KJV\n1  alpha\n2  beta\n");
});

test("right-aligns verse numbers", () => {
  const out = renderPassage(
    { book, chapter: 1, from: null, to: null, verses: [verse(9, "x"), verse(10, "y")] },
    { translation: "kjv", style: plain, width: 80 },
  );
  assert.deepEqual(out.split("\n").slice(1, 3), [" 9  x", "10  y"]);
});

test("indents wrapped lines under the text", () => {
  const out = renderPassage(
    { book, chapter: 1, from: null, to: null, verses: [verse(1, "aaaa bbbb cccc dddd eeee")] },
    { translation: "kjv", style: plain, width: 23 },
  );
  assert.deepEqual(out.split("\n").slice(1, 3), ["1  aaaa bbbb cccc dddd", "   eeee"]);
});
