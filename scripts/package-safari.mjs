import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const artifactsDir = join(root, 'artifacts');
const manifestPath = join(distDir, 'manifest.json');

if (!existsSync(manifestPath)) {
  console.error('No dist/manifest.json found. Run `npm run build` first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const requiredFiles = new Set(['manifest.json']);

if (manifest.background?.service_worker) {
  requiredFiles.add(manifest.background.service_worker);
}

for (const script of manifest.content_scripts ?? []) {
  for (const file of script.js ?? []) requiredFiles.add(file);
}

for (const file of Object.values(manifest.icons ?? {})) {
  requiredFiles.add(file);
}

const missing = [...requiredFiles].filter((file) => !existsSync(join(distDir, file)));
if (missing.length > 0) {
  console.error(`The Safari package is incomplete. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

const slug = (manifest.name ?? 'browser-extension')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const outputPath = join(artifactsDir, `${slug}-${manifest.version}-safari.zip`);

mkdirSync(artifactsDir, { recursive: true });
rmSync(outputPath, { force: true });

execFileSync(
  '/usr/bin/zip',
  ['-r', '-X', '-q', outputPath, '.', '-x', '*.DS_Store'],
  { cwd: distDir, stdio: 'inherit' },
);

const size = statSync(outputPath).size;
console.log(`Safari extension package: ${outputPath}`);
console.log(`Size: ${(size / 1024).toFixed(1)} KB`);
console.log('');
console.log('Install for local testing:');
console.log('  1. Safari > Settings > Advanced > Show features for web developers');
console.log('  2. Developer > Allow unsigned extensions');
console.log(
  '  3. Developer > Add Temporary Extension... and select the zip (or the dist folder)',
);
console.log('  4. Extensions > enable the extension');
