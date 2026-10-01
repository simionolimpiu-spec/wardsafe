// Public service evidence checked 2026-09-09. Procedure names only; no care instructions.
export const DCU_SOURCE = 'https://www.jpaget.nhs.uk/departments/day-care-unit/';
export const DCU_LEAFLETS = 'https://www.jpaget.nhs.uk/patients-visitors/information-leaflets-a-z/';
export const DCU_SPECIALTIES = ['Gynaecology', 'Urology', 'Orthopaedics', 'ENT', 'Dental', 'Pain', 'Ophthalmology'];

// The public DCU leaflet index supports these examples, not an exhaustive current booking catalogue.
// Clinic prostate biopsy and flexible cystoscopy may use other locations; do not assign them to DCU automatically.
export const DAY_SURGERY_PROCEDURES = [
  { id: 'hand', label: 'Hand or wrist surgery', specialty: 'Orthopaedics' },
  { id: 'foot', label: 'Foot osteotomy', specialty: 'Orthopaedics' },
  { id: 'dupuytren', label: 'Dupuytren contracture surgery', specialty: 'Orthopaedics' },
  { id: 'knee', label: 'Knee arthroscopy', specialty: 'Orthopaedics' },
  { id: 'holep', label: 'HoLEP', specialty: 'Urology', anatomy: 'prostate' },
  { id: 'cystoscopy', label: 'Cystoscopy', specialty: 'Urology' },
  { id: 'biopsy', label: 'Prostate template biopsy — ward pathway', specialty: 'Urology', anatomy: 'prostate' },
  { id: 'circumcision', label: 'Circumcision', specialty: 'Urology', anatomy: 'male' },
  { id: 'testicular', label: 'Testicular surgery', specialty: 'Urology', anatomy: 'male' },
  { id: 'lletz', label: 'LLETZ', specialty: 'Gynaecology', anatomy: 'cervix' },
  { id: 'hernia', label: 'Hernia repair', specialty: 'General surgery' },
  { id: 'lap-hernia', label: 'Laparoscopic hernia repair', specialty: 'General surgery' },
  { id: 'lap-chole', label: 'Laparoscopic cholecystectomy', specialty: 'General surgery' }
].map((procedure) => Object.freeze({ ...procedure, source: DCU_LEAFLETS, evidence: 'Listed in public DCU patient information; current eligibility and location require local confirmation.' }));

export const DCU_CATALOGUE_REVIEW_NOTES = [
  'ENT, dental, pain and ophthalmology are published DCU specialties; exact current procedures and list locations still require local confirmation.',
  'Flexible cystoscopy and prostate biopsy also appear under other services. Do not infer an exclusive DCU pathway.',
  'The trans-vaginal tape leaflet is historical and is excluded from generated activity pending current local confirmation.',
  'The minor foot/ankle surgery link currently points to the LLETZ PDF; that mismatched link is not used as verified procedure evidence.',
  'Several linked leaflets have elapsed review dates. This catalogue is a service-research aid, not clinical guidance or a complete list of permitted interventions.'
];
