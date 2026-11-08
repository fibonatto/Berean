import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TRANSLATIONS = {
  acf: "Almeida Corrigida Fiel",
  kjf: "King James Fiel",
  naa: "Nova Almeida Atualizada",
  nvi: "Nova Versão Internacional",
  nvt: "Nova Versão Transformadora",
};

function normalize(id) {
  const file = fileURLToPath(new URL(`../data/bible-${id}.json`, import.meta.url));
  const raw = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));

  const sourceBooks = Array.isArray(raw) ? raw : raw.books;
  if (!Array.isArray(sourceBooks)) {
    throw new Error(`${id}: expected an array of books`);
  }

  const first = sourceBooks[0]?.chapters?.[0];
  if (first && !Array.isArray(first) && Array.isArray(first.verses)) {
    console.log(`${id}: already normalized, skipped`);
    return;
  }

  const skipped = [];
  const books = sourceBooks.map((book) => {
    if (!Array.isArray(book.chapters)) {
      throw new Error(`${id}: invalid chapters in ${book.name}`);
    }

    return {
      ...book,
      chapters: book.chapters.map((verses, chapterIndex) => {
        const chapter = chapterIndex + 1;
        if (!Array.isArray(verses)) {
          throw new Error(`${id}: invalid chapter ${chapter} in ${book.name}`);
        }

        return {
          chapter,
          verses: verses.flatMap((text, verseIndex) => {
            const verse = verseIndex + 1;
            if (typeof text !== "string") {
              throw new Error(`${id}: invalid verse ${chapter}:${verse} in ${book.name}`);
            }
            if (!text.trim()) {
              skipped.push(`${book.name} ${chapter}:${verse}`);
              return [];
            }
            return [{ verse, text }];
          }),
        };
      }),
    };
  });

  const data = { translation: id, source: TRANSLATIONS[id], books };
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`${id}: normalized ${books.length} books`);
  if (skipped.length) {
    console.log(`  skipped ${skipped.length} empty verses: ${skipped.join(", ")}`);
  }
}

const ids = process.argv.slice(2);
const unknown = ids.filter((id) => !(id in TRANSLATIONS));
if (!ids.length || unknown.length) {
  const known = Object.keys(TRANSLATIONS).join(", ");
  console.error(`usage: node scripts/normalize.js <id>...  (known: ${known})`);
  process.exit(2);
}

ids.forEach(normalize);
