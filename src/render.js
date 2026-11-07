const GUTTER = 2;
const MIN_TEXT_WIDTH = 20;

export function createStyle(enabled) {
  const paint = (code) => (text) => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text);
  return { bold: paint(1), dim: paint(2) };
}

export function wrap(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderPassage({ book, chapter, from, to, verses }, { translation, style, width }) {
  const range = from === null ? "" : `:${from}${to !== from ? `-${to}` : ""}`;
  const header = `${style.bold(`${book.name} ${chapter}${range}`)}  ${style.dim(translation.toUpperCase())}`;

  const numberWidth = String(verses.at(-1).verse).length;
  const indent = numberWidth + GUTTER;
  const textWidth = Math.max(width - indent, MIN_TEXT_WIDTH);

  const body = verses.map((v) => {
    const number = style.dim(String(v.verse).padStart(numberWidth));
    const text = wrap(v.text, textWidth).join(`\n${" ".repeat(indent)}`);
    return `${number}${" ".repeat(GUTTER)}${text}`;
  });

  return `${[header, ...body].join("\n")}\n`;
}

export function renderList({ translations, books }, { style }) {
  const label = (b) => b.abbrev || b.id;
  const pad = Math.max(...books.map((b) => label(b).length));

  const lines = [
    style.bold("Translations"),
    ...translations.map((t) => `  ${t}`),
    "",
    style.bold("Books"),
    ...books.map((b) => `  ${style.dim(label(b).padEnd(pad))}  ${b.name}`),
  ];
  return `${lines.join("\n")}\n`;
}
