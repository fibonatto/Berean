import { UsageError } from "./errors.js";

export const DEFAULT_TRANSLATION = "kjv";
export const DEFAULT_LIMIT = 10;

function requireValue(option, value) {
  if (!value) throw new UsageError(`option ${option} requires a value`);
  return value;
}

function parseLimit(option, value) {
  const limit = Number(requireValue(option, value));
  if (!Number.isInteger(limit) || limit < 1) {
    throw new UsageError(`option ${option} requires a positive integer`);
  }
  return limit;
}

export function parseArgs(argv) {
  const opts = {
    help: false,
    version: false,
    list: false,
    color: null,
    translation: DEFAULT_TRANSLATION,
    search: null,
    limit: DEFAULT_LIMIT,
    positional: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      opts.help = true;
    } else if (arg === "-V" || arg === "--version") {
      opts.version = true;
    } else if (arg === "-l" || arg === "--list") {
      opts.list = true;
    } else if (arg === "--no-color") {
      opts.color = false;
    } else if (arg === "-t" || arg === "--translation") {
      const value = argv[++i];
      if (!value) throw new UsageError(`option ${arg} requires a value`);
      opts.translation = value;
    } else if (arg.startsWith("--translation=")) {
      opts.translation = arg.slice("--translation=".length);
    } else if (arg === "-s" || arg === "--search") {
      opts.search = requireValue(arg, argv[++i]);
    } else if (arg.startsWith("--search=")) {
      opts.search = requireValue("--search", arg.slice("--search=".length));
    } else if (arg === "-n" || arg === "--limit") {
      opts.limit = parseLimit(arg, argv[++i]);
    } else if (arg.startsWith("--limit=")) {
      opts.limit = parseLimit("--limit", arg.slice("--limit=".length));
    } else if (arg.startsWith("-")) {
      throw new UsageError(`unknown option: ${arg}`);
    } else {
      opts.positional.push(arg);
    }
  }

  return opts;
}
