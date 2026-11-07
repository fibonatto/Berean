import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./errors.js";

export const DEFAULT_DATA_DIR = fileURLToPath(new URL("../data/", import.meta.url));

const FILE_PATTERN = /^bible-(.+)\.json$/;

export function listTranslations(dir) {
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    throw new CliError(`cannot read data directory: ${dir}`);
  }
  return files
    .map((f) => FILE_PATTERN.exec(f)?.[1])
    .filter(Boolean)
    .sort();
}

export function loadBooks(dir, translation) {
  const available = listTranslations(dir);
  const id = available.find((t) => t.toLowerCase() === translation.toLowerCase());
  if (!id) {
    const list = available.join(", ") || "none";
    throw new CliError(`unknown translation: ${translation} (available: ${list})`);
  }

  const file = join(dir, `bible-${id}.json`);
  let data;
  try {
    const content = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    data = JSON.parse(content);
  } catch (err) {
    throw new CliError(`cannot load ${file}: ${err.message}`);
  }
  if (!Array.isArray(data?.books)) throw new CliError(`invalid data file: ${file}`);

  return { id, books: data.books };
}
