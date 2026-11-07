import assert from "node:assert/strict";
import { test } from "node:test";
import { findBook, selectPassage } from "../src/books.js";
import { CliError } from "../src/errors.js";

const make = (id, abbrev, name, extra = {}) => ({
  id,
  abbrev,
  name,
  chapters: [
    {
      chapter: 1,
      verses: [1, 2, 3].map((verse) => ({ verse, text: `v${verse}` })),
    },
  ],
  ...extra,
});

const books = [
  make("gen", "gen", "Genesis"),
  make("1jo", "1jn", "1 John", { aliases: ["first john"] }),
  make("mal", "mal", "Malachi"),
  make("mrk", "mark", "Mark"),
  make("mat", "matt", "Matthew"),
];

test("matches id, abbreviation, name and aliases, ignoring case and punctuation", () => {
  assert.equal(findBook(books, "GEN").name, "Genesis");
  assert.equal(findBook(books, "1 jn").name, "1 John");
  assert.equal(findBook(books, "1-John").name, "1 John");
  assert.equal(findBook(books, "First John").name, "1 John");
});

test("matches a unique name prefix", () => {
  assert.equal(findBook(books, "gene").name, "Genesis");
});

test("reports ambiguous prefixes with candidates", () => {
  assert.throws(() => findBook(books, "ma"), {
    name: "CliError",
    message: /Malachi, Mark, Matthew/,
  });
});

test("reports unknown books", () => {
  for (const query of ["xyz", "!!!"]) {
    assert.throws(() => findBook(books, query), CliError, query);
  }
});

test("selectPassage returns a chapter, a verse or a range", () => {
  const book = books[0];
  const pick = (from, to) => selectPassage(book, { chapter: 1, from, to }).verses.length;
  assert.equal(pick(null, null), 3);
  assert.equal(pick(2, 2), 1);
  assert.equal(pick(2, 3), 2);
});

test("selectPassage rejects missing chapters and verses", () => {
  const book = books[0];
  assert.throws(() => selectPassage(book, { chapter: 2, from: null, to: null }), /no chapter 2/);
  assert.throws(() => selectPassage(book, { chapter: 1, from: 9, to: 9 }), /verse not found/);
});


test("prefers an accent-exact match over an accent-insensitive one", () => {
  const pt = [make("Jb", "Jb", "Jó"), make("Jo", "Jo", "São João", { aliases: ["João"] })];
  assert.equal(findBook(pt, "jo").name, "São João");
  assert.equal(findBook(pt, "jó").name, "Jó");
});
