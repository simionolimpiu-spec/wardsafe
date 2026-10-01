#!/usr/bin/env node
/**
 * SafeFlow evidence corpus — publish step (SF-284).
 *
 * Merges the pipeline-owned bibliographic corpus (evidence-corpus.json,
 * produced by consolidate.mjs from raw ingestion waves) with the
 * separately-maintained curation file (curation.json: cueTypes,
 * verification, safeflowSummary, keyed by pmid) and writes the result to
 * src/data/evidenceCorpus.json, where the app actually imports it from.
 *
 * Curation is kept in its own file rather than written into
 * evidence-corpus.json directly so that re-running consolidate.mjs after a
 * future ingestion wave can never silently wipe out curated cueTypes or
 * summaries - the two concerns (what a record IS bibliographically, vs
 * what SafeFlow has decided to say about it) are separate files that only
 * get merged here, at publish time.
 *
 * A record with no curation entry is published with cueTypes: [],
 * verification: 'metadata-only', safeflowSummary: null - present in the
 * corpus, not yet linked to any teaching cue. This is the honest default,
 * not an error.
 *
 * Usage: node scripts/evidence/publish.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(DIR, '..', '..');

const CORPUS_PATH = join(DIR, 'evidence-corpus.json');
const CURATION_PATH = join(DIR, 'curation.json');
const OUT_PATH = join(REPO_ROOT, 'src', 'data', 'evidenceCorpus.json');

function main() {
  const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
  const curation = existsSync(CURATION_PATH) ? JSON.parse(readFileSync(CURATION_PATH, 'utf8')) : {};

  let curated = 0;
  const published = corpus.map((record) => {
    const c = curation[record.pmid];
    if (c) curated += 1;
    return {
      ...record,
      cueTypes: c?.cueTypes ?? [],
      verification: c?.verification ?? 'metadata-only',
      safeflowSummary: c?.safeflowSummary ?? null
    };
  });

  writeFileSync(OUT_PATH, JSON.stringify(published, null, 2));
  console.log(`published ${published.length} records (${curated} with curation) -> ${OUT_PATH}`);
}

main();
