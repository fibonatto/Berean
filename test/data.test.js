import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { bookKeys } from "../src/books.js";
import { DEFAULT_DATA_DIR, listTranslations, loadBooks } from "../src/data.js";

const translations = existsSync(DEFAULT_DATA_DIR) ? listTranslations(DEFAULT_DATA_DIR) : [];

for (const id of translations) {
  test(`data/bible-${id}.json is well formed`, () => {
    const { books } = loadBooks(DEFAULT_DATA_DIR, id);
    assert.ok(books.length > 0, "no books");

    const owners = new Map();
    for (const book of books) {
      assert.ok(book.id && book.name, `book without id or name: ${JSON.stringify(book.id)}`);

      for (const key of new Set(bookKeys(book))) {
        const owner = owners.get(key);
        assert.ok(!owner, `"${key}" matches both ${owner} and ${book.name}`);
        owners.set(key, book.name);
      }

      let previousChapter = 0;
      for (const chapter of book.chapters) {
        assert.ok(chapter.chapter > previousChapter, `${book.name}: chapter order at ${chapter.chapter}`);
        previousChapter = chapter.chapter;

        let previousVerse = 0;
        for (const verse of chapter.verses) {
          const where = `${book.name} ${chapter.chapter}:${verse.verse}`;
          assert.ok(verse.verse > previousVerse, `${where}: verse order`);
          assert.ok(typeof verse.text === "string" && verse.text.trim(), `${where}: empty text`);
          previousVerse = verse.verse;
        }
      }
    }
  });
}
