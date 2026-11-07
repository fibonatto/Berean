
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(
  new URL("../data/bible-acf.json", import.meta.url),
);

const books = JSON.parse(
  readFileSync(file, "utf8").replace(/^\uFEFF/, ""),
);

const sourceBooks = Array.isArray(books) ? books : books.books;

if (!Array.isArray(sourceBooks)) {
  throw new Error("Expected ACF data to contain an array of books");
}

const normalizedBooks = sourceBooks.map((book) => {
  if (!Array.isArray(book.chapters)) {
    throw new Error(`Invalid chapters in ${book.name}`);
  }

  return {
    ...book,
    chapters: book.chapters.map((verses, chapterIndex) => {
      if (!Array.isArray(verses)) {
        throw new Error(
          `Invalid chapter ${chapterIndex + 1} in ${book.name}`,
        );
      }

      return {
        chapter: chapterIndex + 1,
        verses: verses.map((text, verseIndex) => {
          if (typeof text !== "string" || !text.trim()) {
            throw new Error(
              `Invalid verse ${chapterIndex + 1}:${verseIndex + 1} in ${book.name}`,
            );
          }

          return {
            verse: verseIndex + 1,
            text,
          };
        }),
      };
    }),
  };
});

const data = {
  translation: "acf",
  source: "Almeida Corrigida Fiel",
  books: normalizedBooks,
};

writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(`Normalized ${normalizedBooks.length} ACF books.`);
