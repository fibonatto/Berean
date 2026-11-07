import assert from "node:assert/strict";
import { test } from "node:test";
import { UsageError } from "../src/errors.js";
import { parseReference } from "../src/reference.js";

test("whole chapter", () => {
  assert.deepEqual(parseReference("psa 23"), {
    book: "psa",
    chapter: 23,
    from: null,
    to: null,
  });
});

test("single verse, separated by space or colon", () => {
  const expected = { book: "prov", chapter: 1, from: 1, to: 1 };
  assert.deepEqual(parseReference("prov 1 1"), expected);
  assert.deepEqual(parseReference("prov 1:1"), expected);
});

test("verse range", () => {
  assert.deepEqual(parseReference("prov 1:1-5"), {
    book: "prov",
    chapter: 1,
    from: 1,
    to: 5,
  });
});

test("numbered and multi-word books", () => {
  assert.equal(parseReference("1 cor 13 4").book, "1 cor");
  assert.equal(parseReference("song of solomon 2:1").book, "song of solomon");
});

test("rejects malformed references", () => {
  for (const input of ["psalms", "psa 0", "psa 1 0", "psa 1 5-3", ""]) {
    assert.throws(() => parseReference(input), UsageError, input);
  }
});
