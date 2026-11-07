import { DEFAULT_TRANSLATION } from "./args.js";

export const USAGE = `usage: bt [options] <book> <chapter> [verse[-end]]
       bt -l`;

export const HELP = `${USAGE}

Print Bible passages to the terminal.

Examples:
  bt psa 23          whole chapter
  bt prov 1 1        single verse
  bt prov 1:1-5      verse range
  bt "1 cor" 13 4    numbered books

Books match by id, abbreviation, name or unique name prefix,
ignoring case and punctuation (gen, Genesis, 1jn).

Options:
  -t, --translation <id>  translation to read (default: ${DEFAULT_TRANSLATION})
  -l, --list              list translations and books
      --no-color          disable colored output
  -h, --help              show this help
  -V, --version           show version

Environment:
  NO_COLOR, FORCE_COLOR   control colored output
  BT_DATA_DIR             directory holding the bible-<id>.json files`;
