#!/usr/bin/env node
/**
 * SafeFlow evidence corpus — licence-safe record extractor (SF-283/SF-283b).
 *
 * Takes a raw PubMed metadata payload and strips it to ONLY the fields this
 * project is entitled to store and redistribute:
 *
 *   pmid, doi, title, journal, authors (surnames), meshTerms, articleTypes,
 *   language
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
 * QUALITY FILTER (SF-283b): two exclusion classes, found while processing the
 * first ingestion wave, both DOCUMENTED not silently dropped —
 *   - EXCLUDED_ARTICLE_TYPES: secondary/non-primary content (conference
 *     proceedings, editorials, comments, news, retractions). Example: PMID
 *     27885969, a congress-proceedings collection bundling dozens of
 *     abstracts, matched three separate searches and would have polluted the
 *     corpus with non-attributable secondary material.
 *   - non-English records (article.language !== 'eng'): SafeFlow's own
 *     summaries must be written in the summariser's own words from material
 *     they can actually read; translating a non-English abstract and then
 *     summarising the translation adds a mistranslation-risk step this
 *     project has not signed up to. Excluded, not translated.
 * Excluded records are returned separately (with pmid + reason) rather than
 * discarded, so a human can review the exclusion list later.
 *
 * NOTE ON YEAR: some PubMed metadata records carry a publication_date.year
 * field and some do not (observed inconsistently across records in this
 * project's PubMed tool — older records are more likely to lack it). Where
 * present it is used directly; where absent, year is emitted as null and
 * filled by the separate enrich-years.mjs step (Crossref, keyed by DOI).
 * Never guessed.
 *
 * Usage:
 *   node scripts/evidence/extract-records.mjs <raw.json> [--out <file>] [--excluded-out <file>]
 */

import { readFileSync, writeFileSync } from 'node:fs';

const ALLOWED = new Set([
  'pmid', 'doi', 'title', 'journal', 'journalAbbrev', 'year',
  'authors', 'meshTerms', 'articleTypes', 'language'
]);

const FORBIDDEN = ['abstract', 'abstractText', 'fullText', 'body', 'summaryText'];

const EXCLUDED_ARTICLE_TYPES = new Set([
  'Conference Proceedings',
  'Comment',
  'Editorial',
  'News',
  'Newspaper Article',
  'Retracted Publication',
  'Retraction of Publication'
]);

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function yearFromPayload(article) {
  const y = article.publication_date && article.publication_date.year;
  const n = typeof y === 'string' ? parseInt(y, 10) : y;
  return Number.isInteger(n) ? n : null;
}

export function extractRecord(article) {
  const ids = article.identifiers || {};
  const journal = article.journal || {};
  return {
    pmid: str(ids.pmid || article.pmid) || null,
    doi: str(article.doi || ids.doi) || null,
    title: str(article.title) || null,
    journal: str(journal.title) || null,
    journalAbbrev: str(journal.iso_abbreviation) || null,
    year: yearFromPayload(article), // present on some records; null falls back to enrich-years.mjs
    authors: (article.authors || [])
      .map((a) => str(a && a.last_name))
      .filter(Boolean)
      .slice(0, 8),
    meshTerms: (article.mesh_terms || []).filter((t) => typeof t === 'string').slice(0, 25),
    articleTypes: (article.article_types || []).filter((t) => typeof t === 'string'),
    language: str(article.language) || null
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

/** Returns an exclusion reason string, or null if the record should be kept. */
export function exclusionReason(record) {
  const badType = (record.articleTypes || []).find((t) => EXCLUDED_ARTICLE_TYPES.has(t));
  if (badType) return `article type "${badType}" is secondary/non-primary content`;
  if (record.language && record.language !== 'eng') return `non-English (language="${record.language}")`;
  return null;
}

export function extractAll(parsed) {
  const articles = parsed.articles || parsed.results || (Array.isArray(parsed) ? parsed : []);
  const allRecords = articles.map(extractRecord).filter((r) => r.pmid && r.title);
  allRecords.forEach(assertLicenceSafe);

  const records = [];
  const excluded = [];
  for (const r of allRecords) {
    const reason = exclusionReason(r);
    if (reason) {
      excluded.push({ pmid: r.pmid, title: r.title, reason });
    } else {
      records.push(r);
    }
  }
  return { records, excluded, seen: articles.length };
}

function main() {
  const [input, ...rest] = process.argv.slice(2);
  if (!input) {
    console.error('usage: extract-records.mjs <raw.json> [--out <file>] [--excluded-out <file>]');
    process.exit(1);
  }
  const outIdx = rest.indexOf('--out');
  const out = outIdx >= 0 ? rest[outIdx + 1] : null;
  const exOutIdx = rest.indexOf('--excluded-out');
  const exOut = exOutIdx >= 0 ? rest[exOutIdx + 1] : null;

  const { records, excluded, seen } = extractAll(JSON.parse(readFileSync(input, 'utf8')));
  const payload = JSON.stringify(records, null, 2);

  if (out) {
    writeFileSync(out, payload);
    console.log(`extracted ${records.length}/${seen} licence-safe records -> ${out} (${excluded.length} excluded)`);
  } else {
    console.log(payload);
  }

  if (exOut) {
    writeFileSync(exOut, JSON.stringify(excluded, null, 2));
  } else if (excluded.length) {
    console.log('excluded:', JSON.stringify(excluded, null, 2));
  }
}

if (process.argv[1] && process.argv[1].endsWith('extract-records.mjs')) main();
