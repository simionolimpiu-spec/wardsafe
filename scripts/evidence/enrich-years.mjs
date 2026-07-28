#!/usr/bin/env node
/**
 * SafeFlow evidence corpus — year enrichment (SF-283b).
 *
 * extract-records.mjs emits year: null because the PubMed metadata payload
 * this project's PubMed tool exposes does not carry a publication-year field.
 * Year is never guessed. This script fills it in as a separate, auditable
 * step by looking the DOI up in Crossref (api.crossref.org) — a public,
 * unauthenticated, non-copyrighted bibliographic registry. Only the
 * publication year is read from the response; nothing else from Crossref is
 * stored.
 *
 * Records without a DOI, or whose DOI Crossref does not recognise, keep
 * year: null rather than receiving a guessed value.
 *
 * Usage:
 *   node scripts/evidence/enrich-years.mjs <records.json> [--out <file>]
 *
 * Polite-pool etiquette: one request at a time, short delay between requests,
 * identifying User-Agent with a contact mailto per Crossref's guidance.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const CROSSREF_BASE = 'https://api.crossref.org/works/';
const USER_AGENT = 'SafeFlow-evidence-corpus/0.1 (simulation-only teaching tool; mailto:simionolimpiu@gmail.com)';
const DELAY_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractYear(message) {
  const candidates = [
    message.published,
    message['published-print'],
    message['published-online'],
    message.issued
  ];
  for (const c of candidates) {
    const year = c && c['date-parts'] && c['date-parts'][0] && c['date-parts'][0][0];
    if (typeof year === 'number') return year;
  }
  return null;
}

async function lookupYear(doi) {
  try {
    const res = await fetch(CROSSREF_BASE + encodeURIComponent(doi), {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) return { year: null, status: res.status };
    const data = await res.json();
    return { year: extractYear(data.message || {}), status: res.status };
  } catch (err) {
    return { year: null, status: 'error', error: String(err) };
  }
}

export async function enrichYears(records, { onProgress } = {}) {
  const results = [];
  let filled = 0;
  let skippedNoDoi = 0;
  let notFound = 0;

  for (const record of records) {
    if (record.year) {
      results.push(record);
      continue;
    }
    if (!record.doi) {
      skippedNoDoi += 1;
      results.push(record);
      continue;
    }
    const { year, status } = await lookupYear(record.doi);
    if (year) {
      filled += 1;
      results.push({ ...record, year });
    } else {
      notFound += 1;
      results.push(record);
    }
    if (onProgress) onProgress({ pmid: record.pmid, doi: record.doi, year, status });
    await sleep(DELAY_MS);
  }

  return { records: results, filled, skippedNoDoi, notFound };
}

async function main() {
  const [input, ...rest] = process.argv.slice(2);
  if (!input) {
    console.error('usage: enrich-years.mjs <records.json> [--out <file>]');
    process.exit(1);
  }
  const outIdx = rest.indexOf('--out');
  const out = outIdx >= 0 ? rest[outIdx + 1] : input;

  const records = JSON.parse(readFileSync(input, 'utf8'));
  const { records: enriched, filled, skippedNoDoi, notFound } = await enrichYears(records, {
    onProgress: ({ pmid, year, status }) => console.error(`  ${pmid}: year=${year ?? 'null'} (crossref ${status})`)
  });

  writeFileSync(out, JSON.stringify(enriched, null, 2));
  console.log(`enriched ${filled} / ${records.length} (${skippedNoDoi} had no DOI, ${notFound} not found in Crossref) -> ${out}`);
}

if (process.argv[1] && process.argv[1].endsWith('enrich-years.mjs')) main();
