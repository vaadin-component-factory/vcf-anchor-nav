/**
 * Every source file that hardcodes the package version in `static get version()`.
 * Shared by `publish.js`, which rewrites them, and `check-versions.js`, which
 * asserts they still match package.json.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const VERSION_SOURCES = ['src/vcf-anchor-nav.js'];

/**
 * Reads the version each component declares.
 *
 * @param {string} root repository root
 * @returns {{ file: string, version: string | null }[]}
 */
export function readDeclaredVersions(root) {
  return VERSION_SOURCES.map(file => {
    const source = readFileSync(resolve(root, file), 'utf8');
    const match = /get version\(\)\s*\{\s*return\s*'(\d+\.\d+\.\d+)';/u.exec(source);
    return { file, version: match ? match[1] : null };
  });
}

/**
 * @param {string} root repository root
 * @returns {string} the version in package.json
 */
export function readPackageVersion(root) {
  return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
}
