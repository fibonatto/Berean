import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TRANSLATIONS = {
  acf: "Almeida Corrigida Fiel",
  kjf: "King James Fiel",
  naa: "Nova Almeida Atualizada",
  ntlh: "Nova Tradução na Linguagem de Hoje",
  nvi: "Nova Versão Internacional",
  nvt: "Nova Versão Transformadora",
};

const dataFile = (id) => fileURLToPath(new URL(`../data/bible-${id}.json`, import.meta.url));

const readJson = (file) => JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));

const isNested = (book) => Array.isArray(book.chapters?.[0]?.verses);

function convertChapters(id, book, skipped) {
  if (!Array.isArray(book.chapters)) {
    throw new Error(`${id}: invalid chapters in ${book.name}`);
  }

  return book.chapters.map((verses, chapterIndex) => {
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
  });
}

function normalize(id, reference) {
  const file = dataFile(id);
  const raw = readJson(file);

  const sourceBooks = Array.isArray(raw) ? raw : raw.books;
  if (!Array.isArray(sourceBooks)) {
    throw new Error(`${id}: expected an array of books`);
  }
  if (sourceBooks.length !== reference.length) {
    throw new Error(`${id}: expected ${reference.length} books, found ${sourceBooks.length}`);
  }

  const skipped = [];
  const warnings = [];
  const books = sourceBooks.map((book, index) => {
    const chapters = isNested(book) ? book.chapters : convertChapters(id, book, skipped);
    const expected = reference[index].chapters.length;
    if (chapters.length !== expected) {
      warnings.push(`${book.name}: ${chapters.length} chapters, KJV has ${expected}`);
    }
    return { id: reference[index].id, ...book, chapters };
  });

  const data = { translation: id, source: TRANSLATIONS[id], books };
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`${id}: normalized ${books.length} books`);
  if (skipped.length) {
    console.log(`  skipped ${skipped.length} empty verses: ${skipped.join(", ")}`);
  }
  for (const warning of warnings) console.log(`  check: ${warning}`);
}

const ids = process.argv.slice(2);
const unknown = ids.filter((id) => !(id in TRANSLATIONS));
if (!ids.length || unknown.length) {
  const known = Object.keys(TRANSLATIONS).join(", ");
  console.error(`usage: node scripts/normalize.js <id>...  (known: ${known})`);
  process.exit(2);
}

const reference = readJson(dataFile("kjv")).books;
if (!reference.every((book) => book.id)) {
  throw new Error("kjv: every book needs an id to serve as reference");
}

ids.forEach((id) => normalize(id, reference));
