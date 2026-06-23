#!/usr/bin/env node

const fs = require('fs');

const files = [
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
];

const violations = [];

const patterns = [
  'link:',
  'file:',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/(link:)/);

  if (matches?.length) {
    violations.push({ file, matches });
  }
}

if (violations.length) {
  console.error('\nLocal VueLibrary must be unlinked before committing. Please use \'pnpm unlink\' and/or unlink manually and check:\n');
  for (const f of files) console.error(' - ' + f);
  console.error('');
  process.exit(1);
}
process.exit(0);