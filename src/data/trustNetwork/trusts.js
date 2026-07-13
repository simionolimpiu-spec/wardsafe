// SafeFlow two-trust simulation network — ward definitions.
//
// SIMULATION-ONLY. The TRUST and WARD names below are real, public NHS ward
// structures used only to make the simulation realistic. All PATIENTS, journeys,
// observations and cues built on top of these wards are entirely FICTIONAL.
// No real patient data. Not for live clinical deployment. Human review required.
//
// Sources (fetched July 2026 — re-verify periodically, ward lists change):
//  - James Paget University Hospital Ward Directory:
//    https://www.jpaget.nhs.uk/contact-us/ward-directory/  (captured in full below)
//  - Norfolk & Norwich University Hospital Wards A-Z:
//    https://www.nnuh.nhs.uk/patients-visitors/wards-a-z/   (sourced subset below)
//
// `simulatedBedCount` is a simulation capacity estimate ONLY — it is NOT a real
// bed number from either trust. `kind`/`wardGroup` are our classification.

export const TRUSTS = Object.freeze([
  Object.freeze({
    id: 'jpuh',
    name: 'James Paget University Hospital',
    shortName: 'James Paget',
    role: 'district general hospital',
    wardSource: 'exact — James Paget Ward Directory (July 2026)',
    simulationOnly: true,
    clinicalUse: 'not for live clinical deployment'
  }),
  Object.freeze({
    id: 'nnuh',
    name: 'Norfolk and Norwich University Hospital',
    shortName: 'Norfolk & Norwich',
    role: 'tertiary teaching hospital',
    wardSource: 'sourced subset — NNUH Wards A-Z (July 2026); re-verify for completeness',
    simulationOnly: true,
    clinicalUse: 'not for live clinical deployment'
  })
]);

// James Paget University Hospital — exact ward directory (July 2026).
export const JPUH_WARDS = Object.freeze([
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
].map((w) => Object.freeze({ ...w, trustId: 'jpuh', simulationOnly: true })));

// Norfolk & Norwich University Hospital — sourced subset (NNUH Wards A-Z, July 2026).
export const NNUH_WARDS = Object.freeze([
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
  { id: 'nnuh-weybourne', name: 'Weybourne Day Unit', specialty: 'Oncology & Haematology Day Unit', kind: 'day-unit', wardGroup: 'day-care', simulatedBedCount: 0 },
  { id: 'nnuh-colney', name: 'Colney Centre', specialty: 'Oncology Outpatients', kind: 'clinic', wardGroup: 'specialty', simulatedBedCount: 0 },
  { id: 'nnuh-critical-care', name: 'Critical Care Complex (ITU/HDU)', specialty: 'Intensive Therapy / High Dependency', kind: 'critical-care', wardGroup: 'critical-care', simulatedBedCount: 28 },
  { id: 'nnuh-nicu', name: 'Neonatal Intensive Care Unit', specialty: 'Neonatal Intensive Care', kind: 'neonatal', wardGroup: 'specialty', simulatedBedCount: 20 }
].map((w) => Object.freeze({ ...w, trustId: 'nnuh', simulationOnly: true })));

export const ALL_WARDS = Object.freeze([...JPUH_WARDS, ...NNUH_WARDS]);
