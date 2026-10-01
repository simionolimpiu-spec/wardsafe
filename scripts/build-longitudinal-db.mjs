#!/usr/bin/env node
// CLI-only generator/materialiser for the longitudinal journey engine
// (src/domain/longitudinalJourney.js) onto the journey_episodes /
// longitudinal_observations schema (database/schema.sql).
// SIMULATION-ONLY: every trust-network patient is fictional.
// Kept CLI-only (no test imports this) and dependency-free — no node:sqlite,
// so it can never break the Vitest/jsdom module graph (see SF-216 lesson).
//
// Usage:
//   node scripts/build-longitudinal-db.mjs [--through-day=60] [--out=data/exports/longitudinal]
//
// Streams rows to disk (fs.createWriteStream) rather than building one giant
// string, so it stays memory-safe at the full 1300-day scale (~380k
// patient-days / ~2.3M observation rows across 293 patients). Large output
// is intentionally NOT committed to the repo — see data/exports/longitudinal/README.md
// and .gitignore. Only a small default run (--through-day=60) is checked in
// as a reviewable sample.

import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEpisodes } from '../src/domain/longitudinalJourney.js';
import {
  JOURNEY_EPISODE_CSV_HEADERS,
  LONGITUDINAL_OBSERVATION_CSV_HEADERS,
  mapDayToObservationRows,
  mapEpisodeToRow,
  rowToCsvLine
} from '../src/domain/longitudinalMaterialization.js';
import { trustNetwork } from '../src/data/trustNetwork/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const throughDay = Number(args['through-day'] ?? 60);
const outDir = resolve(here, '..', args.out ?? 'data/exports/longitudinal');

if (!Number.isFinite(throughDay) || throughDay < 1) {
  console.error('Invalid --through-day (must be a positive integer)');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const patientIds = trustNetwork.patients.map((patient) => patient.id);
const episodesPath = resolve(outDir, 'journey_episodes.csv');
const observationsPath = resolve(outDir, 'longitudinal_observations.csv');

const episodesStream = createWriteStream(episodesPath, { encoding: 'utf8' });
const observationsStream = createWriteStream(observationsPath, { encoding: 'utf8' });
episodesStream.write(JOURNEY_EPISODE_CSV_HEADERS.join(',') + '\n');
observationsStream.write(LONGITUDINAL_OBSERVATION_CSV_HEADERS.join(',') + '\n');

const startedAt = process.hrtime.bigint();
let episodeCount = 0;
let observationCount = 0;

for (const patientId of patientIds) {
  const episodes = buildEpisodes(patientId, throughDay);
  for (const episode of episodes) {
    episodesStream.write(rowToCsvLine(mapEpisodeToRow(episode, patientId), JOURNEY_EPISODE_CSV_HEADERS) + '\n');
    episodeCount += 1;
  }

  for (let day = 1; day <= throughDay; day += 1) {
    const observationRows = mapDayToObservationRows(patientId, day);
    for (const row of observationRows) {
      observationsStream.write(rowToCsvLine(row, LONGITUDINAL_OBSERVATION_CSV_HEADERS) + '\n');
      observationCount += 1;
    }
  }
}

await Promise.all([closeStream(episodesStream), closeStream(observationsStream)]);

const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
const manifest = {
  generatedLabel: `Longitudinal materialisation - simulation-only - ${new Date().toISOString()}`,
  boundaryNote: 'Fictional patients only. Simulation-only; not a live clinical or cross-trust record. Human review required.',
  throughDay,
  patientCount: patientIds.length,
  patientDayCount: patientIds.length * throughDay,
  episodeCount,
  observationCount,
  elapsedMs: Math.round(elapsedMs),
  rowsPerSecond: Math.round((episodeCount + observationCount) / (elapsedMs / 1000)),
  tables: ['journey_episodes', 'longitudinal_observations'],
  note: 'Timing measures deterministic generation + CSV serialisation only (no live Postgres instance available in this environment). The schema is designed for indexed (patient_id, day_number) range queries; live query-latency proof is deferred to a provisioned database under the existing deployment-approval gate (SAFEFLOW_DEPLOYMENT_APPROVED / R-003).'
};
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('Wrote longitudinal materialisation to', outDir);
console.log('Counts:', JSON.stringify({ episodeCount, observationCount, patientDayCount: manifest.patientDayCount }));
console.log(`Elapsed: ${manifest.elapsedMs}ms (${manifest.rowsPerSecond} rows/sec)`);

function closeStream(stream) {
  return new Promise((res, rej) => {
    stream.end((error) => (error ? rej(error) : res()));
  });
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) parsed[match[1]] = match[2];
  }
  return parsed;
}
