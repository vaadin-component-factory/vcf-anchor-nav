/**
 * Releases a new version: rewrites the version baked into the component,
 * commits, tags via `npm version`, pushes and publishes.
 *
 *   npm run release 4.0.2
 *   node util/publish.js 4.0.2
 *
 * This package is `"type": "module"`, so the script is ESM and uses only Node
 * builtins. It replaces `@vaadin-component-factory/vcf-element-util`, which was
 * reachable only through `require()` and which rewrote history with
 * `git reset HEAD~2` after the package had already gone out to both registries.
 *
 * Deliberately not wired up as an npm script named `publish`: npm runs a
 * `publish` lifecycle script after `npm publish` succeeds, so such a script
 * re-enters itself from inside its own `npm publish` call.
 *
 * The script refuses to run from a dirty tree or a non-default branch, and every
 * source rewrite is verified before anything is committed - a release must not
 * be able to reach `git push` or `npm publish` from a half-applied state.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readDeclaredVersions } from './versions.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_BRANCH = 'master';
const REGISTRIES = ['https://registry.npmjs.org/', 'https://npm.pkg.github.com/vaadin-component-factory'];

const fail = message => {
  console.error(`publish: ${message}`);
  process.exit(1);
};

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const run = (command, ...args) => {
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
};

const version = process.argv[2];

if (!version) {
  fail('missing version. Usage: npm run release <version>');
}

// Deliberately strict: release versions for this package are plain `x.y.z`.
if (!/^\d+\.\d+\.\d+$/u.test(version)) {
  fail(`"${version}" is not a semantic version such as 4.0.2.`);
}

if (git('status', '--porcelain') !== '') {
  fail('the working tree has uncommitted changes. Commit or stash them first.');
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== RELEASE_BRANCH) {
  fail(`on branch "${branch}", expected "${RELEASE_BRANCH}".`);
}

const declared = readDeclaredVersions(root);
if (declared.some(({ version: current }) => current === version)) {
  fail(`version ${version} is already the declared version.`);
}

// `npm version` refuses to overwrite an existing tag. Checked up front so the
// release does not die between the version commit and the tag.
try {
  git('rev-parse', '-q', '--verify', `refs/tags/v${version}`);
  fail(`tag v${version} already exists.`);
} catch (error) {
  // A numeric exit status means git ran and found no such tag, which is what a
  // release needs. Anything else (git missing, for instance) is a real error.
  if (typeof error.status !== 'number') {
    throw error;
  }
}

// Rewrite `static get version()` in every component, verifying each one.
for (const { file, version: current } of declared) {
  const path = resolve(root, file);
  const source = readFileSync(path, 'utf8');
  const updated = source.replace(/(get version\(\)\s*\{\s*return\s*')(\d+\.\d+\.\d+)(';)/u, `$1${version}$3`);

  if (updated === source) {
    fail(`could not rewrite the version in ${file} (found "${current}").`);
  }

  writeFileSync(path, updated);
  console.log(`publish: ${file}: ${current} -> ${version}`);
}

const rewritten = readDeclaredVersions(root);
const stale = rewritten.filter(({ version: current }) => current !== version);
if (stale.length > 0) {
  fail(`these files still declare the old version: ${stale.map(({ file }) => file).join(', ')}`);
}

/**
 * Runs a release step, reporting what state the repository is left in when the
 * command fails, so that a failure halfway through does not leave the operator
 * guessing what still has to be undone or retried by hand.
 */
const step = (action, onFailure) => {
  try {
    action();
  } catch (error) {
    if (typeof error.status !== 'number') {
      throw error;
    }
    fail(onFailure);
  }
};

step(
  () => run('git', 'commit', '-a', '-m', `build: update component version to ${version}`),
  'the version commit failed. The rewritten sources are still in the working tree.'
);
// `npm version` bumps package.json, commits and tags.
step(
  () => run('npm', 'version', version),
  `"npm version ${version}" failed. The version commit is in place, but nothing is tagged, pushed or published.`
);
step(
  () => run('git', 'push', '--follow-tags'),
  `the push failed. ${version} is committed and tagged locally and nothing is published: fix the push, run "git push --follow-tags", then publish by hand.`
);

// npmjs first: it is the registry consumers install from. If a later registry
// rejects the publish, say which ones already have the version so that the
// retry does not start from scratch.
const published = [];
for (const registry of REGISTRIES) {
  try {
    run('npm', 'publish', '--access', 'public', '--registry', registry);
    published.push(registry);
  } catch (error) {
    if (typeof error.status !== 'number') {
      throw error;
    }
    console.error(`publish: publishing to ${registry} failed.`);
    if (published.length > 0) {
      console.error(`publish: ${version} is already published to ${published.join(', ')} - do not re-run this script.`);
      console.error(`publish: retry the rest with "npm publish --access public --registry ${registry}".`);
    }
    process.exit(1);
  }
}

console.log(`publish: released ${version} to ${published.join(', ')}.`);
