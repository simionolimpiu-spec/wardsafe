#!/usr/bin/env node
/**
 * SafeFlow evidence corpus — consolidation (SF-283b).
 *
 * Merges every wave-*.json (and seed-wave1.json) record file in
 * scripts/evidence/ into one deduplicated corpus file, and merges every
 * *-excluded.json into one exclusion log. Records are deduplicated by pmid
 * (first occurrence wins); duplicate count is reported, not silently
 * dropped.
 *
 * This script is meant to be re-run every time a new ingestion wave is
 * added — it is not a one-off. It only reads/writes the already licence-safe
 * wave files produced by extract-records.mjs; it never touches PubMed or
 * abstracts itself.
 *
 * Usage:
 *   node scripts/evidence/consolidate.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));

function waveFiles(suffix) {
  return readdirSync(DIR)
    .filter((f) => (f.startsWith('seed-wave') || f.startsWith('wave')) && f.endsWith(suffix))
    .sort();
}

function loadAll(files) {
  return files.flatMap((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));
}

function main() {
  // SF-287: wave3-manual-exclusions.json (pmid/title/reason triples logged during
  // manual screening, not licence-safe extract-records.mjs output) was slipping
  // through this filter and being loaded as if it were record data, because it
  // ends in "...exclusions.json" rather than the "-excluded.json" suffix this
  // filter checked for - it doesn't end in "-excluded.json" so `!f.endsWith(...)`
  // was true and it got treated as a record file. Caught by an unexplained jump
  // from 109 to 140 records (should have been 127) when wave 4 was consolidated.
  // Fixed by excluding any file with "exclu" in the name, not just the one exact
  // suffix, so this class of collision can't recur under a different filename.
  const recordFiles = waveFiles('.json').filter((f) => !f.toLowerCase().includes('exclu'));
  const excludedFiles = waveFiles('-excluded.json');

  const allRecords = loadAll(recordFiles);
  const allExcluded = loadAll(excludedFiles);

  const byPmid = new Map();
  let duplicates = 0;
  for (const r of allRecords) {
    if (byPmid.has(r.pmid)) {
      duplicates += 1;
    } else {
      byPmid.set(r.pmid, r);
    }
  }
  const records = [...byPmid.values()].sort((a, b) => (a.pmid < b.pmid ? -1 : 1));

  const outPath = join(DIR, 'evidence-corpus.json');
  const excludedOutPath = join(DIR, 'evidence-corpus-excluded.json');
  writeFileSync(outPath, JSON.stringify(records, null, 2));
  writeFileSync(excludedOutPath, JSON.stringify(allExcluded, null, 2));

  const withYear = records.filter((r) => r.year).length;
  console.log(`sources: ${recordFiles.join(', ')}`);
  console.log(`consolidated ${records.length} unique records (${duplicates} duplicates collapsed) -> ${outPath}`);
  console.log(`year present: ${withYear}/${records.length}`);
  console.log(`excluded log: ${allExcluded.length} entries -> ${excludedOutPath}`);
}

main();
