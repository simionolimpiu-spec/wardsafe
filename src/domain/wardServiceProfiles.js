import { SERVICE_DEFINITIONS, assumption, unconfirmed } from '../data/clinical/serviceDefinitions.js';

// Ranges below are fictional scenario controls, not measured activity, staffing ratios or capacity advice.
export function categoryForWard(ward) {
  const explicit = ward.serviceDefinition?.category ?? SERVICE_DEFINITIONS[ward.id]?.category;
  if (explicit) return explicit;
  const text = `${ward.specialty ?? ''} ${ward.name ?? ''}`.toLowerCase();
  const has = (...terms) => terms.some((term) => text.includes(term));
  if (ward.id === 'jpuh-day-care') return 'daySurgery';
  if (ward.kind === 'neonatal' || has('neonatal')) return 'neonatal';
  if (ward.kind === 'paediatrics' || has('paediatr', 'children')) return 'paediatrics';
  if (ward.kind === 'maternity' || has('maternity', 'antenatal', 'delivery')) return 'maternity';
  if (has('ophthalm', 'eye ')) return 'ophthalmology';
  if (has('endoscopy')) return 'endoscopy';
  if (ward.kind === 'day-unit' && has('oncology', 'haemat')) return 'oncologyDay';
  if (ward.kind === 'day-unit' && has('renal', 'dialysis')) return 'dialysis';
  if (ward.kind === 'critical-care' || has('intensive', 'critical', 'hdu')) return 'criticalCare';
  if (has('stroke')) return 'stroke';
  if (has('neuro')) return 'neurosciences';
  if (has('cardio', 'coronary')) return 'cardiology';
  if (has('respiratory')) return 'respiratory';
  if (has('gastro')) return 'gastroenterology';
  if (has('haemat', 'oncology')) return 'haematologyOncology';
  if (has('renal', 'nephro', 'kidney')) return 'renal';
  if (has('diabet', 'endocrin')) return 'diabetesEndocrine';
  if (has('older', 'elderly', 'frail', 'geriatric')) return 'elderly';
  if (has('ortho', 'trauma')) return has('elective') ? 'orthopaedicsElective' : 'orthopaedicsTrauma';
  if (ward.kind === 'emergency') return 'emergency';
  if (has('surg')) return 'generalSurgery';
  if (has('medical', 'medicine', 'assessment', 'ambulatory')) return 'generalMedicine';
  return 'unconfirmed';
}
const ranges = {
  transplant: { stay: [1, 18], news: [0, 7], occupancy: [50, 90], focus: 'Transplant-team review, specialist monitoring documentation and step-down handover' },
  stroke: { stay: [2, 24], news: [0, 5], occupancy: [70, 98], focus: 'Neurological observations, swallowing, mobility and rehabilitation handover' },
  cardiology: { stay: [0, 8], news: [0, 6], occupancy: [65, 96], focus: 'Cardiac monitoring, investigation status and specialist review' },
  respiratory: { stay: [1, 12], news: [1, 7], occupancy: [75, 98], focus: 'Respiratory observations, documented oxygen plan and discharge support' },
  elderly: { stay: [3, 28], news: [0, 5], occupancy: [80, 99], focus: 'Frailty, cognition, mobility, therapy and supported discharge' },
  generalSurgery: { stay: [0, 9], news: [0, 7], occupancy: [65, 96], focus: 'Surgical review, procedure stage, wound review and post-operative handover' },
  orthopaedicsElective: { stay: [0, 4], news: [0, 3], occupancy: [50, 95], focus: 'Planned surgery, mobilisation, therapy review and discharge arrangements' },
  orthopaedicsTrauma: { stay: [1, 14], news: [0, 5], occupancy: [70, 98], focus: 'Injury pathway, surgery status, mobility and rehabilitation' },
  criticalCare: { stay: [1, 16], news: [4, 11], occupancy: [45, 92], focus: 'Documented organ-support level, specialist review and step-down handover' },
  neonatal: { stay: [1, 24], news: null, occupancy: [40, 90], focus: 'Neonatal feeding, temperature, respiratory support and network transfer documentation' },
  paediatrics: { stay: [0, 5], news: null, occupancy: [35, 90], focus: 'Age-specific observations, family support and paediatric review' },
  maternity: { stay: [0, 4], news: null, occupancy: [40, 95], focus: 'Maternity-specific observations, birth/recovery stage and parent/baby handover' },
  dialysis: { stay: [0, 0], news: [0, 2], occupancy: [0, 0], focus: 'Booked dialysis session, access review and attendance completion' },
  oncologyDay: { stay: [0, 0], news: [0, 2], occupancy: [0, 0], focus: 'Scheduled oncology/haematology attendance, review and treatment documentation' },
  ophthalmology: { stay: [0, 0], news: [0, 2], occupancy: [0, 0], focus: 'Eye-procedure attendance, recovery and discharge instructions' },
  endoscopy: { stay: [0, 0], news: [0, 2], occupancy: [0, 0], focus: 'Booked endoscopic procedure, recovery and discharge documentation' },
  daySurgery: { stay: [0, 0], news: [0, 2], occupancy: [0, 0], focus: 'Booking, arrival, theatre, recovery, discharge or documented inpatient transfer' }
};
const reviewTopics = {
  neonatal: ['Neonatal observations', 'Feeding and temperature record', 'Family and neonatal-network handover'],
  paediatrics: ['Age-specific observations', 'Family communication', 'Paediatric review record'],
  maternity: ['Maternity observations', 'Birth or recovery stage', 'Parent and baby handover'],
  transplant: ['Transplant-team review record', 'Specialist monitoring record', 'Step-down handover'],
  neurosciences: ['Neurological review record', 'Specialist monitoring record', 'Rehabilitation handover'],
  dialysis: ['Dialysis attendance', 'Access review record', 'Session completion'],
  oncologyDay: ['Treatment attendance record', 'Specialist review record', 'Session handover'],
  electiveAdmissions: ['Planned admission record', 'Receiving ward confirmation'],
  dischargeLounge: ['Discharge documentation', 'Transport and onward-care arrangements']
};

// A ward's supported levels are capabilities, not a level assigned to every patient.
// No adult care-level number is inferred for children, neonates, maternity or day pathways.
export function documentationFor(profile, patientCareLevel = null) {
  if (patientCareLevel !== null && !profile.supportedCareLevels.includes(patientCareLevel)) return [];
  if (['admission-area', 'discharge-lounge', 'procedure-area'].includes(profile.mode)) {
    return profile.mode === 'procedure-area' ? ['Originating pathway and procedure record']
      : reviewTopics[profile.mode === 'admission-area' ? 'electiveAdmissions' : 'dischargeLounge'];
  }
  const topics = reviewTopics[profile.category] ?? [profile.focus];
  return [...topics, ...(patientCareLevel === 2 ? ['Documented level 2 care and specialist handover']
    : patientCareLevel === 3 ? ['Documented level 3 care and organ-support record'] : [])];
}

function rangeOverride(value, fallback, label, bounds = [0, Infinity]) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length !== 2 || value.some((n) => !Number.isFinite(n))
    || value[0] < bounds[0] || value[1] > bounds[1] || value[0] > value[1]) throw new Error(`Invalid simulation ${label} range`);
  return [...value];
}

export function serviceProfile(ward) {
  const inherited = SERVICE_DEFINITIONS[ward.id] ?? {};
  const definition = { ...inherited, ...ward.serviceDefinition,
    simulation: { ...inherited.simulation, ...ward.serviceDefinition?.simulation } };
  const category = categoryForWard(ward);
  const missingAssignment = category === 'unconfirmed' || (!definition.category && /^Inpatient\b/i.test(ward.specialty ?? ''));
  const shortStay = ward.kind === 'assessment-unit' || ward.kind === 'emergency';
  const mode = ward.id === 'jpuh-day-care' ? 'day-surgery' : ['day-unit', 'clinic'].includes(ward.kind) ? 'session'
    : shortStay ? 'assessment' : ward.kind === 'theatre' ? 'procedure-area' : 'inpatient';
  const profile = { category, mode, canPopulate: !missingAssignment,
    ...(ranges[category] ?? { stay: shortStay ? [0, 1] : [1, 10], news: [0, 7], occupancy: [55, 97], focus: 'Specialty review, investigation status and next care destination' }),
    ...(shortStay ? { stay: [0, 1] } : {}),
    observationScale: category === 'neonatal' ? 'Neonatal observations' : category === 'paediatrics' ? 'Paediatric observations' : category === 'maternity' ? 'Maternity observations' : 'NEWS2',
    evidence: missingAssignment ? 'Service assignment requires local confirmation; no patient mix generated.'
      : mode === 'procedure-area' ? 'Shared procedure area. Patients remain attached to their originating pathway; no separate census is invented.' : 'Specialty-based fictional scenario; workload and staffing are illustrative.',
    capacity: ward.id === 'jpuh-day-care' ? 20 : ward.id === 'jpuh-renal' ? 18 : ward.id === 'jpuh-icu-hdu' ? 12 : ward.simulatedBedCount || null,
    capacityLabel: ward.id === 'jpuh-day-care' ? 'published day beds' : ward.id === 'jpuh-renal' ? 'published dialysis machines'
      : ward.id === 'jpuh-icu-hdu' ? 'beds in 2025 Trust leaflet' : mode === 'assessment' ? 'simulated assessment spaces' : mode === 'inpatient' ? 'simulated beds (not verified capacity)' : 'capacity not verified',
    source: ward.id === 'jpuh-day-care' ? 'https://www.jpaget.nhs.uk/departments/day-care-unit/'
      : ward.id === 'jpuh-renal' ? 'https://www.jpaget.nhs.uk/departments/renal-unit/'
      : ward.id === 'jpuh-neonatal' ? 'https://www.jpaget.nhs.uk/departments/neonatal-unit/'
      : ward.id === 'jpuh-icu-hdu' ? 'https://www.jpaget.nhs.uk/media/arxa4uxj/visiting-the-intensive-care-unit-and-high-dependency-unit.pdf' : null
  };
  profile.mode = definition.serviceType ?? profile.mode;
  if (!['day-surgery', 'session', 'assessment', 'procedure-area', 'inpatient', 'admission-area', 'discharge-lounge'].includes(profile.mode)) throw new Error('Invalid service type');
  // Only this unit has a configured dated procedure catalogue.
  if (profile.mode === 'day-surgery' && ward.id !== 'jpuh-day-care') profile.canPopulate = false;
  const settings = definition.simulation ?? {};
  profile.stay = rangeOverride(settings.stayDays, profile.stay, 'stay');
  profile.occupancy = rangeOverride(settings.occupancyPercent, profile.occupancy, 'occupancy', [0, 100]);
  profile.attendances = rangeOverride(settings.attendances, category === 'dialysis' ? [8, 18] : [8, 22], 'attendance');
  profile.staffNurses = rangeOverride(settings.staffNurses, category === 'criticalCare' ? [8, 12]
    : profile.mode !== 'inpatient' ? [3, 6] : [4, 7], 'staff', [1, 100]);
  if (['admission-area', 'discharge-lounge'].includes(profile.mode)) {
    if (settings.stayDays?.some((days) => days !== 0)) throw new Error('Invalid simulation stay range for a same-day area');
    profile.stay = [0, 0];
    profile.focus = reviewTopics[profile.mode === 'admission-area' ? 'electiveAdmissions' : 'dischargeLounge'].join(', ');
  }
  profile.supportedCareLevels = definition.supportedCareLevels ?? (category === 'criticalCare' ? [2, 3]
    : profile.mode === 'inpatient' && !['neonatal', 'paediatrics', 'maternity'].includes(category) ? [0, 1] : []);
  if (!Array.isArray(profile.supportedCareLevels) || profile.supportedCareLevels.some((level) => ![0, 1, 2, 3].includes(level))) throw new Error('Invalid supported care levels');
  if (new Set(profile.supportedCareLevels).size !== profile.supportedCareLevels.length) throw new Error('Duplicate supported care levels');
  if (['neonatal', 'paediatrics', 'maternity'].includes(category) && profile.supportedCareLevels.length) throw new Error('Adult care levels are not modelled for this service');
  if (['admission-area', 'discharge-lounge', 'procedure-area', 'day-surgery', 'session'].includes(profile.mode)
    && profile.supportedCareLevels.some((level) => level > 1)) throw new Error('Critical-care levels are not modelled for this workflow');
  const levels = profile.supportedCareLevels;
  const defaultShare = levels.length === 2 && levels.includes(0) && levels.includes(1) ? { 0: 0.9, 1: 0.1 }
    : Object.fromEntries(levels.map((level) => [level, 1 / levels.length]));
  profile.careLevelShare = settings.careLevelShare ?? defaultShare;
  const shares = Object.entries(profile.careLevelShare);
  if (shares.length !== levels.length || shares.some(([key, value]) => !levels.includes(Number(key)) || String(Number(key)) !== key || !Number.isFinite(value) || value < 0 || value > 1)
    || (levels.length && Math.abs(shares.reduce((sum, [, value]) => sum + value, 0) - 1) > 1e-9)) throw new Error('Invalid simulation care level shares');
  const capacity = definition.capacity ?? assumption(profile.capacity, profile.capacityLabel);
  if (capacity.value !== null && (!Number.isInteger(capacity.value) || capacity.value < 0)) throw new Error('Invalid service capacity');
  profile.capacity = ['conflicting', 'source-pending'].includes(capacity.status) ? null : capacity.value;
  profile.fieldEvidence = {
    assignment: definition.assignment ?? unconfirmed(category, 'Service inferred from the legacy directory; requires local confirmation.'),
    capacity,
    ...(definition.sameDayOnly ? { sameDayOnly: definition.sameDayOnly } : {}),
    careLevels: assumption(profile.supportedCareLevels, 'Supported levels in this demo; individual patient level is recorded separately. No staffing recommendation.'),
    careLevelShare: assumption(profile.careLevelShare, 'Fictional occupied-patient mix; not inferred from published bed configuration.'),
    serviceType: assumption(profile.mode, 'Demo workflow assignment; current local operation requires confirmation.'),
    stayDays: assumption(profile.stay), occupancyPercent: assumption(profile.occupancy),
    attendances: assumption(profile.attendances, 'Synthetic session attendance range; not a daily inpatient admission rate or measured throughput.'),
    staffNurses: assumption(profile.staffNurses, 'Illustrative roster range; not the actual establishment or a safe-staffing ratio.')
  };
  if (definition.capacity) {
    profile.capacityLabel = `${capacity.status === 'published' ? 'published' : 'modelled'} ${category === 'dialysis' ? 'dialysis machines' : profile.mode === 'day-surgery' ? 'day beds' : 'beds'}`;
    profile.source = capacity.source;
    if (['conflicting', 'source-pending'].includes(capacity.status)) profile.capacityLabel = 'capacity awaiting source review';
  }
  profile.documentationTopics = documentationFor(profile);
  return profile;
}
