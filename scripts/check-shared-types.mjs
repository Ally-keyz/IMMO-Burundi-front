/**
 * shared-types drift check.
 *
 * `@immo/shared-types` is vendored into this repo (and into the server repo)
 * because each app is published as its own repository. Two copies means two
 * places to forget an edit, so this compares the vendored source against the
 * authoritative copy and fails if they differ.
 *
 * The authority is the SERVER repo, since the role/permission matrix and
 * every Mongoose enum are defined there and must match the database.
 *
 *   node scripts/check-shared-types.mjs
 *
 * Override the location with SHARED_TYPES_REF=/path/to/other/repo.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const DEFAULT_REF = '..\\IMMO-Burundi-Server';
const refRoot = path.resolve(repoRoot, process.env.SHARED_TYPES_REF || DEFAULT_REF);
const refPkg = path.join(refRoot, 'packages', 'shared-types', 'src');
const localPkg = path.join(repoRoot, 'packages', 'shared-types', 'src');

/** Source files that define the domain contract. */
const TRACKED = ['enums.ts', 'permissions.ts', 'roleMatrix.ts', 'dto.ts', 'dashboard.ts', 'index.ts'];

if (!fs.existsSync(refPkg)) {
  console.error(
    `[shared-types] Reference copy not found at ${refPkg}\n` +
      `  Set SHARED_TYPES_REF to the repo that owns the authoritative copy, e.g.\n` +
      `  SHARED_TYPES_REF=..\\IMMO-Burundi-Server node scripts/check-shared-types.mjs\n` +
      '  In CI, check out the server repo alongside this one.',
  );
  process.exit(2);
}

const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);

const drifted = [];
const missing = [];

for (const name of TRACKED) {
  const refFile = path.join(refPkg, name);
  const localFile = path.join(localPkg, name);
  if (!fs.existsSync(refFile)) continue;
  if (!fs.existsSync(localFile)) {
    missing.push(name);
    continue;
  }
  const a = hash(refFile);
  const b = hash(localFile);
  if (a !== b) drifted.push({ name, ref: a, local: b });
}

if (drifted.length === 0 && missing.length === 0) {
  console.log(`[shared-types] OK — ${TRACKED.length} files match ${path.relative(repoRoot, refPkg)}`);
  process.exit(0);
}

console.error('[shared-types] DRIFT DETECTED against ' + refPkg);
for (const f of missing) console.error(`  missing locally: ${f}`);
for (const d of drifted) console.error(`  differs: ${d.name}  ref=${d.ref} local=${d.local}`);
console.error(
  '\n  Copy packages/shared-types/src from the authoritative repo and rebuild:\n' +
    '  pnpm --filter @immo/shared-types build',
);
process.exit(1);
