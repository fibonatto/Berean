import { CliError } from "./errors.js";

const fold = (s) =>
  s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const plain = (s) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const labelsOf = (book) =>
  [book.id, book.abbrev, book.name, ...(book.aliases ?? [])].filter(Boolean);

export const bookKeys = (book) => labelsOf(book).map(fold);

export function findBook(books, query) {
  for (const normalize of [fold, plain]) {
    const key = normalize(query);
    const exact = key && books.find((b) => labelsOf(b).some((l) => normalize(l) === key));
    if (exact) return exact;
  }

  const key = plain(query);
  if (key) {
    const prefixed = books.filter((b) =>
      [b.name, ...(b.aliases ?? [])].some((l) => plain(l).startsWith(key)),
    );
    if (prefixed.length === 1) return prefixed[0];
    if (prefixed.length > 1) {
      const names = prefixed.map((b) => b.name).join(", ");
      throw new CliError(`ambiguous book "${query}": ${names}`);
    }
  }
  throw new CliError(`book not found: ${query} (see 'bt -l')`);
}

export function selectPassage(book, { chapter: number, from, to }) {
  const chapter = book.chapters.find((c) => c.chapter === number);
  if (!chapter) throw new CliError(`${book.name} has no chapter ${number}`);

  const verses =
    from === null
      ? chapter.verses
      : chapter.verses.filter((v) => v.verse >= from && v.verse <= to);
  if (!verses.length) throw new CliError(`${book.name} ${number}: verse not found`);

  return { book, chapter: number, from, to, verses };
}
