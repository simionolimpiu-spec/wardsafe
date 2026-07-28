#!/usr/bin/env node
/**
 * SafeFlow evidence corpus — licence-safe record extractor (SF-283).
 *
 * Takes a raw PubMed metadata payload and strips it to ONLY the fields this
 * project is entitled to store and redistribute:
 *
 *   pmid, doi, title, journal, authors (surnames), meshTerms, articleTypes
 *
 * It deliberately DISCARDS abstracts. Abstracts are publisher copyright in the
 * general case — records sampled while designing this pipeline carried "All
 * rights reserved. Not to be copied, transmitted or recorded in any way, in
 * whole or part" (RCN Publishing) and "No commercial re-use" (BMJ). Storing
 * them at scale in this repo would be a real licensing problem, so the pipeline
 * drops them at the earliest possible point rather than relying on anyone
 * remembering to.
 *
 * Bibliographic metadata are facts, cited rather than reproduced. MeSH terms
 * are produced by the US National Library of Medicine.
 *
 * NOTE ON YEAR: this PubMed metadata payload does not carry a publication year
 * field. Year is therefore emitted as null and must be filled by a separate
 * enrichment step. It is left null rather than guessed.
 *
 * Usage:
 *   node scripts/evidence/extract-records.mjs <raw.json> [--out <file>]
 */

import { readFileSync, writeFileSync } from 'node:fs';

const ALLOWED = new Set([
  'pmid', 'doi', 'title', 'journal', 'journalAbbrev', 'year',
  'authors', 'meshTerms', 'articleTypes'
]);

const FORBIDDEN = ['abstract', 'abstractText', 'fullText', 'body', 'summaryText'];

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function extractRecord(article) {
  const ids = article.identifiers || {};
  const journal = article.journal || {};
  return {
    pmid: str(ids.pmid || article.pmid) || null,
    doi: str(article.doi || ids.doi) || null,
    title: str(article.title) || null,
    journal: str(journal.title) || null,
    journalAbbrev: str(journal.iso_abbreviation) || null,
    year: null, // not in payload; enriched separately, never guessed
    authors: (article.authors || [])
      .map((a) => str(a && a.last_name))
      .filter(Boolean)
      .slice(0, 8),
    meshTerms: (article.mesh_terms || []).filter((t) => typeof t === 'string').slice(0, 25),
    articleTypes: (article.article_types || []).filter((t) => typeof t === 'string')
  };
}

/** Throws if a record carries any field we are not licensed to store. */
export function assertLicenceSafe(record) {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN.includes(key) || !ALLOWED.has(key)) {
      throw new Error(`Record ${record.pmid}: field "${key}" is not licence-safe to store.`);
    }
  }
  return true;
}

export function extractAll(parsed) {
  const articles = parsed.articles || parsed.results || (Array.isArray(parsed) ? parsed : []);
  const records = articles.map(extractRecord).filter((r) => r.pmid && r.title);
  records.forEach(assertLicenceSafe);
  return { records, seen: articles.length };
}

function main() {
  const [input, ...rest] = process.argv.slice(2);
  if (!input) {
    console.error('usage: extract-records.mjs <raw.json> [--out <file>]');
    process.exit(1);
  }
  const outIdx = rest.indexOf('--out');
  const out = outIdx >= 0 ? rest[outIdx + 1] : null;

  const { records, seen } = extractAll(JSON.parse(readFileSync(input, 'utf8')));
  const payload = JSON.stringify(records, null, 2);

  if (out) {
    writeFileSync(out, payload);
    console.log(`extracted ${records.length}/${seen} licence-safe records -> ${out}`);
  } else {
    console.log(payload);
  }
}

if (process.argv[1] && process.argv[1].endsWith('extract-records.mjs')) main();
