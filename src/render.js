const GUTTER = 2;
const MIN_TEXT_WIDTH = 20;

export function createStyle(enabled) {
  const paint = (code) => (text) => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text);
  return { bold: paint(1), dim: paint(2), match: paint("1;33") };
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

function emphasize(line, offset, marks, style) {
  let out = "";
  let cursor = 0;
  for (const { start, end } of marks) {
    const from = start - offset;
    const to = end - offset;
    if (from < cursor || to > line.length) continue;
    out += line.slice(cursor, from) + style.match(line.slice(from, to));
    cursor = to;
  }
  return out + line.slice(cursor);
}

export function renderSearch(
  { query, hits, total, partial },
  { translation, style, width },
) {
  const noun = total === 1 ? "result" : "results";
  const summary = `${total} ${noun}${partial ? ", partial matches" : ""}`;
  const header = [
    style.bold(`"${query}"`),
    style.dim(translation.toUpperCase()),
    style.dim(summary),
  ].join("  ");

  const indent = " ".repeat(GUTTER);
  const textWidth = Math.max(width - GUTTER, MIN_TEXT_WIDTH);

  const entries = hits.map((hit) => {
    const reference = style.bold(`${hit.book.name} ${hit.chapter}:${hit.verse}`);
    let offset = 0;
    const lines = wrap(hit.text, textWidth).map((line) => {
      const rendered = `${indent}${emphasize(line, offset, hit.marks, style)}`;
      offset += line.length + 1;
      return rendered;
    });
    return [reference, ...lines].join("\n");
  });

  const blocks = [header, ...entries];
  if (hits.length < total) {
    blocks.push(style.dim(`showing the first ${hits.length}; use -n <count> for more`));
  }
  return `${blocks.join("\n\n")}\n`;
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
