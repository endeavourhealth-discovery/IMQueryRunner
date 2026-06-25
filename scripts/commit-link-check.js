#!/usr/bin/env node

import fs from "node:fs";

const files = ["package.json", "pnpm-lock.yaml"];

let foundMatch = false;

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, { encoding: "utf8" });

  if (/["@]endeavour\/vue-library"\s*:\s*"?(?:file|link):/.test(content)) {
    foundMatch = true;
    break;
  }
}

if (foundMatch) {
  console.error(
    "\nLocal VueLibrary must be unlinked before committing.\nPlease use 'pnpm unlink' and/or make sure link: or file: overrides are removed from package.json before running 'pnpm install'.\n"
  );
  process.exit(1);
}

process.exit(0);
