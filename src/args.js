import { UsageError } from "./errors.js";

export const DEFAULT_TRANSLATION = "kjv";

export function parseArgs(argv) {
  const opts = {
    help: false,
    version: false,
    list: false,
    color: null,
    translation: DEFAULT_TRANSLATION,
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
    } else if (arg.startsWith("-")) {
      throw new UsageError(`unknown option: ${arg}`);
    } else {
      opts.positional.push(arg);
    }
  }

  return opts;
}
