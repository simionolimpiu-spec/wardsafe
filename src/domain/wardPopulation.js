// Deterministic ward-population generator for the SafeFlow Hospitals & Wards surface.
// SIMULATION-ONLY. Produces fictional patients and staffing from real ward structures.
// Seeded so output is stable across reloads and testable. Human review required.

import {
  FIRST_NAMES_FEMALE, FIRST_NAMES_MALE, SURNAMES,
  STAFF_FIRST_NAMES, STAFF_SURNAMES
} from '../data/clinical/nameBank.js';
import {
  DIAGNOSIS_POOLS, COMORBIDITIES, ALLERGENS, ADMISSION_SOURCES, CARE_DOMAINS
} from '../data/clinical/clinicalPools.js';
import { FEATURED_HOSPITALS } from '../data/clinical/selectedHospitals.js';
import { categoryForWard, serviceProfile, documentationFor } from './wardServiceProfiles.js';
import { HOSPITAL_CAPABILITIES } from '../data/clinical/serviceDefinitions.js';
import { createDayList, dayCaseSnapshot, dayCaseTotals, DEFAULT_ACTIVITY_DATE } from './daySurgery.js';

// --- Seeded pseudo-random number generator (deterministic) -------------------
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seedText) {
  return mulberry32(hashString(seedText));
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// --- Clinical category resolution -------------------------------------------
export function resolveClinicalCategory(ward) {
  return categoryForWard(ward);
}

function ageRangeForCategory(category) {
  switch (category) {
    case 'daySurgery': return [18, 88];
    case 'elderly': return [72, 97];
    case 'paediatrics': return [1, 15];
    case 'neonatal': return [0, 0];
    case 'maternity': return [18, 42];
    case 'orthopaedicsElective': return [52, 84];
    case 'criticalCare': return [38, 88];
    default: return [34, 92];
  }
}

// --- NEWS2 and RAG ----------------------------------------------------------
function generateNews2(rng) {
  const r = rng();
  if (r < 0.45) return randInt(rng, 0, 2);
  if (r < 0.75) return randInt(rng, 3, 4);
  if (r < 0.93) return randInt(rng, 5, 6);
  return randInt(rng, 7, 11);
}

function acuityTier(news2) {
  if (news2 >= 6) return 2;
  if (news2 >= 3) return 1;
  return 0;
}

export function observationsRag(news2) {
  if (news2 >= 7) return 'red';
  if (news2 >= 5) return 'amber';
  return 'green';
}

function domainRag(rng, tier) {
  const r = rng();
  if (tier === 2) return r < 0.35 ? 'red' : r < 0.7 ? 'amber' : 'green';
  if (tier === 1) return r < 0.14 ? 'red' : r < 0.48 ? 'amber' : 'green';
  return r < 0.04 ? 'red' : r < 0.22 ? 'amber' : 'green';
}

function buildCareDomains(rng, news2) {
  const tier = acuityTier(news2);
  const domains = {};
  for (const domain of CARE_DOMAINS) {
    domains[domain.key] = domain.key === 'observations' ? observationsRag(news2) : domainRag(rng, tier);
  }
  return domains;
}

export function overallRag(news2, careDomains) {
  const values = Object.values(careDomains);
  const redCount = values.filter((value) => value === 'red').length;
  const amberCount = values.filter((value) => value === 'amber').length;
  if (news2 >= 7 || redCount >= 2) return 'red';
  if (news2 >= 5 || redCount >= 1 || amberCount >= 2) return 'amber';
  return 'green';
}

// --- Names ------------------------------------------------------------------
function makeNameDrawer(rng, firstList, surnameList) {
  const used = new Set();
  return function draw(sex) {
    const forenames = sex === 'male' ? firstList.male : firstList.female;
    let name;
    let guard = 0;
    do {
      name = `${pick(rng, forenames)} ${pick(rng, surnameList)}`;
      guard += 1;
    } while (used.has(name) && guard < 40);
    used.add(name);
    return name;
  };
}

function drawStaffName(rng, used) {
  let name;
  let guard = 0;
  do {
    name = `${pick(rng, STAFF_FIRST_NAMES)} ${pick(rng, STAFF_SURNAMES)}`;
    guard += 1;
  } while (used.has(name) && guard < 40);
  used.add(name);
  return name;
}

// --- Staffing ---------------------------------------------------------------
export function generateStaffing(ward, hospitalId) {
  const rng = makeRng(`staff:${hospitalId}:${ward.id}`);
  const used = new Set();
  const profile = serviceProfile(ward);
  const staffNurseCount = randInt(rng, ...profile.staffNurses);
  const sisterBand = ward.simulatedBedCount >= 28 ? '7' : '6';

  const staffNurses = [];
  for (let i = 0; i < staffNurseCount; i += 1) {
    staffNurses.push({ name: drawStaffName(rng, used), role: 'Staff Nurse', band: '5' });
  }

  return {
    matron: { name: drawStaffName(rng, used), role: 'Matron', band: '8a' },
    sister: { name: drawStaffName(rng, used), role: 'Ward Sister / Charge Nurse', band: sisterBand },
    inCharge: { name: drawStaffName(rng, used), role: 'Nurse in charge (shift lead)', band: '6' },
    staffNurses,
    healthcareAssistants: [
      { name: drawStaffName(rng, used), role: 'Healthcare Assistant', band: '3' },
      { name: drawStaffName(rng, used), role: 'Healthcare Assistant', band: '2' }
    ]
  };
}

// --- Patients ---------------------------------------------------------------
function generatePatient({ ward, category, index, rng, drawName, staffNurses, booking, date }) {
  const profile = serviceProfile(ward);
  const sex = category === 'maternity' || booking?.procedure.anatomy === 'cervix' ? 'female'
    : ['male', 'prostate'].includes(booking?.procedure.anatomy) ? 'male' : rng() < 0.5 ? 'male' : 'female';
  let name;
  if (category === 'neonatal') name = `Baby ${pick(rng, SURNAMES)}`;
  else name = drawName(sex);

  const [ageMin, ageMax] = ageRangeForCategory(category);
  const age = randInt(rng, ageMin, ageMax);
  const sessionPools = { dialysis: ['Scheduled haemodialysis attendance', 'Dialysis session and access review'],
    oncologyDay: ['Scheduled haematology day treatment', 'Scheduled oncology attendance'],
    ophthalmology: ['Planned eye-procedure attendance'], endoscopy: ['Booked gastroscopy', 'Booked colonoscopy'] };
  const pool = category === 'transplant' ? ['Post-transplant specialist review', 'Transplant pathway monitoring and handover']
    : ['admission-area', 'discharge-lounge'].includes(profile.mode) ? [profile.focus]
    : sessionPools[category] ?? DIAGNOSIS_POOLS[category] ?? DIAGNOSIS_POOLS.general;
  const diagnosis = booking ? booking.procedure.label : ward.id === 'jpuh-anc' ? 'Scheduled antenatal review'
    : ward.id === 'jpuh-cds' ? pick(rng, ['Labour care', 'Immediate post-birth observation', 'Planned birth admission']) : pick(rng, pool);

  const comorbidityCount = age < 16 ? 0 : age >= 70 ? randInt(rng, 1, 3) : randInt(rng, 0, 2);
  const comorbidities = [];
  const seenComorbidity = new Set();
  for (let i = 0; i < comorbidityCount; i += 1) {
    const item = pick(rng, COMORBIDITIES);
    if (!seenComorbidity.has(item)) { seenComorbidity.add(item); comorbidities.push(item); }
  }

  const dayCase = booking ? { ...dayCaseSnapshot(booking), date } : null;
  const news2 = profile.news === null || dayCase?.stage === 'Booked' ? null : randInt(rng, ...(profile.news ?? [0, 7]));
  const careDomains = buildCareDomains(rng, news2);
  if (news2 === null) careDomains.observations = 'unknown';
  const rag = news2 === null ? 'unknown' : overallRag(news2, careDomains);
  const responsibleNurse = staffNurses.length
    ? staffNurses[index % staffNurses.length].name
    : 'Unassigned';

  return {
    id: `${ward.id}${booking ? `-${date}` : ''}-p${index + 1}`,
    name,
    sex,
    age,
    bed: dayCase ? (dayCase.present ? 'Day pathway' : 'Not in unit') : profile.mode === 'session' ? `Attendance ${index + 1}` : `Bed ${index + 1}`,
    diagnosis,
    comorbidities,
    allergy: pick(rng, ALLERGENS),
    admissionSource: profile.mode !== 'inpatient' || category === 'orthopaedicsElective' ? 'Booked attendance'
      : category === 'neonatal' ? 'Delivery suite / neonatal transfer' : category === 'maternity' ? 'Maternity pathway' : pick(rng, ADMISSION_SOURCES.filter((source) => source !== 'Elective admission')),
    lengthOfStayDays: randInt(rng, ...profile.stay),
    observationScale: profile.observationScale,
    ...(category === 'neonatal' ? { ageLabel: `${randInt(rng, 1, 27)} days`, gestationWeeks: randInt(rng, 31, 39) } : {}),
    ...(dayCase ? { dayCase } : {}),
    news2,
    careDomains,
    rag,
    responsibleNurse,
    ...patientServiceRecord(profile, `${ward.id}:${date}:${index}`),
    ...(category === 'criticalCare' ? { diagnosis: 'Fictional critical-care review and specialist handover' } : {})
  };
}

export function patientServiceRecord(profile, seed, recordedLevel) {
  const rng = makeRng(`care-record:${seed}`); // Separate stream preserves existing patient identities and timings.
  const draw = rng();
  let cumulative = 0;
  const sampled = profile.supportedCareLevels.find((level) => {
    cumulative += profile.careLevelShare[level];
    return draw < cumulative;
  }) ?? null;
  const level = recordedLevel === undefined ? sampled : recordedLevel;
  if (level !== null && !profile.supportedCareLevels.includes(level)) throw new Error('Patient care level exceeds the modelled service capability');
  return { simulatedCareLevel: level, documentationTopics: documentationFor(profile, level),
    serviceRecordEvidence: { status: 'simulation-assumption', note: 'Fictional scenario record for structured review support. Human review required.' } };
}

// --- Ward and hospital assembly ---------------------------------------------
export function ragSummaryOf(patients) {
  return {
    red: patients.filter((p) => p.rag === 'red').length,
    amber: patients.filter((p) => p.rag === 'amber').length,
    green: patients.filter((p) => p.rag === 'green').length,
    unknown: patients.filter((p) => !['red', 'amber', 'green'].includes(p.rag)).length,
    highNews2: patients.filter((p) => p.news2 >= 5).length
  };
}

export function generateWard(ward, hospitalId, date = DEFAULT_ACTIVITY_DATE) {
  const staffing = generateStaffing(ward, hospitalId);
  const rng = makeRng(`patients:${hospitalId}:${ward.id}:${date}`);
  const profile = serviceProfile(ward);
  const category = resolveClinicalCategory(ward);
  const beds = profile.capacity;
  const occupancyRate = ['inpatient', 'assessment', 'admission-area', 'discharge-lounge'].includes(profile.mode) && beds ? randInt(rng, ...profile.occupancy) : null;
  const bookings = profile.mode === 'day-surgery' && profile.canPopulate ? createDayList(date) : null;
  const patientCount = !profile.canPopulate ? 0 : bookings ? bookings.length
    : profile.mode === 'session' || (profile.mode === 'assessment' && !beds) ? randInt(rng, ...profile.attendances)
    : beds ? Math.min(beds, Math.round((beds * occupancyRate) / 100)) : 0;
  const drawName = makeNameDrawer(
    rng,
    { male: FIRST_NAMES_MALE, female: FIRST_NAMES_FEMALE },
    SURNAMES
  );

  const patients = [];
  for (let i = 0; i < patientCount; i += 1) {
    patients.push(generatePatient({ ward, category, index: i, rng, drawName, staffNurses: staffing.staffNurses, booking: bookings?.[i], date }));
  }

  return {
    id: ward.id,
    name: ward.name,
    specialty: ward.specialty,
    wardGroup: ward.wardGroup,
    kind: ward.kind,
    category,
    profile, activityDate: date, dayTotals: bookings ? dayCaseTotals(patients) : null,
    bedCount: beds,
    patientCount,
    occupancyRate,
    staffing,
    patients,
    ragSummary: ragSummaryOf(patients)
  };
}

const cache = new Map();

export function getPopulatedHospitals(date = DEFAULT_ACTIVITY_DATE) {
  if (cache.has(date)) return cache.get(date);
  const result = FEATURED_HOSPITALS.map((hospital) => {
    const wards = hospital.wards.map((ward) => generateWard(ward, hospital.id, date));
    const dayUnit = wards.find((ward) => ward.id === 'jpuh-day-care');
    // Completed moves keep the same patient identity at the receiving service.
    // The source day list remains an activity log, not a second occupied inpatient bed.
    const transferred = dayUnit?.patients.filter((patient) => patient.dayCase?.stage === 'Transferred') ?? [];
    for (const receivingWard of wards) {
      const incoming = transferred.filter((patient) => patient.dayCase.transfer.wardId === receivingWard.id);
      if (!incoming.length) continue;
      const retained = receivingWard.patients.slice(0, Math.max(0, (receivingWard.bedCount ?? 0) - incoming.length));
      receivingWard.patients = [...retained, ...incoming.map((patient, index) => ({ ...patient,
        bed: `Bed ${retained.length + index + 1}`, admissionSource: 'Transfer from Day Care Unit', lengthOfStayDays: 0,
        diagnosis: `${patient.dayCase.procedure}: ${patient.dayCase.transfer.reason}`,
        careLevel: patient.dayCase.transfer.destination, transferFrom: 'jpuh-day-care',
        responsibleNurse: receivingWard.staffing.staffNurses[(retained.length + index) % receivingWard.staffing.staffNurses.length]?.name ?? 'Unassigned',
        ...patientServiceRecord(receivingWard.profile, patient.id, patient.dayCase.transfer.destination === 'HDU' ? 2 : patient.dayCase.transfer.destination === 'ITU' ? 3 : undefined)
      }))];
      receivingWard.patientCount = receivingWard.patients.length;
      receivingWard.occupancyRate = Math.round(receivingWard.patientCount / receivingWard.bedCount * 100);
      receivingWard.ragSummary = ragSummaryOf(receivingWard.patients);
    }
    const patientTotal = wards.reduce((sum, ward) => sum + ward.patientCount, 0);
    const inpatientWards = wards.filter((ward) => ward.profile.mode === 'inpatient');
    const bedTotal = inpatientWards.reduce((sum, ward) => sum + (ward.bedCount ?? 0), 0);
    const inpatientTotal = inpatientWards.reduce((sum, ward) => sum + ward.patientCount, 0);
    const rag = {
      red: wards.reduce((s, w) => s + w.ragSummary.red, 0),
      amber: wards.reduce((s, w) => s + w.ragSummary.amber, 0),
      green: wards.reduce((s, w) => s + w.ragSummary.green, 0)
    };
    return {
      id: hospital.id,
      name: hospital.name,
      shortName: hospital.shortName,
      region: hospital.region,
      role: hospital.role,
      capabilities: HOSPITAL_CAPABILITIES[hospital.id],
      wardCount: wards.length,
      bedTotal,
      patientTotal,
      occupancyRate: bedTotal ? Math.round((inpatientTotal / bedTotal) * 100) : 0,
      ragSummary: rag,
      inpatientTotal: wards.filter((ward) => ward.profile.mode === 'inpatient').reduce((sum, ward) => sum + ward.patientCount, 0),
      dayActivityTotal: wards.filter((ward) => ['session', 'day-surgery'].includes(ward.profile.mode)).reduce((sum, ward) => sum + ward.patientCount, 0),
      assessmentTotal: wards.filter((ward) => ward.profile.mode === 'assessment').reduce((sum, ward) => sum + ward.patientCount, 0),
      wards
    };
  });
  if (cache.size >= 14) cache.delete(cache.keys().next().value);
  cache.set(date, result);
  return result;
}

export function getPopulatedHospital(id, date = DEFAULT_ACTIVITY_DATE) {
  return getPopulatedHospitals(date).find((hospital) => hospital.id === id) ?? null;
}
