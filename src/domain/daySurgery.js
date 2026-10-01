import { DAY_SURGERY_PROCEDURES } from '../data/clinical/daySurgeryCatalogue.js';
import { simulationDestination } from '../data/clinical/serviceDefinitions.js';
const CONSULTANT_FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Robin'];
const CONSULTANT_SURNAMES = ['Mercer', 'Hartwell', 'Blythe', 'Whitfield', 'Wren', 'Ainsley', 'Lennox', 'Ashby', 'Fairchild', 'Calder', 'Brook', 'Hawthorne'];
const ANAESTHETISTS = ['Morgan Vale', 'Casey Fenwick', 'Ellis Rowan'];
// Fictional event-duration ranges for varied lists; not clinical benchmarks or booking guidance.
const SIMULATED_MINUTES = { hand: [20, 45], foot: [40, 80], dupuytren: [25, 55], knee: [20, 50],
  holep: [60, 110], cystoscopy: [10, 25], biopsy: [20, 40], circumcision: [20, 40], testicular: [30, 60],
  lletz: [10, 25], hernia: [30, 60], 'lap-hernia': [40, 80], 'lap-chole': [45, 90] };

export const DEFAULT_ACTIVITY_DATE = '2026-06-17';
export const DAY_SNAPSHOT_MINUTES = 14 * 60;
export function seededRandom(seed) {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
}
export function clockLabel(minutes) {
  if (minutes == null) return 'Not recorded';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
export function durationLabel(minutes) {
  if (minutes == null) return 'Not started';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
export function validActivityDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') && !Number.isNaN(Date.parse(`${date}T12:00:00Z`))
    && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}
export function createDayList(date = DEFAULT_ACTIVITY_DATE) {
  if (!validActivityDate(date)) return [];
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return [];
  const rng = seededRandom(`jpuh-dcu:${date}`);
  const specialties = ['Orthopaedics', 'Urology', 'Gynaecology', 'General surgery'];
  const lists = [];
  for (let list = 0; list < 6; list += 1) {
    const specialty = specialties[Math.floor(rng() * specialties.length)];
    const choices = DAY_SURGERY_PROCEDURES.filter((item) => item.specialty === specialty);
    let count = date === DEFAULT_ACTIVITY_DATE ? 5 : 4 + Math.floor(rng() * 3);
    const afternoon = list >= 3;
    const room = list % 3 + 1;
    const specialtyIndex = specialties.indexOf(specialty);
    const surgeon = `${CONSULTANT_FIRST_NAMES[specialtyIndex]} ${CONSULTANT_SURNAMES[specialtyIndex * 3 + room - 1]} · ${specialty} (fictional)`;
    let cursor = (afternoon ? 13 : 8) * 60;
    const listEnd = afternoon ? 18 * 60 : 12 * 60 + 30;
    const shortest = Math.min(...choices.map((procedure) => SIMULATED_MINUTES[procedure.id][0]));
    count = Math.min(count, Math.floor((listEnd - cursor + 10) / (shortest + 17)));
    for (let slot = 0; slot < count; slot += 1) {
      const available = listEnd - cursor - 7 - (count - slot - 1) * (shortest + 17);
      const fitting = choices.filter((procedure) => SIMULATED_MINUTES[procedure.id][0] <= available);
      const procedure = fitting[Math.floor(rng() * fitting.length)];
      const [minimum, maximum] = SIMULATED_MINUTES[procedure.id];
      const scheduledArrival = (afternoon ? 12 : 7) * 60 + (slot % 3) * 10;
      const arrival = scheduledArrival + Math.floor(rng() * 16);
      const plannedTheatre = cursor;
      const theatre = plannedTheatre + Math.floor(rng() * 8);
      const procedureEnd = theatre + minimum + Math.floor(rng() * (Math.min(maximum, available) - minimum + 1));
      cursor = procedureEnd + 10;
      const recovery = procedureEnd + 5;
      const returnToUnit = recovery + 25 + Math.floor(rng() * 16);
      const cancellation = rng() < 0.05;
      const needsAdmission = !cancellation && rng() < 0.035;
      const destinationType = ['Surgical ward', 'HDU', 'ITU'][Math.floor(rng() * 3)];
      const destination = simulationDestination('jpuh', destinationType === 'Surgical ward' ? 'postoperative-inpatient' : 'adult-critical-care',
        destinationType === 'Surgical ward' ? 'jpuh-ward-9' : 'jpuh-icu-hdu');
      if (!destination) throw new Error('Day surgery demo destination is not configured');
      const departure = cancellation ? arrival + 40 : returnToUnit + 60 + Math.floor(rng() * 61);
      lists.push({ procedure, specialty, consultant: surgeon, anaesthetist: `Dr ${ANAESTHETISTS[room - 1]} (fictional)`,
        list: `${afternoon ? 'PM' : 'AM'} ${room}`, theatreRoom: `Simulation theatre ${room}`,
        scheduledArrival, plannedTheatre, arrival, theatre, procedureEnd, recovery, returnToUnit,
        departure, cancellation, needsAdmission, destinationType,
        destinationWardId: destination.wardId, destinationEvidence: destination.evidence,
        admissionReason: destinationType === 'Surgical ward' ? 'Post-operative recovery prolonged; inpatient observation agreed by the fictional team.' : 'Post-operative complication recorded; critical-care admission agreed by the fictional team.' });
    }
  }
  return lists.sort((a, b) => a.scheduledArrival - b.scheduledArrival || a.plannedTheatre - b.plannedTheatre);
}

// A snapshot exposes only events already reached. Future outcomes are never presented as completed.
export function dayCaseSnapshot(booking, asOf = DAY_SNAPSHOT_MINUTES) {
  const arrived = booking.arrival <= asOf;
  const cancelled = booking.cancellation && arrived;
  const inTheatre = arrived && !cancelled && booking.theatre <= asOf;
  const completed = inTheatre && booking.procedureEnd <= asOf;
  const returned = completed && booking.returnToUnit <= asOf;
  const departed = arrived && booking.departure <= asOf;
  const transfer = completed && booking.needsAdmission;
  const stage = !arrived ? 'Booked' : cancelled ? 'Cancelled' : departed ? (transfer ? 'Transferred' : 'Discharged')
    : returned ? (transfer ? 'Awaiting transfer' : 'Discharge review') : completed ? 'Recovery' : inTheatre ? 'In theatre' : 'Arrived';
  return {
    stage, present: arrived && !departed, scheduledArrival: booking.scheduledArrival, plannedTheatre: booking.plannedTheatre,
    arrival: arrived ? booking.arrival : null, theatre: inTheatre ? booking.theatre : null,
    procedureEnd: completed ? booking.procedureEnd : null, recovery: completed && booking.recovery <= asOf ? booking.recovery : null,
    returnToUnit: returned ? booking.returnToUnit : null, departure: departed ? booking.departure : null,
    stayMinutes: arrived ? Math.min(asOf, booking.departure) - booking.arrival : null,
    operationMinutes: completed ? booking.procedureEnd - booking.theatre : null,
    outcome: cancelled ? 'Cancelled before procedure; rebooking review recorded.' : !completed ? 'Outcome not yet recorded.'
      : transfer ? 'Procedure completed; overnight admission documented.' : 'Procedure completed; recovery review documented.',
    destination: departed ? (transfer ? booking.destinationType : cancelled ? 'Home — cancelled' : 'Home') : transfer ? booking.destinationType : 'Not yet recorded',
    transfer: transfer ? { destination: booking.destinationType, wardId: booking.destinationWardId,
      evidence: booking.destinationEvidence, humanReviewRequired: true,
      reason: booking.admissionReason, status: departed ? 'Completed' : 'Accepted; awaiting movement', time: departed ? booking.departure : null } : null,
    interventions: completed ? ['Recovery observation documented', 'Pain and nausea review documented', ...(returned ? ['Wound/dressing review documented', 'Discharge documentation reviewed'] : [])] : [],
    consultant: booking.consultant, anaesthetist: booking.anaesthetist, specialty: booking.specialty,
    procedure: booking.procedure.label, procedureId: booking.procedure.id, source: booking.procedure.source,
    theatreRoom: booking.theatreRoom, list: booking.list
  };
}
export function dayCaseTotals(patients) {
  const cases = patients.map((patient) => patient.dayCase).filter(Boolean);
  return { booked: cases.length, present: cases.filter((item) => item.present).length,
    discharged: cases.filter((item) => item.stage === 'Discharged').length,
    cancelled: cases.filter((item) => item.stage === 'Cancelled').length,
    transfers: cases.filter((item) => item.transfer).length,
    inTheatre: cases.filter((item) => item.stage === 'In theatre').length,
    recovery: cases.filter((item) => ['Recovery', 'Discharge review'].includes(item.stage)).length };
}
