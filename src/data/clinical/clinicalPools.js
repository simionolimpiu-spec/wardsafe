// Specialty-appropriate clinical content for the SafeFlow ward simulation.
// SIMULATION-ONLY. UK clinical terminology. Fictional presentations for learning.
// Not a clinical guideline. Not for live clinical use. Human review required.

// Presenting diagnoses grouped by clinical category. British / NHS terminology.
export const DIAGNOSIS_POOLS = Object.freeze({
  cardiology: [
    'NSTEMI', 'STEMI (post-primary PCI)', 'Acute decompensated heart failure',
    'Fast atrial fibrillation', 'Unstable angina', 'Complete heart block',
    'Infective endocarditis', 'Cardiogenic pulmonary oedema'
  ],
  respiratory: [
    'Infective exacerbation of COPD', 'Community-acquired pneumonia', 'Pulmonary embolism',
    'Type 2 respiratory failure', 'Acute severe asthma', 'Pleural effusion for drainage',
    'Aspiration pneumonia', 'Exacerbation of bronchiectasis'
  ],
  stroke: [
    'Acute ischaemic stroke', 'Transient ischaemic attack', 'Intracerebral haemorrhage',
    'Post-thrombolysis monitoring', 'Post-thrombectomy monitoring', 'Cerebellar infarct'
  ],
  gastroenterology: [
    'Upper GI bleed', 'Decompensated chronic liver disease', 'Acute pancreatitis',
    'Inflammatory bowel disease flare', 'Ascites for paracentesis', 'Hepatic encephalopathy'
  ],
  generalMedicine: [
    'Sepsis of unknown source', 'Acute kidney injury', 'Symptomatic hyponatraemia',
    'Lower limb cellulitis', 'Urinary tract infection', 'Community-acquired pneumonia',
    'Decompensated heart failure', 'Diabetic ketoacidosis'
  ],
  elderly: [
    'Hyperactive delirium', 'Recurrent falls', 'Frailty with deconditioning',
    'Aspiration pneumonia', 'Urinary tract infection with delirium', 'Fragility fracture — for rehab',
    'Dehydration and acute kidney injury', 'End-of-life care planning'
  ],
  generalSurgery: [
    'Acute appendicitis', 'Small bowel obstruction', 'Acute cholecystitis',
    'Diverticulitis', 'Post-op emergency laparotomy', 'Incarcerated inguinal hernia',
    'Perforated peptic ulcer', 'Anastomotic leak — for review'
  ],
  orthopaedicsTrauma: [
    'Fractured neck of femur', 'Post-op hemiarthroplasty', 'Ankle fracture (post-ORIF)',
    'Distal radius fracture', 'Periprosthetic fracture', 'Pubic rami fracture — for mobilisation'
  ],
  orthopaedicsElective: [
    'Elective total hip replacement', 'Elective total knee replacement',
    'Revision arthroplasty', 'Elective shoulder replacement', 'Spinal decompression (post-op)'
  ],
  haematologyOncology: [
    'Neutropenic sepsis', 'Newly diagnosed acute myeloid leukaemia', 'Multiple myeloma',
    'Chemotherapy support admission', 'Tumour lysis monitoring', 'Febrile neutropenia'
  ],
  neurosciences: [
    'Subarachnoid haemorrhage', 'Post-craniotomy monitoring', 'Status epilepticus',
    'Guillain-Barre syndrome', 'Traumatic brain injury', 'Bacterial meningitis'
  ],
  criticalCare: [
    'Septic shock — multi-organ support', 'Post-operative ventilation', 'ARDS',
    'Type 1 respiratory failure', 'Post-cardiac-arrest care', 'Diabetic ketoacidosis — level 2'
  ],
  renal: [
    'Acute kidney injury on CKD', 'Fluid overload for dialysis', 'Hyperkalaemia',
    'Peritoneal dialysis peritonitis', 'CKD stage 5 — access planning'
  ],
  diabetesEndocrine: [
    'Diabetic ketoacidosis', 'Hyperosmolar hyperglycaemic state', 'Severe hypoglycaemia',
    'Diabetic foot sepsis', 'Addisonian crisis', 'Thyroid storm'
  ],
  maternity: [
    'Postnatal recovery', 'Pre-eclampsia monitoring', 'Postpartum haemorrhage (stabilised)',
    'Antenatal admission — reduced fetal movements', 'Post-caesarean recovery'
  ],
  neonatal: [
    'Prematurity — respiratory support', 'Neonatal jaundice', 'Suspected early-onset sepsis',
    'Low birth weight — feeding support', 'Transient tachypnoea of the newborn'
  ],
  paediatrics: [
    'Bronchiolitis', 'Acute asthma', 'Gastroenteritis with dehydration',
    'Febrile convulsion', 'Tonsillitis for IV antibiotics', 'Newly diagnosed type 1 diabetes'
  ],
  dayCare: [
    'Day-case infusion', 'Blood transfusion', 'Iron infusion',
    'Elective cardioversion', 'Minor procedure recovery'
  ],
  general: [
    'Sepsis of unknown source', 'Acute kidney injury', 'Community-acquired pneumonia',
    'Falls with reduced mobility', 'Electrolyte disturbance', 'Cellulitis'
  ]
});

export const COMORBIDITIES = Object.freeze([
  'Type 2 diabetes', 'Hypertension', 'COPD', 'Atrial fibrillation', 'Chronic kidney disease',
  'Ischaemic heart disease', 'Osteoarthritis', 'Hypothyroidism', 'Previous stroke',
  'Dementia', 'Parkinson’s disease', 'Heart failure', 'Asthma', 'Depression'
]);

export const ALLERGENS = Object.freeze([
  'Penicillin', 'No known drug allergies', 'Aspirin', 'Codeine', 'Latex',
  'Contrast media', 'Morphine', 'Sulfonamides'
]);

export const ADMISSION_SOURCES = Object.freeze([
  'Emergency Department', 'GP referral', 'Acute Medical Unit', 'Same-day emergency care',
  'Interhospital transfer', 'Elective admission', 'Ambulance conveyance', 'Outpatient clinic'
]);

// Clinical review domains shown as slices in the patient RAG donut.
// weight = relative slice size so the donut reads like a real infographic, not equal wedges.
export const CARE_DOMAINS = Object.freeze([
  { key: 'observations', label: 'Observations & NEWS2', weight: 28,
    note: 'Vital signs currency and escalation status' },
  { key: 'medications', label: 'Medications', weight: 18,
    note: 'Drug chart, high-risk medicines and omitted doses' },
  { key: 'fluidsNutrition', label: 'Fluids & nutrition', weight: 14,
    note: 'Fluid balance, hydration and MUST screening' },
  { key: 'riskAssessments', label: 'Risk assessments', weight: 18,
    note: 'Falls, VTE, pressure area and sepsis screening' },
  { key: 'documentation', label: 'Documentation', weight: 12,
    note: 'Care plan, review entries and SBAR currency' },
  { key: 'discharge', label: 'Discharge readiness', weight: 10,
    note: 'Discharge planning and outstanding blockers' }
]);
