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
 * verification stays 'metadata-only' for every record here. Reading an
 * abstract to judge topical relevance during ingestion (which happened for
 * all 70 records) is not the same as writing a trustworthy SafeFlow summary
 * grounded in that reading - no safeflowSummary exists yet, so no record
 * has earned a higher verification level. See evidence-corpus-concept.md.
 *
 * Usage: node scripts/evidence/build-curation.mjs
 */

import { writeFileSync } from 'node:fs';

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
  }
};

// Known staffing-specific papers, tagged in addition to their bucket cueTypes.
const STAFFING_CONTEXT_PMIDS = new Set([
  '12387650', // Aiken 2002 JAMA - nurse staffing and failure to rescue
  '29557884', // Ward 2018 - hospital staffing models and failure to rescue
  '33309843'  // Lasater 2020 - nurse-to-patient ratios and sepsis bundles
]);

function main() {
  const curation = {};
  let assigned = 0;

  for (const bucket of Object.values(BUCKETS)) {
    for (const pmid of bucket.pmids) {
      const cueTypes = [...bucket.cueTypes];
      if (STAFFING_CONTEXT_PMIDS.has(pmid)) {
        cueTypes.push('staffing-context');
      }
      curation[pmid] = {
        cueTypes,
        verification: 'metadata-only',
        safeflowSummary: null
      };
      assigned += 1;
    }
  }

  writeFileSync('scripts/evidence/curation.json', JSON.stringify(curation, null, 2));
  console.log(`curation built for ${assigned} pmids -> scripts/evidence/curation.json`);
}

main();
