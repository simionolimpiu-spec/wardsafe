// Deterministic fictional observation timelines for trust-network patients.
// SIMULATION-ONLY. Fictional values derived deterministically from the patient id.
// No real patient data. Not clinically validated. Human review required. The trend
// note is review-support framing only — it is not a clinical score or an instruction.

const OBS_POINTS = 4; // sequential fictional observation sets per patient
const CONSCIOUSNESS = ['Alert', 'Alert', 'Alert', 'New confusion (review)'];

// Small deterministic hash so the same patient always gets the same timeline.
export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function pick(seed, lo, hi) {
  return lo + (seed % (hi - lo + 1));
}

// A fictional review theme -> whether the sequence drifts (for an explainable cue).
function drifts(reviewTheme) {
  return /observation trend|escalation readiness/i.test(reviewTheme ?? '');
}

export function buildPatientTimeline(patient) {
  if (!patient || !patient.id) return null;
  const seed = hashSeed(patient.id);
  const drift = drifts(patient.reviewTheme);

  const baseResp = pick(seed, 14, 18);
  const baseSpo2 = pick(seed >> 2, 95, 99);
  const baseHr = pick(seed >> 3, 66, 88);
  const baseTemp = 366 + (seed % 8); // tenths of a degree C, e.g. 366 = 36.6
  const baseSys = pick(seed >> 4, 112, 134);

  const points = [];
  for (let i = 0; i < OBS_POINTS; i += 1) {
    const step = drift ? i : 0; // only drift for trend/escalation themes
    points.push(Object.freeze({
      order: i + 1,
      offsetHours: i * 4,
      respRate: baseResp + step * 2,
      spo2: Math.max(88, baseSpo2 - step),
      heartRate: baseHr + step * 6,
      systolicBp: Math.max(96, baseSys - step * 4),
      tempC: (baseTemp + step * 2) / 10,
      consciousness: drift ? CONSCIOUSNESS[Math.min(i, CONSCIOUSNESS.length - 1)] : 'Alert',
      simulationOnly: true
    }));
  }

  const last = points[points.length - 1];
  const first = points[0];
  const trendNote = drift
    ? `Fictional observations drift over the sequence (resp ${first.respRate}→${last.respRate}, SpO2 ${first.spo2}→${last.spo2}). Explainable review cue only — human review required.`
    : 'Fictional observations stay stable across the sequence. Simulation-only; human review required.';

  return Object.freeze({
    patientId: patient.id,
    trustId: patient.trustId,
    wardId: patient.wardId,
    simulationOnly: true,
    clinicalUse: 'not for live clinical deployment',
    points: Object.freeze(points),
    trend: drift ? 'drifting' : 'stable',
    trendNote
  });
}

export function buildAllPatientTimelines(patients = []) {
  return Object.freeze(patients.map((p) => buildPatientTimeline(p)).filter(Boolean));
}
