#!/usr/bin/env node
/**
 * SafeFlow evidence corpus — curation builder (SF-284).
 *
 * Assigns cueTypes to each ingested record by the topical search bucket it
 * was harvested under (failure-to-rescue, NEWS2/EWS, dysphagia, delirium,
 * sepsis, frailty, SBAR/handover, malnutrition — the 8 original PubMed
 * searches from the horizon-scan). This is bucket-level curation, not
 * per-record hand-tagging: it is honest about its own precision. A handful
 * of records additionally get 'staffing-context' where the paper is
 * specifically about nurse staffing and failure-to-rescue/sepsis outcomes
 * (Aiken 2002, Ward 2018, Lasater 2020) - these are known by PMID, not
 * inferred.
 *
 * verification defaults to 'metadata-only' for a record the first time it
 * appears here. Once a SafeFlow summary is written for a pmid (curation.json
 * hand-edited directly, outside this script - see SF-286), re-running this
 * script preserves that summary and its verification level rather than
 * wiping it - see the merge-safe note on main() below.
 *
 * Usage: node scripts/evidence/build-curation.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BUCKETS = {
  failureToRescue: {
    cueTypes: ['escalation', 'deteriorating-obs'],
    pmids: ['12387650', '19948370', '32414401', '26616276', '36731308', '36621563', '31268580', '29557884', '12544057', '39116825', '33775748']
  },
  news2: {
    cueTypes: ['deteriorating-obs', 'score-comparison'],
    pmids: ['36914194', '25583148', '41142216', '37730667', '34343047', '40138535', '40144447', '34622831', '40069742', '41618411', '37931891']
  },
  dysphagia: {
    cueTypes: ['dysphagia-swallow-screen'],
    pmids: ['20074192', '28618137', '27224683', '26895569']
  },
  delirium: {
    cueTypes: ['delirium-screening'],
    pmids: ['37527704', '31633738', '35854358', '37128953', '34302312', '40198074', '36584541', '34663229', '38757369']
  },
  sepsis: {
    cueTypes: ['sepsis-screen'],
    pmids: ['34599691', '33242267', '34605781', '35776738', '34379473', '28509730', '35045340', '33309843', '33736927']
  },
  frailty: {
    cueTypes: ['frailty-assessment'],
    pmids: ['36598761', '28676896', '32986957', '40425395', '38541274', '30076123', '38493521', '39299664', '36593448', '40165150']
  },
  sbar: {
    cueTypes: ['handover'],
    pmids: ['27900413', '28523364', '40951245', '42338059', '40884900', '40917463', '41196019']
  },
  malnutrition: {
    cueTypes: ['malnutrition-screening'],
    pmids: ['21556200', '35215559', '38582013', '31021360', '37478809', '38309229', '22122869', '31882232', '17472872']
  },
  // SF-285 (wave 3) - pharmacy/medication safety, previously uncovered discipline.
  medicationSafety: {
    cueTypes: ['medication-safety'],
    pmids: ['41840386', '41108444', '38038490', '30337496', '24145589', '22114827', '41748493', '39737368', '39613715', '38357842', '37872107', '37813103', '31970884']
  },
  // SF-285 (wave 3) - physio: falls prevention + hospital-associated deconditioning/mobility.
  physioMobility: {
    cueTypes: ['falls-mobility'],
    pmids: ['41827168', '40576643', '36355032', '30612584', '28926152', '28729323', '28647551', '26456639', '41232925', '40847496', '39497271', '36751897', '35142397', '33750320', '32902637', '31389854', '28940784']
  },
  // SF-285 (wave 3) - OT: functional decline / discharge readiness after acute admission.
  otDischarge: {
    cueTypes: ['functional-decline'],
    pmids: ['41805229', '41737501', '39999957', '39649111', '38581603']
  },
  // SF-285 (wave 3) - acute kidney injury recognition, previously uncovered medical topic.
  aki: {
    cueTypes: ['aki-recognition'],
    pmids: ['26734153', '34446340', '28239173']
  },
  // SF-285 (wave 3) - nurses' intuition/worry as an early-deterioration signal.
  nurseIntuition: {
    cueTypes: ['nurse-intuition'],
    pmids: ['25990249']
  },
  // SF-287 (wave 4) - electrolyte recognition/management, closes a zero-coverage
  // gap for an already-live heuristicCueEngine.js cue type (not a reserved one).
  electrolyteReview: {
    cueTypes: ['electrolyte-review'],
    pmids: ['42225499', '41357015', '35224769']
  },
  // SF-287 (wave 4) - discharge documentation/safety quality, closes a
  // zero-coverage gap for an already-live cue type.
  discharge: {
    cueTypes: ['discharge'],
    pmids: ['41446475', '41356955', '41261337', '40323616', '39836954', '39205745', '36379642', '32419933']
  },
  // SF-287 (wave 4) - nursing documentation completeness/missed-care, closes a
  // zero-coverage gap for an already-live cue type.
  documentation: {
    cueTypes: ['documentation'],
    pmids: ['42494114', '42096723', '41441343', '40775944', '40275787', '39026330', '38180801']
  }
};

// Known staffing-specific papers, tagged in addition to their bucket cueTypes.
const STAFFING_CONTEXT_PMIDS = new Set([
  '12387650', // Aiken 2002 JAMA - nurse staffing and failure to rescue
  '29557884', // Ward 2018 - hospital staffing models and failure to rescue
  '33309843'  // Lasater 2020 - nurse-to-patient ratios and sepsis bundles
]);

/**
 * Merge-safe by design: this script is re-run every time a new ingestion wave
 * adds buckets, and by SF-286 a separate process (SafeFlow-authored summaries)
 * hand-edits curation.json directly to add safeflowSummary/verification. A
 * naive rebuild-from-scratch would silently wipe that work back to
 * metadata-only/null every time the buckets change - so any existing
 * safeflowSummary/verification for a pmid is preserved, and only cueTypes
 * (and pmids with no prior curation at all) are (re)computed from BUCKETS.
 */
function main() {
  let existing = {};
  if (existsSync('scripts/evidence/curation.json')) {
    existing = JSON.parse(readFileSync('scripts/evidence/curation.json', 'utf8'));
  }

  const curation = {};
  let assigned = 0;
  let preserved = 0;

  for (const bucket of Object.values(BUCKETS)) {
    for (const pmid of bucket.pmids) {
      const cueTypes = [...bucket.cueTypes];
      if (STAFFING_CONTEXT_PMIDS.has(pmid)) {
        cueTypes.push('staffing-context');
      }
      const prior = existing[pmid];
      const hasSummary = prior && typeof prior.safeflowSummary === 'string' && prior.safeflowSummary.trim().length > 0;
      curation[pmid] = {
        cueTypes,
        verification: hasSummary ? prior.verification : 'metadata-only',
        safeflowSummary: hasSummary ? prior.safeflowSummary : null
      };
      if (hasSummary) preserved += 1;
      assigned += 1;
    }
  }

  writeFileSync('scripts/evidence/curation.json', JSON.stringify(curation, null, 2));
  console.log(`curation built for ${assigned} pmids (${preserved} existing safeflowSummary preserved) -> scripts/evidence/curation.json`);
}

main();
