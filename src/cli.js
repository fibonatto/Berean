import { readFileSync } from "node:fs";
import { DEFAULT_TRANSLATION, parseArgs } from "./args.js";
import { findBook, selectPassage } from "./books.js";
import { DEFAULT_DATA_DIR, listTranslations, loadBooks } from "./data.js";
import { CliError, UsageError } from "./errors.js";
import { HELP } from "./help.js";
import { parseReference } from "./reference.js";
import { createStyle, renderList, renderPassage, renderSearch } from "./render.js";
import { search } from "./search.js";

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
  if (!opts.list && opts.search === null && opts.positional.length === 0) {
    throw new UsageError("missing book and chapter");
  }

  const style = createStyle(colorEnabled(opts, { isTTY, env }));
  const width = Math.min(columns, MAX_WIDTH);
  const dir = env.BT_DATA_DIR || DEFAULT_DATA_DIR;
  const requested = opts.translation ?? (env.BT_TRANSLATION || DEFAULT_TRANSLATION);
  const { id, books } = loadBooks(dir, requested);

  if (opts.list) {
    return renderList({ translations: listTranslations(dir), books }, { style });
  }

  if (opts.search !== null) {
    const query = [opts.search, ...opts.positional].join(" ");
    const result = search(books, query, { limit: opts.limit });
    if (!result.total) throw new CliError(`no verses match "${query}"`);
    return renderSearch({ query, ...result }, { translation: id, style, width });
  }

  const ref = parseReference(opts.positional.join(" "));
  const passage = selectPassage(findBook(books, ref.book), ref);
  return renderPassage(passage, { translation: id, style, width });
}
