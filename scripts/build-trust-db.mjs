#!/usr/bin/env node
// CLI-only generator for the two-trust simulation patient database.
// Writes CSV tables + a JSON manifest to data/exports/two-trust/.
// SIMULATION-ONLY: real trust/ward names, fictional patients and journeys.
// Kept CLI-only (no test imports this) and dependency-free — no node:sqlite,
// so it can never break the Vitest/jsdom module graph (see SF-216 lesson).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTrustNetworkExport } from '../src/data/trustNetwork/index.js';
import { renderTrustNetworkArtifacts } from '../src/data/trustNetwork/trustNetworkArtifacts.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'data', 'exports', 'two-trust');
mkdirSync(outDir, { recursive: true });

const model = buildTrustNetworkExport();
if (!model.integrity.ok) {
  console.error('FK integrity failed:', model.integrity.violations);
  process.exit(1);
}

const artifacts = renderTrustNetworkArtifacts(model);
for (const [name, csv] of Object.entries(artifacts.csv)) {
  writeFileSync(resolve(outDir, `${name}.csv`), csv + '\n', 'utf8');
}

const manifest = {
  generatedLabel: model.generatedLabel,
  boundaryNote: model.boundaryNote,
  counts: model.counts,
  integrity: model.integrity,
  tables: Object.keys(artifacts.csv)
};
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('Wrote two-trust simulation database to', outDir);
console.log('Counts:', JSON.stringify(model.counts));
console.log('Integrity OK:', model.integrity.ok);
