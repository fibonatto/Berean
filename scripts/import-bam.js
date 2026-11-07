#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

// [name in the source file, abbreviation, ...extra aliases]
const OLD_TESTAMENT = [
  ["Gênesis", "Gn"],
  ["Êxodo", "Ex"],
  ["Levítico", "Lv"],
  ["Números", "Nm"],
  ["Deuteronômio", "Dt"],
  ["Josué", "Js"],
  ["Juízes", "Jz"],
  ["Rute", "Rt"],
  ["I Samuel", "1Sm", "1 Samuel"],
  ["II Samuel", "2Sm", "2 Samuel"],
  ["I Reis", "1Rs", "1 Reis"],
  ["II Reis", "2Rs", "2 Reis"],
  ["I Crônicas", "1Cr", "1 Crônicas"],
  ["II Crônicas", "2Cr", "2 Crônicas"],
  ["Esdras", "Esd"],
  ["Neemias", "Ne"],
  ["Tobias", "Tb"],
  ["Judite", "Jt"],
  ["Ester", "Est"],
  ["Jó", "Jb", "Job"],
  ["Salmos", "Sl", "Salmo"],
  ["I Macabeus", "1Mc", "1 Macabeus"],
  ["II Macabeus", "2Mc", "2 Macabeus"],
  ["Provérbios", "Pr"],
  ["Eclesiastes", "Ecl"],
  ["Cântico dos Cânticos", "Ct", "Cantares"],
  ["Sabedoria", "Sb"],
  ["Eclesiástico", "Eclo"],
  ["Isaías", "Is"],
  ["Jeremias", "Jr"],
  ["Lamentações", "Lm"],
  ["Baruc", "Br"],
  ["Ezequiel", "Ez"],
  ["Daniel", "Dn"],
  ["Oséias", "Os"],
  ["Joel", "Jl"],
  ["Amós", "Am"],
  ["Abdias", "Ab"],
  ["Jonas", "Jn"],
  ["Miquéias", "Mq"],
  ["Naum", "Na"],
  ["Habacuc", "Hab"],
  ["Sofonias", "Sf"],
  ["Ageu", "Ag"],
  ["Zacarias", "Zc"],
  ["Malaquias", "Ml"],
];

const NEW_TESTAMENT = [
  ["São Mateus", "Mt", "Mateus"],
  ["São Marcos", "Mc", "Marcos"],
  ["São Lucas", "Lc", "Lucas"],
  ["São João", "Jo", "João"],
  ["Atos dos Apóstolos", "At", "Atos"],
  ["Romanos", "Rm"],
  ["I Coríntios", "1Cor", "1 Coríntios"],
  ["II Coríntios", "2Cor", "2 Coríntios"],
  ["Gálatas", "Gl"],
  ["Efésios", "Ef"],
  ["Filipenses", "Fl"],
  ["Colossenses", "Cl"],
  ["I Tessalonicenses", "1Ts", "1 Tessalonicenses"],
  ["II Tessalonicenses", "2Ts", "2 Tessalonicenses"],
  ["I Timóteo", "1Tm", "1 Timóteo"],
  ["II Timóteo", "2Tm", "2 Timóteo"],
  ["Tito", "Tt"],
  ["Filêmon", "Fm"],
  ["Hebreus", "Hb"],
  ["São Tiago", "Tg", "Tiago"],
  ["I São Pedro", "1Pd", "1 Pedro"],
  ["II São Pedro", "2Pd", "2 Pedro"],
  ["I São João", "1Jo", "1 João"],
  ["II São João", "2Jo", "2 João"],
  ["III São João", "3Jo", "3 João"],
  ["São Judas", "Jd", "Judas"],
  ["Apocalipse", "Ap"],
];

function fail(message) {
  console.error(`import-bam: ${message}`);
  process.exit(1);
}

function convertBook(book, [, abbrev, ...aliases]) {
  return {
    id: abbrev,
    abbrev,
    name: book.nome.trim(),
    aliases,
    chapters: book.capitulos.map((c) => ({
      chapter: c.capitulo,
      verses: c.versiculos.map((v) => ({ verse: v.versiculo, text: v.texto.trim() })),
    })),
  };
}

function convertTestament(books, table, label) {
  if (!Array.isArray(books)) fail(`${label}: missing`);

  const entries = new Map(table.map((entry) => [entry[0], entry]));
  const unknown = books.map((b) => b.nome.trim()).filter((name) => !entries.has(name));
  const present = new Set(books.map((b) => b.nome.trim()));
  const missing = table.map(([name]) => name).filter((name) => !present.has(name));

  if (unknown.length) fail(`${label}: unknown books: ${unknown.join(", ")}`);
  if (missing.length) fail(`${label}: missing books: ${missing.join(", ")}`);

  return books.map((book) => convertBook(book, entries.get(book.nome.trim())));
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: import-bam <input.json> <output.json>");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(input, "utf8"));
const books = [
  ...convertTestament(raw.antigoTestamento, OLD_TESTAMENT, "antigoTestamento"),
  ...convertTestament(raw.novoTestamento, NEW_TESTAMENT, "novoTestamento"),
];

const translation = basename(output).replace(/^bible-|\.json$/g, "");
writeFileSync(output, `${JSON.stringify({ translation, books })}\n`);

for (const b of books) {
  console.log(`${b.abbrev.padEnd(5)} ${b.name} (${b.chapters.length})`);
}
