#!/usr/bin/env node

const fs = require('fs');

const files = [
  'package.json',
  'pnpm-lock.yaml'
];

let matches = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  matches = content.match(/'@endeavour\/vue-library':\s*(?:file|link):/);
}

if (matches?.length) {
  console.error('\nLocal VueLibrary must be unlinked before committing.\nPlease use \'pnpm unlink\' and/or make sure link: or file: overrides are removed from package.json before running \'pnpm install\'.\n');
  process.exit(1);
}
process.exit(0);