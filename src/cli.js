import { readFileSync } from "node:fs";
import { parseArgs } from "./args.js";
import { findBook, selectPassage } from "./books.js";
import { DEFAULT_DATA_DIR, listTranslations, loadBooks } from "./data.js";
import { UsageError } from "./errors.js";
import { HELP } from "./help.js";
import { parseReference } from "./reference.js";
import { createStyle, renderList, renderPassage } from "./render.js";

const MAX_WIDTH = 100;

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

function colorEnabled(opts, { isTTY, env }) {
  if (opts.color === false || env.NO_COLOR) return false;
  if (env.FORCE_COLOR) return env.FORCE_COLOR !== "0";
  return Boolean(isTTY);
}

export function run(argv, { isTTY = false, columns = 80, env = {} } = {}) {
  const opts = parseArgs(argv);
  if (opts.help) return `${HELP}\n`;
  if (opts.version) return `${version}\n`;
  if (!opts.list && opts.positional.length === 0) {
    throw new UsageError("missing book and chapter");
  }

  const style = createStyle(colorEnabled(opts, { isTTY, env }));
  const dir = env.BT_DATA_DIR || DEFAULT_DATA_DIR;
  const { id, books } = loadBooks(dir, opts.translation);

  if (opts.list) {
    return renderList({ translations: listTranslations(dir), books }, { style });
  }

  const ref = parseReference(opts.positional.join(" "));
  const passage = selectPassage(findBook(books, ref.book), ref);
  return renderPassage(passage, {
    translation: id,
    style,
    width: Math.min(columns, MAX_WIDTH),
  });
}
