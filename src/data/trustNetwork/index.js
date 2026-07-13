// SafeFlow two-trust simulation network — source of truth.
//
// SIMULATION-ONLY. Real trust/ward NAMES (see trusts.js) with entirely FICTIONAL
// patients and journeys. No real patient data. Not for live clinical deployment.
// Human review required. This models — for review-support and education only —
// how a fictional patient's journey and handover BETWEEN two trusts would look,
// and how the health plan continues (return to James Paget, or packages of care /
// discharge). It is NOT a live inter-trust patient record or coordination system.

import { TRUSTS, JPUH_WARDS, NNUH_WARDS, ALL_WARDS } from './trusts.js';

const SIMULATION_LABEL = 'Simulation-only';
const CLINICAL_USE = 'not for live clinical deployment';
const SOURCE = 'two-trust simulation network fixture';

const PRONOUNS = ['she/her', 'he/him', 'they/them'];
const AGE_BANDS = ['18-39', '40-64', '65-79', '80+'];
const REVIEW_THEMES = [
  'documentation and handover review',
  'observation trend review',
  'discharge-readiness review',
  'medicine timing documentation review',
  'escalation readiness review'
];

// Wards that hold fictional inpatients in the simulation (beds > 0, not theatres).
const POPULATED_KINDS = new Set(['inpatient-ward', 'assessment-unit', 'critical-care', 'frailty']);

function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

function buildPatients() {
  const patients = [];
  for (const trust of TRUSTS) {
    const wards = trust.id === 'jpuh' ? JPUH_WARDS : NNUH_WARDS;
    let seq = 0;
    for (const ward of wards) {
      if (!POPULATED_KINDS.has(ward.kind) || (ward.simulatedBedCount ?? 0) <= 0) continue;
      const perWard = ward.kind === 'critical-care' ? 2 : 3;
      for (let i = 0; i < perWard; i += 1) {
        seq += 1;
        const id = `${trust.id.toUpperCase()}-P-${pad(seq)}`;
        patients.push(Object.freeze({
          id,
          trustId: trust.id,
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

// Inter-trust handover journeys (all fictional). Each segment references a real
// ward in one of the two trusts and carries a plain-English, human-review-framed
// handover / plan-continuity note. Stages: admission -> specialist-care ->
// step-down -> repatriation -> discharge / packages-of-care.
const JOURNEY_DEFINITIONS = [
  {
    id: 'journey-critical-care-repatriation',
    title: 'District admission, tertiary critical care, then repatriation to James Paget',
    summary:
      'Fictional patient admitted at James Paget deteriorates, is handed over to Norfolk & Norwich critical care, stabilises, and is repatriated to James Paget before discharge.',
    outcome: 'returned-to-james-paget',
    segments: [
      { wardId: 'jpuh-ward-2', stage: 'admission', note: 'Admitted under Cardiology/Medical for review; observations and plan documented for handover.' },
      { wardId: 'jpuh-icu-hdu', stage: 'escalation', note: 'Escalation-readiness cue reviewed by a human; local critical-care review before inter-trust transfer.' },
      { wardId: 'nnuh-critical-care', stage: 'specialist-care', note: 'Inter-trust handover to Norfolk & Norwich Critical Care Complex; SBAR summary and plan carried across so the health plan continues.' },
      { wardId: 'nnuh-gissing', stage: 'step-down', note: 'Step-down to a Norfolk & Norwich ward once stable; discharge-readiness and repatriation criteria documented.' },
      { wardId: 'jpuh-ward-2', stage: 'repatriation', note: 'Repatriated to James Paget with a structured handover; continuing plan and outstanding tasks visible for review.' },
      { wardId: 'jpuh-ward-18', stage: 'discharge', note: 'Discharge pathway via the James Paget discharge lounge; follow-up ownership documented.' }
    ]
  },
  {
    id: 'journey-oncology-shared-care',
    title: 'Shared oncology care between the two trusts, returning to James Paget',
    summary:
      'Fictional patient receives day-unit oncology treatment at Norfolk & Norwich while remaining under James Paget for supportive inpatient care; returns to James Paget.',
    outcome: 'returned-to-james-paget',
    segments: [
      { wardId: 'jpuh-ward-17', stage: 'admission', note: 'Haematology inpatient review at James Paget; treatment plan documented for shared care.' },
      { wardId: 'nnuh-weybourne', stage: 'specialist-care', note: 'Handover for Norfolk & Norwich Weybourne Day Unit treatment; the plan continues across trusts with clear next-review ownership.' },
      { wardId: 'nnuh-colney', stage: 'specialist-care', note: 'Oncology outpatient review at the Colney Centre; findings shared back for the continuing plan.' },
      { wardId: 'jpuh-sandra-chapman', stage: 'step-down', note: 'Supportive day treatment at the James Paget Sandra Chapman Centre; symptoms and plan reviewed.' },
      { wardId: 'jpuh-ward-17', stage: 'repatriation', note: 'Continuing haematology care back at James Paget; handover completeness reviewed by a human.' }
    ]
  },
  {
    id: 'journey-surgical-assessment-discharge-package',
    title: 'Emergency surgical assessment at Norfolk & Norwich, discharge with a package of care',
    summary:
      'Fictional patient presenting at James Paget is handed over to Norfolk & Norwich emergency surgical assessment, treated, and discharged home with a package of care rather than returning to James Paget.',
    outcome: 'discharge-with-package-of-care',
    segments: [
      { wardId: 'jpuh-ed', stage: 'admission', note: 'Presented to the James Paget Emergency Department; assessment and plan documented for handover.' },
      { wardId: 'jpuh-eadu', stage: 'admission', note: 'Emergency Assessment & Discharge Unit review; inter-trust referral decision documented.' },
      { wardId: 'nnuh-easton', stage: 'specialist-care', note: 'Handover to Norfolk & Norwich Emergency Surgical Assessment Unit (Easton); the surgical plan continues across trusts.' },
      { wardId: 'nnuh-denton', stage: 'step-down', note: 'Post-procedure surgical ward stay; discharge-readiness blockers and community needs reviewed.' },
      { wardId: 'nnuh-denton', stage: 'packages-of-care', note: 'Discharge home with a package of care arranged; follow-up and community ownership documented (simulation-only, human-review-framed).' }
    ]
  },
  {
    id: 'journey-frailty-community-package',
    title: "Older person's medicine, cross-trust review, discharge with community package",
    summary:
      "Fictional older patient under James Paget Older People's Medicine has a cross-trust specialist review, then is discharged with a community package of care.",
    outcome: 'discharge-with-package-of-care',
    segments: [
      { wardId: 'jpuh-ward-12', stage: 'admission', note: "Admitted under Older People's Medicine; falls-risk and documentation cues reviewed by a human." },
      { wardId: 'nnuh-loddon', stage: 'specialist-care', note: 'Inter-trust specialist review at Norfolk & Norwich; the continuing plan and outstanding investigations handed over both ways.' },
      { wardId: 'jpuh-ward-12', stage: 'repatriation', note: 'Returned to James Paget with an updated plan; discharge-readiness reviewed.' },
      { wardId: 'jpuh-ward-12', stage: 'packages-of-care', note: 'Discharge home with a community package of care; follow-up ownership and safety-netting documented (simulation-only).' }
    ]
  }
];

function buildJourneys(wardIndex) {
  return Object.freeze(JOURNEY_DEFINITIONS.map((def) => {
    const segments = def.segments.map((seg, order) => {
      const ward = wardIndex.get(seg.wardId);
      return Object.freeze({
        journeyId: def.id,
        order: order + 1,
        trustId: ward.trustId,
        wardId: seg.wardId,
        wardName: ward.name,
        stage: seg.stage,
        handoverNote: seg.note,
        simulationOnly: true
      });
    });
    const trustsInvolved = [...new Set(segments.map((s) => s.trustId))];
    return Object.freeze({
      id: def.id,
      title: def.title,
      summary: def.summary,
      outcome: def.outcome,
      trustsInvolved,
      interTrust: trustsInvolved.length > 1,
      segments,
      simulationOnly: true,
      humanReviewRequired: true
    });
  }));
}

const wardIndex = new Map(ALL_WARDS.map((w) => [w.id, w]));
const patients = buildPatients();
const journeys = buildJourneys(wardIndex);

export const trustNetwork = Object.freeze({
  label: 'SafeFlow two-trust simulation network',
  simulationOnly: true,
  clinicalUse: CLINICAL_USE,
  source: SOURCE,
  boundaryNote:
    'Simulation-only. Real trust and ward names, fictional patients and journeys. Not a live inter-trust record or coordination system. Human review required.',
  trusts: TRUSTS,
  wards: ALL_WARDS,
  patients,
  journeys
});

export function getTrustById(trustId) {
  return TRUSTS.find((t) => t.id === trustId) ?? null;
}

export function getWardsForTrust(trustId) {
  return ALL_WARDS.filter((w) => w.trustId === trustId);
}

export function getPatientsForWard(wardId) {
  return patients.filter((p) => p.wardId === wardId);
}

export function getInterTrustJourneys() {
  return journeys.filter((j) => j.interTrust);
}

// Deterministic export model + referential-integrity check for the generator.
export function buildTrustNetworkExport(network = trustNetwork) {
  const wardIds = new Set(network.wards.map((w) => w.id));
  const trustIds = new Set(network.trusts.map((t) => t.id));
  const violations = [];

  for (const ward of network.wards) {
    if (!trustIds.has(ward.trustId)) violations.push(`ward ${ward.id} -> unknown trust ${ward.trustId}`);
  }
  for (const patient of network.patients) {
    const ward = network.wards.find((w) => w.id === patient.wardId);
    if (!ward) violations.push(`patient ${patient.id} -> unknown ward ${patient.wardId}`);
    else if (ward.trustId !== patient.trustId) violations.push(`patient ${patient.id} trust mismatch (${patient.trustId} vs ward ${ward.trustId})`);
  }
  const journeySegments = [];
  for (const journey of network.journeys) {
    for (const seg of journey.segments) {
      journeySegments.push(seg);
      if (!wardIds.has(seg.wardId)) violations.push(`journey ${journey.id} segment ${seg.order} -> unknown ward ${seg.wardId}`);
    }
  }

  return Object.freeze({
    generatedLabel: `${network.label} (${SIMULATION_LABEL})`,
    simulationOnly: true,
    clinicalUse: CLINICAL_USE,
    boundaryNote: network.boundaryNote,
    trusts: network.trusts,
    wards: network.wards,
    patients: network.patients,
    journeys: network.journeys,
    journeySegments: Object.freeze(journeySegments),
    counts: Object.freeze({
      trusts: network.trusts.length,
      wards: network.wards.length,
      jpuhWards: JPUH_WARDS.length,
      nnuhWards: NNUH_WARDS.length,
      patients: network.patients.length,
      journeys: network.journeys.length,
      interTrustJourneys: network.journeys.filter((j) => j.interTrust).length,
      journeySegments: journeySegments.length
    }),
    integrity: Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations) })
  });
}
