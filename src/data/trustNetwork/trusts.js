// SafeFlow England trust network — trust + ward definitions.
//
// SIMULATION-ONLY. TRUST and WARD names are real public NHS structures used only
// to make the simulation realistic. All PATIENTS and journeys are FICTIONAL.
// No real patient data. Not for live clinical deployment. Human review required.
// This is NOT a live cross-trust patient record or data-sharing system (that would
// be the regulated Shared Care Record / DPIA space — see portable-patient-journey-concept.md).
//
// Per-trust `wardSource`:
//   'exact'         — full official ward directory captured verbatim.
//   'sourced'       — real ward names confirmed from the trust's public Wards A-Z (partial; re-verify for completeness).
//   'representative'— real FUNCTIONAL unit names every acute trust has (ED, AMU, ICU, Stroke Unit, ...);
//                     proper ward names not yet sourced. Clearly a placeholder set, not invented proper nouns.
// Sources fetched July 2026 (jpaget.nhs.uk, nnuh.nhs.uk, cuh.nhs.uk) — re-verify periodically.
// `simulatedBedCount` is a simulation estimate ONLY, not a real bed number.

export const TRUSTS = Object.freeze([
  Object.freeze({ id: 'jpuh', name: 'James Paget University Hospital', shortName: 'James Paget', region: 'Norfolk / Waveney', role: 'district general hospital', wardSource: 'exact', simulationOnly: true, clinicalUse: 'not for live clinical deployment' }),
  Object.freeze({ id: 'nnuh', name: 'Norfolk and Norwich University Hospital', shortName: 'Norfolk & Norwich', region: 'Norfolk', role: 'tertiary teaching hospital', wardSource: 'sourced', simulationOnly: true, clinicalUse: 'not for live clinical deployment' }),
  Object.freeze({ id: 'cuh', name: "Addenbrooke's Hospital (Cambridge University Hospitals)", shortName: "Addenbrooke's", region: 'Cambridgeshire', role: 'tertiary / major trauma / neurosciences / transplant', wardSource: 'sourced', simulationOnly: true, clinicalUse: 'not for live clinical deployment' }),
  Object.freeze({ id: 'wsh', name: 'West Suffolk Hospital', shortName: 'West Suffolk', region: 'West Suffolk (Bury St Edmunds)', role: 'district general hospital', wardSource: 'representative', simulationOnly: true, clinicalUse: 'not for live clinical deployment' }),
  Object.freeze({ id: 'esneft', name: 'Ipswich Hospital (East Suffolk & North Essex)', shortName: 'ESNEFT — Ipswich', region: 'East Suffolk', role: 'district general hospital', wardSource: 'representative', simulationOnly: true, clinicalUse: 'not for live clinical deployment' }),
  Object.freeze({ id: 'qeh', name: "Queen Elizabeth Hospital King's Lynn", shortName: "QEH King's Lynn", region: 'West Norfolk', role: 'district general hospital', wardSource: 'representative', simulationOnly: true, clinicalUse: 'not for live clinical deployment' })
]);

function freezeWards(trustId, wards) {
  return Object.freeze(wards.map((w) => Object.freeze({ ...w, trustId, simulationOnly: true })));
}

// James Paget University Hospital — EXACT ward directory (jpaget.nhs.uk, July 2026).
export const JPUH_WARDS = freezeWards('jpuh', [
  { id: 'jpuh-ward-1', name: 'Ward 1', specialty: 'Stroke Unit', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'jpuh-ward-2', name: 'Ward 2', specialty: 'Cardiology / Medical', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'jpuh-acu', name: 'Acute Cardiology Unit', specialty: 'Cardiology', kind: 'assessment-unit', wardGroup: 'medical', simulatedBedCount: 12 },
  { id: 'jpuh-ward-3', name: 'Ward 3', specialty: 'Gastroenterology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'jpuh-ward-4', name: 'Ward 4', specialty: 'General Medicine', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 30 },
  { id: 'jpuh-ward-5', name: 'Ward 5', specialty: 'Mixed Surgery', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
  { id: 'jpuh-ward-6', name: 'Ward 6', specialty: 'Orthopaedic — Trauma', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
  { id: 'jpuh-ward-7', name: 'Ward 7', specialty: 'General Medicine', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 30 },
  { id: 'jpuh-ward-9', name: 'Ward 9', specialty: 'Mixed Surgery', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
  { id: 'jpuh-windsor', name: 'Windsor Suite', specialty: 'Ophthalmic Day Unit', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'jpuh-ward-10', name: 'Ward 10', specialty: 'Paediatrics', kind: 'paediatrics', wardGroup: 'specialty', simulatedBedCount: 20 },
  { id: 'jpuh-neonatal', name: 'Neonatal Unit', specialty: 'Neonatal', kind: 'neonatal', wardGroup: 'specialty', simulatedBedCount: 12 },
  { id: 'jpuh-ward-11', name: 'Ward 11', specialty: 'Maternity', kind: 'maternity', wardGroup: 'specialty', simulatedBedCount: 22 },
  { id: 'jpuh-cds', name: 'Central Delivery Suite', specialty: 'Maternity — Delivery', kind: 'maternity', wardGroup: 'specialty', simulatedBedCount: 10 },
  { id: 'jpuh-anc', name: 'Antenatal Clinic', specialty: 'Maternity — Antenatal', kind: 'clinic', wardGroup: 'specialty', simulatedBedCount: 0 },
  { id: 'jpuh-ward-12', name: 'Ward 12', specialty: "Older People's Medicine", kind: 'inpatient-ward', wardGroup: 'frailty', simulatedBedCount: 30 },
  { id: 'jpuh-ward-15', name: 'Ward 15', specialty: 'Respiratory', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'jpuh-ward-16', name: 'Ward 16 (Short Stay)', specialty: 'Short Stay Medical Unit', kind: 'assessment-unit', wardGroup: 'medical', simulatedBedCount: 24 },
  { id: 'jpuh-ward-17', name: 'Ward 17', specialty: 'Haematology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 24 },
  { id: 'jpuh-ward-18', name: 'Ward 18 & Discharge Lounge', specialty: 'Respiratory', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'jpuh-sandra-chapman', name: 'Sandra Chapman Centre', specialty: 'Haematology & Oncology Day Treatment', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'jpuh-ward-22', name: 'Ward 22', specialty: 'Elective Orthopaedic', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 24 },
  { id: 'jpuh-ed', name: 'Emergency Department (A&E)', specialty: 'Emergency', kind: 'emergency', wardGroup: 'emergency', simulatedBedCount: 34 },
  { id: 'jpuh-eadu', name: 'EADU', specialty: 'Emergency Assessment & Discharge Unit', kind: 'assessment-unit', wardGroup: 'emergency', simulatedBedCount: 22 },
  { id: 'jpuh-icu-hdu', name: 'ICU/HDU', specialty: 'Intensive Care / High Dependency', kind: 'critical-care', wardGroup: 'critical-care', simulatedBedCount: 16 },
  { id: 'jpuh-charnwood', name: 'Charnwood', specialty: 'Private Patient Suite', kind: 'inpatient-ward', wardGroup: 'other', simulatedBedCount: 12 },
  { id: 'jpuh-cts', name: 'Central Treatment Suite', specialty: 'Central Treatment', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'jpuh-day-care', name: 'Day Care Unit', specialty: 'Day Care', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 18 },
  { id: 'jpuh-theatres', name: 'Theatres & Recovery', specialty: 'Surgery / Recovery', kind: 'theatre', wardGroup: 'theatre', simulatedBedCount: 0 },
  { id: 'jpuh-endoscopy', name: 'Endoscopy', specialty: 'Endoscopy', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'jpuh-renal', name: 'Renal Unit', specialty: 'Renal Services', kind: 'day-unit', wardGroup: 'specialty', simulatedBedCount: 0 },
  { id: 'jpuh-hyperbaric', name: 'Hyperbaric Unit', specialty: 'Hyperbaric Services', kind: 'other', wardGroup: 'specialty', simulatedBedCount: 0 },
  { id: 'jpuh-ambulatory', name: 'Ambulatory', specialty: 'Ambulatory Care', kind: 'assessment-unit', wardGroup: 'medical', simulatedBedCount: 0 }
]);

// Norfolk & Norwich University Hospital — sourced ward set (nnuh.nhs.uk Wards A-Z, July 2026; partial, re-verify).
export const NNUH_WARDS = freezeWards('nnuh', [
  { id: 'nnuh-cley', name: 'Cley Ward', specialty: 'Inpatient (West Block, L3)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-coltishall', name: 'Coltishall Ward', specialty: 'Inpatient (West Block, L2)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-denton', name: 'Denton Ward', specialty: 'Inpatient (Centre Block, L4)', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
  { id: 'nnuh-dilham', name: 'Dilham Ward', specialty: 'Inpatient (Centre Block, L3)', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
  { id: 'nnuh-docking', name: 'Docking Ward', specialty: 'Inpatient (Centre Block, L2)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-earsham', name: 'Earsham Ward', specialty: 'Inpatient (Centre Block, L4)', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
  { id: 'nnuh-easton', name: 'Easton Ward', specialty: 'Emergency Surgical Assessment Unit (Centre Block, L3)', kind: 'assessment-unit', wardGroup: 'surgical', simulatedBedCount: 24 },
  { id: 'nnuh-gissing', name: 'Gissing Ward', specialty: 'Inpatient (Centre Block, L3)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-gunthorpe', name: 'Gunthorpe Ward', specialty: 'Inpatient (East Block)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-kimberley', name: 'Kimberley Ward', specialty: 'Inpatient (East Block, L2)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-langley', name: 'Langley Ward', specialty: 'Inpatient (East Block, L1)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-loddon', name: 'Loddon Ward', specialty: 'Inpatient (East Block, L2)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-mattishall', name: 'Mattishall Ward', specialty: 'Inpatient (East Block, L3)', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-brundall', name: 'Brundall Ward', specialty: 'Inpatient', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-buxton', name: 'Buxton Ward', specialty: 'Inpatient', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-cringleford', name: 'Cringleford Ward', specialty: 'Inpatient', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'nnuh-holt', name: 'Holt Ward', specialty: 'Acute Medical Unit', kind: 'assessment-unit', wardGroup: 'medical', simulatedBedCount: 32 },
  { id: 'nnuh-weybourne', name: 'Weybourne Day Unit', specialty: 'Oncology & Haematology Day Unit', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'nnuh-colney', name: 'Colney Centre', specialty: 'Oncology Outpatients', kind: 'clinic', wardGroup: 'specialty', simulatedBedCount: 0 },
  { id: 'nnuh-critical-care', name: 'Critical Care Complex (ITU/HDU)', specialty: 'Intensive Therapy / High Dependency', kind: 'critical-care', wardGroup: 'critical-care', simulatedBedCount: 28 },
  { id: 'nnuh-nicu', name: 'Neonatal Intensive Care Unit', specialty: 'Neonatal Intensive Care', kind: 'neonatal', wardGroup: 'specialty', simulatedBedCount: 20 }
]);

// Addenbrooke's / Cambridge University Hospitals — sourced ward set (cuh.nhs.uk, July 2026; partial).
export const CUH_WARDS = freezeWards('cuh', [
  { id: 'cuh-a3', name: 'Ward A3', specialty: 'Regional Neurosciences Unit', kind: 'inpatient-ward', wardGroup: 'neurosciences', simulatedBedCount: 26 },
  { id: 'cuh-a4', name: 'Ward A4', specialty: 'Neuromedical / Neurosurgical', kind: 'inpatient-ward', wardGroup: 'neurosciences', simulatedBedCount: 26 },
  { id: 'cuh-a5', name: 'Ward A5', specialty: 'Neurosciences', kind: 'inpatient-ward', wardGroup: 'neurosciences', simulatedBedCount: 26 },
  { id: 'cuh-c4', name: 'Ward C4', specialty: 'Frail & Acute Medicine for the Elderly', kind: 'inpatient-ward', wardGroup: 'frailty', simulatedBedCount: 28 },
  { id: 'cuh-c5', name: 'Ward C5', specialty: 'General Medicine & Nephrology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'cuh-c10', name: 'Ward C10', specialty: 'Haematology & Haematological Oncology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 24 },
  { id: 'cuh-d7', name: 'Ward D7', specialty: 'Diabetes & Endocrinology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'cuh-g2', name: 'Ward G2', specialty: 'General Medicine', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'cuh-g3', name: 'Ward G3', specialty: 'General Medicine', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'cuh-c10-haem2', name: 'Ward U3', specialty: 'Haematology & Oncology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 24 },
  { id: 'cuh-k2', name: 'Ward K2', specialty: 'Cardiac Day Unit', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'cuh-k3', name: 'Ward K3', specialty: 'Cardiology / Coronary Care Unit', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'cuh-l2', name: 'Ward L2', specialty: 'Day Surgery Unit', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'cuh-u2', name: 'Ward U2', specialty: 'Gastroenterology', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
  { id: 'cuh-f5', name: 'Ward F5', specialty: 'Transplant High Dependency', kind: 'critical-care', wardGroup: 'critical-care', simulatedBedCount: 6 },
  { id: 'cuh-g5', name: 'Ward G5', specialty: 'Transplant', kind: 'inpatient-ward', wardGroup: 'specialty', simulatedBedCount: 28 },
  { id: 'cuh-ed', name: 'Emergency Department', specialty: 'Emergency / Major Trauma Centre', kind: 'emergency', wardGroup: 'emergency', simulatedBedCount: 40 },
  { id: 'cuh-critical-care', name: 'Neuro & General Critical Care', specialty: 'Intensive Care', kind: 'critical-care', wardGroup: 'critical-care', simulatedBedCount: 30 }
]);

// Representative functional-unit sets for wider-network district generals
// (real ward proper-names not yet sourced; these are units every acute trust has).
function representativeWards(trustId) {
  return freezeWards(trustId, [
    { id: `${trustId}-ed`, name: 'Emergency Department', specialty: 'Emergency', kind: 'emergency', wardGroup: 'emergency', simulatedBedCount: 30 },
    { id: `${trustId}-amu`, name: 'Acute Medical Unit', specialty: 'Acute Medicine', kind: 'assessment-unit', wardGroup: 'medical', simulatedBedCount: 32 },
    { id: `${trustId}-sau`, name: 'Surgical Assessment Unit', specialty: 'Surgical Assessment', kind: 'assessment-unit', wardGroup: 'surgical', simulatedBedCount: 24 },
    { id: `${trustId}-stroke`, name: 'Stroke Unit', specialty: 'Stroke', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 28 },
    { id: `${trustId}-gen-med`, name: 'General Medical Ward', specialty: 'General Medicine', kind: 'inpatient-ward', wardGroup: 'medical', simulatedBedCount: 30 },
    { id: `${trustId}-surgical`, name: 'General Surgical Ward', specialty: 'General Surgery', kind: 'inpatient-ward', wardGroup: 'surgical', simulatedBedCount: 28 },
    { id: `${trustId}-elderly`, name: "Older People's Medicine Ward", specialty: "Older People's Medicine", kind: 'inpatient-ward', wardGroup: 'frailty', simulatedBedCount: 30 },
    { id: `${trustId}-icu`, name: 'Critical Care Unit', specialty: 'Intensive Care / High Dependency', kind: 'critical-care', wardGroup: 'critical-care', simulatedBedCount: 14 },
    { id: `${trustId}-discharge`, name: 'Discharge Lounge', specialty: 'Discharge', kind: 'assessment-unit', wardGroup: 'medical', simulatedBedCount: 0 }
  ]);
}

export const WSH_WARDS = representativeWards('wsh');
export const ESNEFT_WARDS = representativeWards('esneft');
export const QEH_WARDS = representativeWards('qeh');

export const WARDS_BY_TRUST = Object.freeze({
  jpuh: JPUH_WARDS,
  nnuh: NNUH_WARDS,
  cuh: CUH_WARDS,
  wsh: WSH_WARDS,
  esneft: ESNEFT_WARDS,
  qeh: QEH_WARDS
});

export const ALL_WARDS = Object.freeze([
  ...JPUH_WARDS, ...NNUH_WARDS, ...CUH_WARDS, ...WSH_WARDS, ...ESNEFT_WARDS, ...QEH_WARDS
]);
