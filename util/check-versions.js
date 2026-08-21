/**
 * Fails when a component's `static get version()` has drifted from the version
 * in package.json. Runs as part of `npm run lint`, so the drift cannot reach a
 * release unnoticed.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readDeclaredVersions, readPackageVersion } from './versions.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expected = readPackageVersion(root);
const declared = readDeclaredVersions(root);

const mismatched = declared.filter(({ version }) => version !== expected);

if (mismatched.length > 0) {
  console.error(`check-versions: package.json declares ${expected}, but:`);
  for (const { file, version } of mismatched) {
    console.error(`  ${file} declares ${version ?? 'no version at all'}`);
  }
  console.error('Run "npm run release <version>" to release, or fix the sources by hand.');
  process.exit(1);
}

console.log(`check-versions: all ${declared.length} source(s) declare ${expected}.`);
