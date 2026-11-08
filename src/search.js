const WORD = /[\p{L}\p{N}]+/gu;

const EXACT = 3;
const PREFIX = 2;
const FUZZY = 1;
const WORD_WEIGHT = 10;

const MIN_PREFIX_LENGTH = 4;

const ORDERED_BONUS = 20;
const ADJACENT_BONUS = 50;
const PHRASE_BONUS = 100;

const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const tokenize = (s) => s.normalize("NFC").match(WORD)?.map(fold) ?? [];

const tolerance = (length) => (length >= 8 ? 2 : length >= 4 ? 1 : 0);

function within(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;

  let older = null;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
      if (older && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j], older[j - 2] + 1);
      }
    }
    older = previous;
    previous = row;
  }
  return previous[b.length] <= max;
}

function wordScore(token, word) {
  if (word === token) return EXACT;
  if (token.length >= MIN_PREFIX_LENGTH && word.startsWith(token)) return PREFIX;
  const max = tolerance(token.length);
  return max && within(token, word, max) ? FUZZY : 0;
}

function bestMatch(token, words, after) {
  let best = null;
  words.forEach((word, index) => {
    const score = wordScore(token, word.key);
    if (!score) return;
    const better =
      !best ||
      score > best.score ||
      (score === best.score && best.index <= after && index > after);
    if (better) best = { index, score };
  });
  return best;
}

function analyze(text) {
  const clean = text.normalize("NFC").replace(/\s+/g, " ").trim();
  const words = Array.from(clean.matchAll(WORD), (m) => ({
    key: fold(m[0]),
    start: m.index,
    end: m.index + m[0].length,
  }));
  return { clean, words };
}

function scoreVerse(tokens, phrase, { clean, words }) {
  const picks = [];
  let score = 0;
  let previous = -1;
  let ordered = true;
  let adjacent = true;

  for (const token of tokens) {
    const match = bestMatch(token, words, previous);
    if (!match) continue;
    if (picks.length) {
      if (match.index <= previous) ordered = false;
      if (match.index !== previous + 1) adjacent = false;
    }
    score += match.score * WORD_WEIGHT;
    previous = match.index;
    picks.push(words[match.index]);
  }
  if (!picks.length) return null;

  const matched = picks.length;
  if (matched === tokens.length && matched > 1) {
    if (ordered) score += ORDERED_BONUS;
    if (adjacent) score += ADJACENT_BONUS;
    if (` ${words.map((w) => w.key).join(" ")} `.includes(phrase)) score += PHRASE_BONUS;
  }

  const marks = [...new Map(picks.map((w) => [w.start, w])).values()].sort(
    (a, b) => a.start - b.start,
  );
  return { text: clean, marks, matched, score: score - words.length / 100 };
}

export function search(books, query, { limit = Infinity } = {}) {
  const tokens = tokenize(query);
  if (!tokens.length) return { total: 0, hits: [], partial: false };

  const phrase = ` ${tokens.join(" ")} `;
  const hits = [];
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const hit = scoreVerse(tokens, phrase, analyze(verse.text));
        if (hit) hits.push({ book, chapter: chapter.chapter, verse: verse.verse, ...hit });
      }
    }
  }

  const full = hits.filter((h) => h.matched === tokens.length);
  const partial = full.length === 0 && hits.length > 0;
  const pool = partial ? hits : full;
  pool.sort((a, b) => b.score - a.score);

  return { total: pool.length, hits: pool.slice(0, limit), partial };
}
