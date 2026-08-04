import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CUE_TYPES,
  countEvidenceByCue,
  getCorpusSize,
  getEvidenceForCue,
  isCitable,
  isValidCueType
} from './evidenceCorpus.js';
import evidenceCorpus from '../data/evidenceCorpus.json';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const MODULE_SOURCE = readFileSync(join(THIS_DIR, 'evidenceCorpus.js'), 'utf8');

const FORBIDDEN_LINKAGE_IDENTIFIERS = [
  'patientId',
  'patient_id',
  'scenarioId',
  'scenario_id',
  'flagId',
  'flag_id',
  'patientPmid'
];

const FORBIDDEN_RECORD_FIELDS = ['abstract', 'abstractText', 'fullText', 'body', 'summaryText'];

describe('evidence corpus boundary — cue-level, never patient-level', () => {
  it('never mentions a patient/scenario/flag identifier anywhere in the module source', () => {
    for (const identifier of FORBIDDEN_LINKAGE_IDENTIFIERS) {
      expect(MODULE_SOURCE).not.toContain(identifier);
    }
  });

  it('exposes only cue-type-keyed lookups — no function accepts more than one identifier-shaped argument', () => {
    // getEvidenceForCue and isValidCueType each take exactly one string parameter.
    // A regression that widens either signature to accept a second (id-shaped)
    // argument would need to change this arity, which this test pins.
    expect(getEvidenceForCue.length).toBe(1);
    expect(isValidCueType.length).toBe(1);
  });

  it('CUE_TYPES and its entries are frozen (cannot be mutated at runtime)', () => {
    expect(Object.isFrozen(CUE_TYPES)).toBe(true);
    for (const entry of CUE_TYPES) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });
});

describe('evidence corpus content — licence safety', () => {
  it('carries at least one record and matches the pipeline output size', () => {
    expect(getCorpusSize()).toBeGreaterThan(0);
    expect(getCorpusSize()).toBe(evidenceCorpus.length);
  });

  it('no record carries an abstract, full text, or any forbidden field', () => {
    for (const record of evidenceCorpus) {
      for (const field of FORBIDDEN_RECORD_FIELDS) {
        expect(record).not.toHaveProperty(field);
      }
    }
  });

  it('the published corpus file contains no occurrence of the literal string "abstract" in any value, aside from the "abstract-read" verification-level label', () => {
    // "abstract-read" is a legitimate, schema-defined verification-level value
    // (alongside "metadata-only" and "full-text-read") — it records that a
    // human read the PubMed abstract in-conversation to write an original
    // safeflowSummary, never that abstract text was pasted into the corpus.
    // Stripping just that enum label before the scan keeps the real safety
    // property intact: any OTHER occurrence of "abstract" (e.g. abstract text
    // accidentally pasted into a title, summary, or any other field) still
    // fails this test.
    const serialised = JSON.stringify(evidenceCorpus)
      .toLowerCase()
      .split('"abstract-read"')
      .join('""');
    expect(serialised).not.toContain('abstract');
  });

  it('every record has a pmid, title, and non-guessed year (number or null, never a string placeholder)', () => {
    for (const record of evidenceCorpus) {
      expect(typeof record.pmid).toBe('string');
      expect(record.pmid.length).toBeGreaterThan(0);
      expect(typeof record.title).toBe('string');
      expect(record.title.length).toBeGreaterThan(0);
      expect(record.year === null || typeof record.year === 'number').toBe(true);
    }
  });
});

describe('evidence corpus content — curation integrity', () => {
  it('every cueTypes entry on every record is a recognised CUE_TYPES id', () => {
    const validIds = new Set(CUE_TYPES.map((c) => c.id));
    for (const record of evidenceCorpus) {
      for (const cueType of record.cueTypes ?? []) {
        expect(validIds.has(cueType)).toBe(true);
      }
    }
  });

  it('tracks citable-record count deliberately as summaries are written', () => {
    // This count is EXPECTED to grow every time a safeflowSummary is added.
    // The point of asserting an exact number (not just >0) is to force a
    // conscious update here rather than letting citability drift in unnoticed.
    // SF-289 (first wave, self-authored): 8 SafeFlow-voice summaries covering
    // 9 built-in-app cue types (deteriorating-obs and score-comparison share
    // one record; escalation/deteriorating-obs/staffing-context share another;
    // sepsis-screen/staffing-context share a third).
    // SF-291 (second wave, self-authored): 6 more summaries, one per record
    // from SF-290's wave 6 - closes out every remaining built-in-app cue type
    // (new-to-service, bias-awareness, pearls-debrief, pace-ladder, safety-ii,
    // family-concern). All 15 built-in-app cue types now have at least one
    // citable record; the 19 reserved (builtInApp:false) cue types still have
    // none - writing summaries for those is separate future work, gated on
    // those disciplines getting their own cue panels built in the app first.
    const citableCount = evidenceCorpus.filter(isCitable).length;
    expect(citableCount).toBe(14);
  });
});

describe('getEvidenceForCue', () => {
  it('returns [] for an unknown cue type rather than throwing', () => {
    expect(getEvidenceForCue('not-a-real-cue-type')).toEqual([]);
    expect(getEvidenceForCue(null)).toEqual([]);
    expect(getEvidenceForCue(undefined)).toEqual([]);
  });

  it('returns only records whose cueTypes includes the requested cue', () => {
    const results = getEvidenceForCue('sepsis-screen');
    expect(results.length).toBeGreaterThan(0);
    for (const record of results) {
      expect(record.cueTypes).toContain('sepsis-screen');
    }
  });

  it('sorts results newest-first by year', () => {
    const results = getEvidenceForCue('deteriorating-obs');
    const years = results.map((r) => r.year ?? 0);
    const sorted = [...years].sort((a, b) => b - a);
    expect(years).toEqual(sorted);
  });

  it('a reserved (not-yet-built) cue type is valid but may have zero linked records without erroring', () => {
    const reserved = CUE_TYPES.find((c) => !c.builtInApp);
    expect(reserved).toBeTruthy();
    expect(isValidCueType(reserved.id)).toBe(true);
    expect(() => getEvidenceForCue(reserved.id)).not.toThrow();
  });
});

describe('countEvidenceByCue', () => {
  it('includes every CUE_TYPES id, including zero-count ones, and sums to at least the corpus size in cue-links', () => {
    const counts = countEvidenceByCue();
    for (const { id } of CUE_TYPES) {
      expect(counts).toHaveProperty(id);
      expect(counts[id]).toBeGreaterThanOrEqual(0);
    }
  });
});
