import { DEFAULT_LIMIT, DEFAULT_TRANSLATION } from "./args.js";

export const USAGE = `usage: bt [options] <book> <chapter> [verse[-end]]
       bt [options] -s <query>
       bt -l`;

export const HELP = `${USAGE}

Print Bible passages to the terminal.

Examples:
  bt psa 23          whole chapter
  bt prov 1 1        single verse
  bt prov 1:1-5      verse range
  bt "1 cor" 13 4    numbered books
  bt -s "love one"   search verses

Books match by id, abbreviation, name or unique name prefix,
ignoring case and punctuation (gen, Genesis, 1jn).

Search ignores case, accents and word order, and tolerates small
typos. Verses containing the exact phrase are listed first.

Options:
  -t, --translation <id>  translation to read (default: $BT_TRANSLATION or ${DEFAULT_TRANSLATION})
  -s, --search <query>    search verses for words or a phrase
  -n, --limit <count>     maximum search results (default: ${DEFAULT_LIMIT})
  -l, --list              list translations and books
      --no-color          disable colored output
  -h, --help              show this help
  -V, --version           show version

Environment:
  NO_COLOR, FORCE_COLOR   control colored output
  BT_TRANSLATION          default translation id
  BT_DATA_DIR             directory holding the bible-<id>.json files`;
