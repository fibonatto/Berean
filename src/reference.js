import { UsageError } from "./errors.js";

const PATTERN = /^(.+?)\s+(\d+)(?:[\s:]+(\d+)(?:-(\d+))?)?$/;

export function parseReference(text) {
  const match = PATTERN.exec(text.trim());
  if (!match) throw new UsageError(`invalid reference: ${text}`);

  const [, book, chapter, from, to] = match;
  const ref = { book, chapter: Number(chapter), from: null, to: null };

  if (from !== undefined) {
    ref.from = Number(from);
    ref.to = to !== undefined ? Number(to) : ref.from;
  }

  if (ref.chapter < 1) throw new UsageError("chapter must be 1 or greater");
  if (ref.from !== null && (ref.from < 1 || ref.to < ref.from)) {
    throw new UsageError(`invalid verse range: ${from}${to ? `-${to}` : ""}`);
  }

  return ref;
}
