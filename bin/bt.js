#!/usr/bin/env node
import { run } from "../src/cli.js";
import { CliError, UsageError } from "../src/errors.js";
import { USAGE } from "../src/help.js";

process.stdout.on("error", (err) => {
  if (err.code === "EPIPE") process.exit(0);
  throw err;
});

try {
  process.stdout.write(
    run(process.argv.slice(2), {
      isTTY: process.stdout.isTTY,
      columns: process.stdout.columns,
      env: process.env,
    }),
  );
} catch (err) {
  if (!(err instanceof CliError)) throw err;
  process.stderr.write(`bt: ${err.message}\n`);
  if (err instanceof UsageError) process.stderr.write(`${USAGE}\n`);
  process.exitCode = err.exitCode;
}
