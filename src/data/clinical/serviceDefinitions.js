// Explicit simulation assignments. A source for one field does not verify the whole record.
export const assumption = (value, note = 'Fictional scenario parameter; not measured activity or clinical guidance.') =>
  ({ value, status: 'simulation-assumption', note, source: null, checkedOn: null });
export const unconfirmed = (value, note) => ({ value, status: 'unconfirmed', note, source: null, checkedOn: null });
export const published = (value, source, note) => ({ value, status: 'published', source, note, checkedOn: '2026-09-09' });

// Service type, specialty and patient care level are separate dimensions.
// Existing IDs deliberately remain stable so saved work is not orphaned.
const assignments = {
  stroke: ['jpuh-ward-1'], cardiology: ['jpuh-ward-2', 'jpuh-acu', 'cuh-k2', 'cuh-k3'],
  gastroenterology: ['jpuh-ward-3', 'cuh-u2'],
  generalMedicine: ['jpuh-ward-4', 'jpuh-ward-7', 'jpuh-ward-16', 'jpuh-eadu', 'jpuh-ambulatory', 'nnuh-holt', 'cuh-g2', 'cuh-g3'],
  generalSurgery: ['jpuh-ward-5', 'jpuh-ward-9', 'nnuh-easton', 'jpuh-theatres'],
  orthopaedicsTrauma: ['jpuh-ward-6'], orthopaedicsElective: ['jpuh-ward-22'],
  ophthalmology: ['jpuh-windsor'], paediatrics: ['jpuh-ward-10'], neonatal: ['jpuh-neonatal', 'nnuh-nicu'],
  maternity: ['jpuh-ward-11', 'jpuh-cds', 'jpuh-anc'], elderly: ['jpuh-ward-12', 'cuh-c4'],
  respiratory: ['jpuh-ward-15', 'jpuh-ward-18'],
  haematologyOncology: ['jpuh-ward-17', 'cuh-c10', 'cuh-c10-haem2'],
  oncologyDay: ['jpuh-sandra-chapman', 'nnuh-weybourne', 'nnuh-colney'],
  emergency: ['jpuh-ed', 'cuh-ed'], criticalCare: ['jpuh-icu-hdu', 'nnuh-critical-care', 'cuh-critical-care'],
  endoscopy: ['jpuh-endoscopy'], dialysis: ['jpuh-renal'], daySurgery: ['jpuh-day-care'],
  neurosciences: ['cuh-a3', 'cuh-a4', 'cuh-a5'], renal: ['cuh-c5'], diabetesEndocrine: ['cuh-d7'],
  transplant: ['cuh-f5', 'cuh-g5'], electiveAdmissions: ['nnuh-sdau'], dischargeLounge: ['qehkl-discharge-lounge'],
  // The generic day surgery unit does not inherit James Paget's bookings or catalogue.
  unconfirmed: ['cuh-l2']
};
export const SERVICE_DEFINITIONS = Object.fromEntries(Object.entries(assignments).flatMap(([category, ids]) =>
  ids.map((id) => [id, { category, assignment: unconfirmed(category, 'Explicit demo assignment from the existing directory; current local service allocation requires confirmation.') }])));

Object.assign(SERVICE_DEFINITIONS['jpuh-day-care'], {
  serviceType: 'day-surgery', supportedCareLevels: [],
  capacity: published(20, 'https://www.jpaget.nhs.uk/departments/day-care-unit/', 'Day beds; no overnight accommodation.'),
  sameDayOnly: published(true, 'https://www.jpaget.nhs.uk/departments/day-care-unit/', 'Overnight admission requires transfer to another service.')
});
Object.assign(SERVICE_DEFINITIONS['jpuh-icu-hdu'], {
  supportedCareLevels: [2, 3],
  capacity: published(12, 'https://www.jpaget.nhs.uk/media/arxa4uxj/visiting-the-intensive-care-unit-and-high-dependency-unit.pdf', 'Combined ICU/HDU capacity in the April 2025 leaflet; not a live staffed-bed count.')
});
Object.assign(SERVICE_DEFINITIONS['jpuh-renal'], {
  capacity: published(18, 'https://www.jpaget.nhs.uk/departments/renal-unit/', 'Dialysis machines, not inpatient beds.')
});
Object.assign(SERVICE_DEFINITIONS['cuh-f5'], { supportedCareLevels: [2] });
Object.assign(SERVICE_DEFINITIONS['nnuh-sdau'], { serviceType: 'admission-area', supportedCareLevels: [] });
Object.assign(SERVICE_DEFINITIONS['qehkl-discharge-lounge'], { serviceType: 'discharge-lounge', supportedCareLevels: [] });

// Allow-list for this simulation only. Hospital labels never infer a capability.
// These are not a referral directory, live bed availability or transfer recommendations.
export const HOSPITAL_CAPABILITIES = {
  jpuh: { label: 'Local surgery and combined adult critical care', services: {
    'adult-critical-care': { wardIds: ['jpuh-icu-hdu'], evidence: published(true, 'https://www.jpaget.nhs.uk/media/arxa4uxj/visiting-the-intensive-care-unit-and-high-dependency-unit.pdf', 'Combined ICU/HDU described by the Trust.') },
    'postoperative-inpatient': { wardIds: ['jpuh-ward-9'], evidence: assumption(true, 'Demo receiving ward only; actual specialty, sex allocation and acceptance require local confirmation.') }
  } },
  nnuh: { label: 'Specialist services with onward referral and return pathways', services: {
    'adult-critical-care': { wardIds: ['nnuh-critical-care'], evidence: unconfirmed(true, 'Existing directory entry; current capacity and acceptance criteria not verified here.') },
    'neonatal-care': { wardIds: ['nnuh-nicu'], evidence: unconfirmed(true, 'Existing directory entry; do not infer a paediatric intensive-care transfer route.') }
  } },
  cuh: { label: 'Specialist neuroscience and transplant service examples', services: {
    'adult-critical-care': { wardIds: ['cuh-critical-care'], evidence: unconfirmed(true, 'Existing directory entry; individual unit allocation requires confirmation.') },
    'transplant-care': { wardIds: ['cuh-f5', 'cuh-g5'], evidence: unconfirmed(true, 'Existing directory assignments; current service boundaries require confirmation.') }
  } }
};

export function simulationDestination(hospitalId, capability, wardId) {
  const service = HOSPITAL_CAPABILITIES[hospitalId]?.services[capability];
  return service?.evidence.value === true && !['conflicting', 'source-pending'].includes(service.evidence.status) && service.wardIds.includes(wardId)
    ? { hospitalId, wardId, evidence: service.evidence, humanReviewRequired: true } : null;
}

export function evidenceNeedsReview(evidence) {
  return !['published', 'published-secondary'].includes(evidence?.status) || !evidence?.source || !evidence?.checkedOn;
}

// Audit the resolved fields so inherited fictional defaults cannot disappear.
export function auditServiceEvidence(hospitals) {
  const findings = [];
  const check = (hospitalId, wardId, field, evidence) => {
    if (evidenceNeedsReview(evidence)) findings.push({ hospitalId, wardId, field, evidence });
  };
  for (const hospital of hospitals) {
    for (const ward of hospital.wards) {
      for (const [field, evidence] of Object.entries(ward.profile.fieldEvidence)) check(hospital.id, ward.id, field, evidence);
    }
    for (const [capability, service] of Object.entries(HOSPITAL_CAPABILITIES[hospital.id]?.services ?? {})) {
      check(hospital.id, undefined, `capability:${capability}`, service.evidence);
    }
  }
  for (const route of NETWORK_PATHWAYS) check(route.from, undefined, `pathway:${route.to}:${route.direction}`, route.evidence);
  return findings;
}

export const NETWORK_PATHWAYS = [
  { from: 'nnuh', to: 'cuh', purpose: 'Specialist trauma care', direction: 'referral',
    evidence: published(true, 'https://www.nnuh.nhs.uk/our-services/emergency-care/trauma-services/', 'Published pathway example; no automatic destination selection.') },
  { from: 'cuh', to: 'nnuh', purpose: 'Return after specialist trauma treatment', direction: 'return',
    evidence: published(true, 'https://www.nnuh.nhs.uk/our-services/emergency-care/trauma-services/', 'Return pathway described by NNUH; clinical acceptance remains a human decision.') }
];
