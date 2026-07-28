/**
 * SafeFlow evidence corpus — cue-to-evidence query layer (SF-284).
 *
 * THE BOUNDARY (see docs/public-demo-pack/build-readiness/evidence-corpus-concept.md):
 * evidence links to a CUE TYPE - a category of teaching prompt - and never to a
 * patient, a scenario instance, a score, or a flag on a specific record. This
 * module's public API reflects that structurally: every lookup function takes
 * a cue type string and nothing else. There is no function here, and there
 * must never be a function added here, that accepts a patient ID, scenario
 * ID, flag ID, or any other per-case identifier. See evidenceCorpus.test.js
 * for a source-level test that locks this.
 *
 * The corpus itself (src/data/evidenceCorpus.json) stores bibliographic
 * metadata and citations only - never publisher abstracts or full text. See
 * scripts/evidence/extract-records.mjs for the licence-safe extraction that
 * produced it.
 *
 * A record with cueTypes: [] is real (present in the corpus, not yet linked
 * to a teaching cue) - it is filtered out of lookups, not an error.
 */

import evidenceCorpus from '../data/evidenceCorpus.json';

/**
 * The finite set of cue types this corpus can be queried by. Each entry
 * documents what the cue type is and whether it maps onto a cue already
 * built in the app, or is reserved for a teaching cue not yet built - the
 * corpus was scoped to support all four approved disciplines (SF-282) even
 * where the UI has not caught up yet, and this list is honest about that gap
 * rather than hiding it.
 */
export const CUE_TYPES = Object.freeze([
  // Built in the app - src/domain/heuristicCueEngine.js signal categories.
  Object.freeze({ id: 'deteriorating-obs', builtInApp: true, source: 'heuristicCueEngine' }),
  Object.freeze({ id: 'sepsis-screen', builtInApp: true, source: 'heuristicCueEngine' }),
  Object.freeze({ id: 'escalation', builtInApp: true, source: 'heuristicCueEngine' }),
  Object.freeze({ id: 'handover', builtInApp: true, source: 'heuristicCueEngine' }),
  Object.freeze({ id: 'documentation', builtInApp: true, source: 'heuristicCueEngine' }),
  Object.freeze({ id: 'discharge', builtInApp: true, source: 'heuristicCueEngine' }),
  Object.freeze({ id: 'electrolyte-review', builtInApp: true, source: 'heuristicCueEngine' }),
  // Built in the app - src/data/scenarioLibrary.js named panels.
  Object.freeze({ id: 'staffing-context', builtInApp: true, source: 'scenarioLibrary.staffingContextNote' }),
  Object.freeze({ id: 'new-to-service', builtInApp: true, source: 'scenarioLibrary.newToServiceContextNote' }),
  Object.freeze({ id: 'bias-awareness', builtInApp: true, source: 'scenarioLibrary.biasAwarenessCues' }),
  Object.freeze({ id: 'pearls-debrief', builtInApp: true, source: 'scenarioLibrary.pearlsDebriefPrompts' }),
  Object.freeze({ id: 'pace-ladder', builtInApp: true, source: 'scenarioLibrary.paceAssertivenessLadder' }),
  Object.freeze({ id: 'safety-ii', builtInApp: true, source: 'scenarioLibrary.safetyTwoReflectionPrompts' }),
  Object.freeze({ id: 'score-comparison', builtInApp: true, source: 'scoreComparison.js' }),
  Object.freeze({ id: 'family-concern', builtInApp: true, source: "Martha's Rule scenario" }),
  // Reserved - corpus has supporting evidence, no built cue yet (SF-282 AHP/medical scope).
  Object.freeze({ id: 'dysphagia-swallow-screen', builtInApp: false, source: null }),
  Object.freeze({ id: 'delirium-screening', builtInApp: false, source: null }),
  Object.freeze({ id: 'frailty-assessment', builtInApp: false, source: null }),
  Object.freeze({ id: 'malnutrition-screening', builtInApp: false, source: null }),
  // Reserved - added in SF-285 (wave 3 scale-up: pharmacy, physio/OT, AKI, nurse intuition).
  Object.freeze({ id: 'medication-safety', builtInApp: false, source: null }),
  Object.freeze({ id: 'falls-mobility', builtInApp: false, source: null }),
  Object.freeze({ id: 'functional-decline', builtInApp: false, source: null }),
  Object.freeze({ id: 'aki-recognition', builtInApp: false, source: null }),
  Object.freeze({ id: 'nurse-intuition', builtInApp: false, source: null })
]);

const CUE_TYPE_IDS = new Set(CUE_TYPES.map((c) => c.id));

export function isValidCueType(cueType) {
  return typeof cueType === 'string' && CUE_TYPE_IDS.has(cueType);
}

/**
 * Returns every corpus record linked to a given cue type, sorted newest
 * first. Returns [] for an unknown or unlinked cue type rather than
 * throwing - an empty result is a normal, expected state (most reserved
 * cue types have no linked records yet).
 *
 * @param {string} cueType - one of CUE_TYPES[].id. Never a patient, scenario
 *   or flag identifier - see the module-level boundary note above.
 */
export function getEvidenceForCue(cueType) {
  if (!isValidCueType(cueType)) {
    return [];
  }

  return evidenceCorpus
    .filter((record) => Array.isArray(record.cueTypes) && record.cueTypes.includes(cueType))
    .slice()
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

/** Count of linked records per cue type, including zero-count entries. */
export function countEvidenceByCue() {
  const counts = {};
  for (const { id } of CUE_TYPES) {
    counts[id] = 0;
  }
  for (const record of evidenceCorpus) {
    for (const cueType of record.cueTypes ?? []) {
      if (cueType in counts) {
        counts[cueType] += 1;
      }
    }
  }
  return counts;
}

/** Total corpus size, for status/debug display - not filtered by cue. */
export function getCorpusSize() {
  return evidenceCorpus.length;
}

/**
 * A record is citable in a stakeholder-facing document only once it has a
 * SafeFlow-written summary and a verification level above metadata-only.
 * Nothing in the current corpus meets this yet (see concept doc) - this
 * helper exists so that future UI/reporting code has one place to enforce
 * the rule rather than re-deriving it.
 */
export function isCitable(record) {
  return Boolean(
    record &&
    typeof record.safeflowSummary === 'string' &&
    record.safeflowSummary.trim().length > 0 &&
    record.verification &&
    record.verification !== 'metadata-only'
  );
}
