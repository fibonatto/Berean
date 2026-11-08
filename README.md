# Berean

A Bible reader for the terminal.

Berean provides a simple command-line interface for reading and searching Bible passages across multiple translations. It supports flexible book and verse references, typo-tolerant search, colored output, and independent translation data files.

```text
$ bt psa 23

Psalms 23  KJV
1  The LORD is my shepherd; I shall not want.
2  He maketh me to lie down in green pastures...
```

## Installation

Requires Node.js 18 or newer. No external dependencies.

```sh
git clone https://github.com/fibonatto/Berean.git
cd berean
npm link
```

This exposes the `bt` command globally.

## Usage

```sh
bt [options] <book> <chapter> [verse[-end]]
bt [options] -s <query>
bt -l
```

### Examples

```sh
bt psa 23              # entire chapter
bt prov 1 1            # single verse
bt prov 1:1-5          # verse range
bt "1 cor" 13 4        # numbered books
bt -t acf is 53 1      # specific translation
bt -t kjv ps 117       # KJV translation
bt -s "love one"       # search verses
bt -t acf -s "amar"    # search in a translation
bt -s "love" -n 20     # limit results
bt -l                  # list translations and books
```

### Book resolution

Books can be identified by their ID, abbreviation, full name, or unique name prefix.

Matching is case-insensitive and ignores punctuation.

```sh
bt gen 1
bt Genesis 1
bt 1jn 1
bt PSALM 117
```

Ambiguous prefixes return the matching candidates.

### Search

Use `-s` or `--search` to find verses by words or phrase. The search runs on the selected translation.

```sh
bt -s "aquele que habita"
bt -t bam -s "não matarás"
bt -s "love one" -n 20
```

```text
$ bt -t bam -s "não matarás" -n 2

"não matarás"  BAM  4 results

Êxodo 20:13
  Não matarás.

Êxodo 23:7
  Guarda-te de questões falsas; e o inocente e o justo não matarás, porque não justificarei o ímpio.

showing the first 2; use -n <count> for more
```

Matching is forgiving:

- Case, accents, and punctuation are ignored, so `nao mataras` finds `Não matarás`.
- Word order does not matter.
- Words match by prefix from four letters on, so `matar` finds `matarás`.
- Small typos are tolerated: one edit for words of 4 to 7 letters, two edits for longer words, including swapped letters.

Only verses containing every word of the query are listed. If no verse contains them all, the closest partial matches are shown and the header says so.

Results are ranked by relevance: the exact phrase first, then words adjacent and in order, then in order, then the rest. Ties go to the shorter verse.

Each result shows the reference in bold, the verse indented below it, and the matched words highlighted when color is enabled. By default at most 10 results are printed; raise it with `-n`.

Unquoted words after `-s` are joined into the query, so `bt -s não matarás` works too. A search with no matches exits with code `1`.

### Options

| Option                   | Description                                   |
| ------------------------ | --------------------------------------------- |
| `-t, --translation <id>` | Select a translation (default: `$BT_TRANSLATION` or `kjv`) |
| `-s, --search <query>`   | Search verses for words or a phrase           |
| `-n, --limit <count>`    | Maximum number of search results (default: 10) |
| `-l, --list`             | List available translations and books         |
| `--no-color`             | Disable colored output                        |
| `-h, --help`             | Display help                                  |
| `-V, --version`          | Display version                               |

### Environment variables

| Variable         | Description                                 |
| ---------------- | ------------------------------------------- |
| `BT_TRANSLATION` | Default translation ID (fallback: `kjv`)    |
| `BT_DATA_DIR`    | Directory containing translation data files |
| `NO_COLOR`       | Disable colored output                      |
| `FORCE_COLOR`    | Force colored output                        |

Color is automatically enabled when writing to a TTY, unless overridden by the environment variables or `--no-color`.

Output can be safely piped to other commands.

```sh
bt psa 119 | head
```

### Exit codes

| Code | Description                          |
| ---- | ------------------------------------ |
| `0`  | Success                              |
| `1`  | Lookup error (including no search matches) |
| `2`  | Usage error                          |

## Translations

Berean supports multiple Bible translations, stored as independent JSON files.

Current translations:

| ID    | Translation            |
| ----- | ---------------------- |
| `acf` | Almeida Corrigida Fiel |
| `bam` | Bíblia Ave Maria       |
| `kjv` | King James Version     |

List available translations at any time:

```sh
bt -l
```

Select a translation using `-t` or `--translation`:

```sh
bt -t acf jo 3 16
```

### Default translation

Without `-t`, Berean reads from the translation named in `BT_TRANSLATION`, falling back to `kjv` when it is unset. To make it permanent, export it from your shell configuration:

```sh
# ~/.zshrc
export BT_TRANSLATION=acf
```

The `-t` option always takes precedence over the variable.

### Data format

Translation files are stored in `data/` and follow this structure:

```text
data/
├── bible-acf.json
├── bible-bam.json
└── bible-kjv.json
```

Each file contains a collection of books, chapters, and verses.

```json
{
  "books": [
    {
      "id": "psa",
      "abbrev": "psa",
      "name": "Psalms",
      "aliases": ["ps", "psalm"],
      "chapters": [
        {
          "chapter": 23,
          "verses": [
            {
              "verse": 1,
              "text": "The LORD is my shepherd; I shall not want."
            }
          ]
        }
      ]
    }
  ]
}
```

To add a translation, place a properly formatted `bible-<id>.json` file in `data/` and select it using its ID.

An alternative data directory can be specified through `BT_DATA_DIR`.

## Development

```sh
npm test
```

Tests run against a small fixture in `test/fixtures`. The data test suite also validates all translation files in `data/`, checking their structure, ordering, and book ID and abbreviation collisions.

### Project structure

```text
berean/
├── bin/
│   └── bt.js
├── data/
├── raw/
├── scripts/
├── src/
├── test/
├── package.json
└── README.md
```

- `bin/`: CLI executable entry point.
- `src/`: Argument parsing, reference resolution, data loading, search, and rendering.
- `data/`: Normalized Bible translation files.
- `raw/`: Source translation data.
- `scripts/`: Data import and normalization utilities.
- `test/`: Automated tests and fixtures.

---

Berean is a lightweight, dependency-free command-line Bible reader.

Berean supports translations with different biblical canons, including the deuterocanonical books present in the Bíblia Ave Maria.