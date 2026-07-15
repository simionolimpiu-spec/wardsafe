// SafeFlow England trust network — source of truth.
//
// SIMULATION-ONLY. Real trust/ward NAMES (see trusts.js) with entirely FICTIONAL
// patients and journeys. No real patient data. Not for live clinical deployment.
// Human review required. Models — for review-support, learning and TEACHING only —
// a PORTABLE patient journey that travels with a fictional patient across England
// trusts (relocation, temporary visit, found away from home, specialist transfer),
// how the health plan continues, and how a LEARNING COPY of the journey returns to
// the ORIGINATING trust for teaching. It is NOT a live cross-trust patient record or
// data-sharing system (that is the regulated Shared Care Record / DPIA space).

import { TRUSTS, WARDS_BY_TRUST, ALL_WARDS } from './trusts.js';

const CLINICAL_USE = 'not for live clinical deployment';
const SOURCE = 'England trust network simulation fixture';

const PRONOUNS = ['she/her', 'he/him', 'they/them'];
const AGE_BANDS = ['18-39', '40-64', '65-79', '80+'];
const REVIEW_THEMES = [
  'documentation and handover review',
  'observation trend review',
  'discharge-readiness review',
  'medicine timing documentation review',
  'escalation readiness review'
];
const POPULATED_KINDS = new Set(['inpatient-ward', 'assessment-unit', 'critical-care', 'frailty']);
const wardIndex = new Map(ALL_WARDS.map((w) => [w.id, w]));

function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

function buildPatients() {
  const patients = [];
  for (const trust of TRUSTS) {
    const wards = WARDS_BY_TRUST[trust.id] ?? [];
    let seq = 0;
    for (const ward of wards) {
      if (!POPULATED_KINDS.has(ward.kind) || (ward.simulatedBedCount ?? 0) <= 0) continue;
      const perWard = ward.kind === 'critical-care' ? 2 : 3;
      for (let i = 0; i < perWard; i += 1) {
        seq += 1;
        patients.push(Object.freeze({
          id: `${trust.id.toUpperCase()}-P-${pad(seq)}`,
          trustId: trust.id,
          homeTrustId: trust.id,
          wardId: ward.id,
          displayLabel: 'Fictional patient (simulation)',
          pronouns: PRONOUNS[seq % PRONOUNS.length],
          ageBand: AGE_BANDS[(seq + i) % AGE_BANDS.length],
          reviewTheme: REVIEW_THEMES[seq % REVIEW_THEMES.length],
          simulationOnly: true,
          clinicalUse: CLINICAL_USE
        }));
      }
    }
  }
  return Object.freeze(patients);
}

// Journeys. `journeyType`:
//   inter-trust-handover  — local handover / repatriation between two trusts.
//   specialist-transfer   — transfer to a tertiary centre and back.
//   relocation            — patient relocates region; care + history continue at the new trust.
//   temporary-visitor     — taken ill / found away from home; treated, then returns home.
// Each journey carries a `learningRecord` returned to the originating (home) trust for teaching.
const JOURNEY_DEFINITIONS = [
  {
    id: 'journey-critical-care-repatriation', journeyType: 'inter-trust-handover', homeTrustId: 'jpuh',
    title: 'District admission, tertiary critical care, then repatriation to James Paget',
    summary: 'Fictional patient at James Paget deteriorates, is handed over to Norfolk & Norwich critical care, stabilises, and is repatriated to James Paget before discharge.',
    outcome: 'returned-to-james-paget',
    segments: [
      { wardId: 'jpuh-ward-2', stage: 'admission', note: 'Admitted under Cardiology/Medical; observations and plan documented for handover.' },
      { wardId: 'jpuh-icu-hdu', stage: 'escalation', note: 'Escalation-readiness cue reviewed by a human; local critical-care review before inter-trust transfer.' },
      { wardId: 'nnuh-critical-care', stage: 'specialist-care', note: 'Inter-trust handover to Norfolk & Norwich Critical Care Complex; SBAR summary and plan carried across so the health plan continues.' },
      { wardId: 'nnuh-gissing', stage: 'step-down', note: 'Step-down once stable; repatriation criteria documented.' },
      { wardId: 'jpuh-ward-2', stage: 'repatriation', note: 'Repatriated to James Paget with a structured handover; continuing plan and outstanding tasks visible for review.' },
      { wardId: 'jpuh-ward-18', stage: 'discharge', note: 'Discharge via the James Paget discharge lounge; follow-up ownership documented.' }
    ],
    learning: { returnedToTrustId: 'jpuh', summary: 'Teaching copy of the cross-trust critical-care episode returned to James Paget.', teachingPoints: ['Escalation-readiness recognition before transfer', 'Structured SBAR handover between trusts', 'Repatriation-criteria documentation'] }
  },
  {
    id: 'journey-specialist-neuro-transfer', journeyType: 'specialist-transfer', homeTrustId: 'jpuh',
    title: "Specialist neurosciences transfer to Addenbrooke's, repatriated to James Paget",
    summary: "Fictional patient needs tertiary neurosciences care not available locally, is transferred to Addenbrooke's, then repatriated to James Paget; the originating ward receives a learning copy.",
    outcome: 'returned-to-james-paget',
    segments: [
      { wardId: 'jpuh-ed', stage: 'admission', note: 'Presented to James Paget Emergency Department; assessment and plan documented.' },
      { wardId: 'jpuh-icu-hdu', stage: 'escalation', note: 'Stabilised locally; tertiary neurosciences referral decision documented and reviewed by a human.' },
      { wardId: 'cuh-a4', stage: 'specialist-care', note: "Transfer to Addenbrooke's neuromedical/neurosurgical ward; the health plan and history travel with the patient." },
      { wardId: 'cuh-critical-care', stage: 'specialist-care', note: "Addenbrooke's critical care as needed; plan updated and shared for continuity." },
      { wardId: 'jpuh-ward-1', stage: 'repatriation', note: 'Repatriated to the James Paget Stroke Unit for ongoing rehabilitation; handover completeness reviewed.' }
    ],
    learning: { returnedToTrustId: 'jpuh', summary: "Teaching copy of the neurosciences transfer returned to James Paget's originating team.", teachingPoints: ['When to refer to a tertiary neurosciences centre', 'Continuity of the plan across a specialist transfer', 'Rehabilitation handover on repatriation'] }
  },
  {
    id: 'journey-relocation-continues', journeyType: 'relocation', homeTrustId: 'jpuh',
    title: 'Patient relocates to Cambridgeshire — care and history continue at Addenbrooke’s',
    summary: "Fictional patient whose home trust is James Paget relocates; a later episode is managed at Addenbrooke's with the journey/history available, and a learning copy returns to James Paget.",
    outcome: 'continues-at-new-trust',
    segments: [
      { wardId: 'jpuh-ward-12', stage: 'admission', note: "Prior episode under James Paget Older People's Medicine; documented plan forms the portable history." },
      { wardId: 'cuh-c4', stage: 'relocation-care', note: "After relocating, a new episode is managed at Addenbrooke's frail-elderly ward with the portable history available for continuity." },
      { wardId: 'cuh-c5', stage: 'step-down', note: 'General medicine / nephrology review; continuing plan documented at the new home trust.' }
    ],
    learning: { returnedToTrustId: 'jpuh', summary: 'Learning copy of the relocated-patient continuity episode returned to James Paget for teaching.', teachingPoints: ['Value of a portable history on relocation', 'Continuity of frailty plans across trusts', 'What the originating team can learn from the onward episode'] }
  },
  {
    id: 'journey-temporary-visitor-returns', journeyType: 'temporary-visitor', homeTrustId: 'nnuh',
    title: 'Taken ill while away from home — treated at West Suffolk, returns to Norfolk & Norwich',
    summary: 'Fictional patient whose home trust is Norfolk & Norwich is taken ill while temporarily in West Suffolk, is treated there, then returns home; both trusts hold the record and the originating trust receives a learning copy.',
    outcome: 'returned-home-with-learning-copy',
    segments: [
      { wardId: 'wsh-ed', stage: 'found-away', note: 'Taken ill while away from home; attends West Suffolk Emergency Department; portable history supports safe assessment.' },
      { wardId: 'wsh-amu', stage: 'treatment-away', note: 'Managed on the West Suffolk Acute Medical Unit; plan documented and shareable for continuity.' },
      { wardId: 'nnuh-holt', stage: 'return-home', note: 'Returns home; Norfolk & Norwich Acute Medical Unit continues the plan with the away-episode visible.' },
      { wardId: 'nnuh-gunthorpe', stage: 'discharge', note: 'Discharge with follow-up; away-episode incorporated into the continuing record.' }
    ],
    learning: { returnedToTrustId: 'nnuh', summary: 'Learning copy of the away-from-home episode returned to Norfolk & Norwich for teaching and continuity.', teachingPoints: ['Safe assessment of a visiting patient with portable history', 'Bringing an away-episode back into the home record', 'Teaching value of cross-trust continuity'] }
  },
  {
    id: 'journey-cross-region-discharge-package', journeyType: 'relocation', homeTrustId: 'qeh',
    title: "Cross-region episode, discharge with a package of care near new home",
    summary: "Fictional patient whose home trust is Queen Elizabeth King's Lynn has an episode managed at Ipswich (ESNEFT) after moving; discharged with a package of care near the new home, with a learning copy back to King's Lynn.",
    outcome: 'discharge-with-package-of-care',
    segments: [
      { wardId: 'qeh-gen-med', stage: 'admission', note: "Prior general-medicine episode at Queen Elizabeth King's Lynn forms the portable history." },
      { wardId: 'esneft-amu', stage: 'relocation-care', note: 'After moving to East Suffolk, a new episode is assessed at Ipswich Acute Medical Unit with the history available.' },
      { wardId: 'esneft-elderly', stage: 'step-down', note: "Older people's medicine review; community needs and discharge-readiness documented." },
      { wardId: 'esneft-discharge', stage: 'packages-of-care', note: 'Discharge home with a package of care near the new home; follow-up ownership documented (simulation-only, human-review-framed).' }
    ],
    learning: { returnedToTrustId: 'qeh', summary: "Learning copy of the cross-region episode returned to Queen Elizabeth King's Lynn for teaching.", teachingPoints: ['Continuity when a patient moves region', 'Arranging community packages near a new home', 'Feedback loop to the originating trust'] }
  }
];

function trustShort(trustId) {
  const t = TRUSTS.find((x) => x.id === trustId);
  return t ? t.shortName : trustId;
}

function buildJourneys() {
  return Object.freeze(JOURNEY_DEFINITIONS.map((def) => {
    const segments = def.segments.map((seg, order) => {
      const ward = wardIndex.get(seg.wardId);
      return Object.freeze({
        journeyId: def.id, order: order + 1, trustId: ward.trustId, wardId: seg.wardId,
        wardName: ward.name, trustShortName: trustShort(ward.trustId), stage: seg.stage,
        handoverNote: seg.note, simulationOnly: true
      });
    });
    const trustsInvolved = [...new Set(segments.map((s) => s.trustId))];
    return Object.freeze({
      id: def.id, journeyType: def.journeyType, homeTrustId: def.homeTrustId, homeTrustName: trustShort(def.homeTrustId),
      title: def.title, summary: def.summary, outcome: def.outcome,
      trustsInvolved, interTrust: trustsInvolved.length > 1, segments,
      learningRecord: Object.freeze({
        returnedToTrustId: def.learning.returnedToTrustId,
        returnedToTrustName: trustShort(def.learning.returnedToTrustId),
        summary: def.learning.summary,
        teachingPoints: Object.freeze([...def.learning.teachingPoints]),
        purpose: 'learning and teaching (simulation)'
      }),
      simulationOnly: true, humanReviewRequired: true
    });
  }));
}

const patients = buildPatients();
const journeys = buildJourneys();

export const trustNetwork = Object.freeze({
  label: 'SafeFlow England trust network (simulation)',
  simulationOnly: true, clinicalUse: CLINICAL_USE, source: SOURCE,
  boundaryNote:
    'Simulation-only. Real trust and ward names, fictional patients and portable journeys. A learning copy of each cross-trust journey returns to the originating trust for teaching. This is NOT a live cross-trust patient record or data-sharing system; a real version would require Shared Care Record / DPIA information-governance. Human review required.',
  trusts: TRUSTS, wards: ALL_WARDS, patients, journeys
});

export function getTrustById(trustId) { return TRUSTS.find((t) => t.id === trustId) ?? null; }
export function getWardsForTrust(trustId) { return ALL_WARDS.filter((w) => w.trustId === trustId); }
export function getPatientsForWard(wardId) { return patients.filter((p) => p.wardId === wardId); }
export function getInterTrustJourneys() { return journeys.filter((j) => j.interTrust); }
export function getPortableJourneys() {
  return journeys.filter((j) => ['relocation', 'temporary-visitor', 'specialist-transfer'].includes(j.journeyType));
}
export function getLearningRecords() {
  return journeys.map((j) => ({ journeyId: j.id, title: j.title, ...j.learningRecord }));
}

export function buildTrustNetworkExport(network = trustNetwork) {
  const wardIds = new Set(network.wards.map((w) => w.id));
  const trustIds = new Set(network.trusts.map((t) => t.id));
  const violations = [];

  for (const ward of network.wards) {
    if (!trustIds.has(ward.trustId)) violations.push(`ward ${ward.id} -> unknown trust ${ward.trustId}`);
  }
  for (const patient of network.patients) {
    const ward = wardIndex.get(patient.wardId);
    if (!ward) violations.push(`patient ${patient.id} -> unknown ward ${patient.wardId}`);
    else if (ward.trustId !== patient.trustId) violations.push(`patient ${patient.id} trust mismatch`);
    if (!trustIds.has(patient.homeTrustId)) violations.push(`patient ${patient.id} -> unknown home trust ${patient.homeTrustId}`);
  }
  const journeySegments = [];
  for (const journey of network.journeys) {
    if (!trustIds.has(journey.homeTrustId)) violations.push(`journey ${journey.id} -> unknown home trust ${journey.homeTrustId}`);
    if (!trustIds.has(journey.learningRecord.returnedToTrustId)) violations.push(`journey ${journey.id} learning -> unknown trust`);
    for (const seg of journey.segments) {
      journeySegments.push(seg);
      if (!wardIds.has(seg.wardId)) violations.push(`journey ${journey.id} segment ${seg.order} -> unknown ward ${seg.wardId}`);
    }
  }

  const perTrustWardCounts = {};
  for (const trust of network.trusts) perTrustWardCounts[trust.id] = network.wards.filter((w) => w.trustId === trust.id).length;

  return Object.freeze({
    generatedLabel: `${network.label}`,
    simulationOnly: true, clinicalUse: CLINICAL_USE, boundaryNote: network.boundaryNote,
    trusts: network.trusts, wards: network.wards, patients: network.patients, journeys: network.journeys,
    journeySegments: Object.freeze(journeySegments),
    learningRecords: Object.freeze(getLearningRecords()),
    counts: Object.freeze({
      trusts: network.trusts.length,
      wards: network.wards.length,
      perTrustWardCounts: Object.freeze(perTrustWardCounts),
      patients: network.patients.length,
      journeys: network.journeys.length,
      interTrustJourneys: network.journeys.filter((j) => j.interTrust).length,
      portableJourneys: getPortableJourneys().length,
      journeySegments: journeySegments.length,
      learningRecords: network.journeys.length
    }),
    integrity: Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations) })
  });
}
