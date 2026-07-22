export const SCORE_COMPARISON_PARAMETERS = Object.freeze([
  { key: 'respRate', label: 'Respiratory rate', unit: 'breaths/min' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
  { key: 'heartRate', label: 'Heart rate', unit: 'beats/min' },
  { key: 'systolicBp', label: 'Systolic BP', unit: 'mmHg' },
  { key: 'tempC', label: 'Temperature', unit: '°C' },
  { key: 'consciousness', label: 'Consciousness', unit: 'recorded state' }
]);

export const SCORE_COMPARISON_SNAPSHOTS = Object.freeze([
  Object.freeze({
    id: 'early-subtle-change',
    label: 'Early subtle change',
    description: 'Same fictional observations with a subtle multi-parameter change for review comparison.',
    observations: Object.freeze({
      respRate: 22,
      spo2: 93,
      heartRate: 96,
      systolicBp: 108,
      tempC: 37.7,
      consciousness: 'alert'
    })
  }),
  Object.freeze({
    id: 'moderate-deterioration',
    label: 'Moderate deterioration',
    description: 'Same fictional observations with several more pronounced changes for review comparison.',
    observations: Object.freeze({
      respRate: 26,
      spo2: 90,
      heartRate: 118,
      systolicBp: 95,
      tempC: 38.6,
      consciousness: 'voice'
    })
  }),
  Object.freeze({
    id: 'consciousness-change',
    label: 'Consciousness change',
    description: 'Same fictional observations with a changed consciousness state and otherwise steady values.',
    observations: Object.freeze({
      respRate: 18,
      spo2: 97,
      heartRate: 88,
      systolicBp: 120,
      tempC: 36.8,
      consciousness: 'voice'
    })
  })
]);

const NEWS2_ESCALATION_CONVENTION =
  'Review thresholds in the England convention: aggregate 5+ is an urgent review threshold; 7+ is a higher-level review threshold. A single 3-point parameter is also a review cue.';
const MEWS_STYLE_ESCALATION_CONVENTION =
  'Review thresholds in this MEWS-style variant are local conventions; an aggregate 5+ threshold is a commonly published review reference, while single-parameter cues and response pathways vary by system.';
const COMPARISON_NOTE =
  'The same fictional observations can produce different totals and review trigger points under different scoring conventions; local escalation policy always governs, and human review is required.';

// These are teaching renderings of published scoring conventions for FICTIONAL observations, not clinical calculators.

export function computeNews2Points(observations) {
  const perParameter = {
    respRate: scoreNews2RespiratoryRate(observations.respRate),
    spo2: scoreNews2Spo2ScaleOne(observations.spo2),
    heartRate: scoreNews2HeartRate(observations.heartRate),
    systolicBp: scoreNews2SystolicBp(observations.systolicBp),
    tempC: scoreNews2Temperature(observations.tempC),
    consciousness: scoreNews2Consciousness(observations.consciousness)
  };

  return {
    total: sumPoints(perParameter),
    perParameter,
    escalationConvention: NEWS2_ESCALATION_CONVENTION
  };
}

export function computeMewsStylePoints(observations) {
  const perParameter = {
    respRate: scoreMewsStyleRespiratoryRate(observations.respRate),
    spo2: null,
    heartRate: scoreMewsStyleHeartRate(observations.heartRate),
    systolicBp: scoreMewsStyleSystolicBp(observations.systolicBp),
    tempC: scoreMewsStyleTemperature(observations.tempC),
    consciousness: scoreMewsStyleConsciousness(observations.consciousness)
  };

  return {
    total: sumPoints(perParameter),
    perParameter,
    escalationConvention: MEWS_STYLE_ESCALATION_CONVENTION
  };
}

export function compareScoringSystems(observations) {
  return {
    news2: computeNews2Points(observations),
    mewsStyle: computeMewsStylePoints(observations),
    comparisonNote: COMPARISON_NOTE
  };
}

function scoreNews2RespiratoryRate(value) {
  if (value <= 8) return 3;
  if (value <= 11) return 1;
  if (value <= 20) return 0;
  if (value <= 24) return 2;
  return 3;
}

function scoreNews2Spo2ScaleOne(value) {
  if (value <= 91) return 3;
  if (value <= 93) return 2;
  if (value <= 95) return 1;
  return 0;
}

function scoreNews2HeartRate(value) {
  if (value <= 40) return 3;
  if (value <= 50) return 1;
  if (value <= 90) return 0;
  if (value <= 110) return 1;
  if (value <= 130) return 2;
  return 3;
}

function scoreNews2SystolicBp(value) {
  if (value <= 90) return 3;
  if (value <= 100) return 2;
  if (value <= 110) return 1;
  if (value <= 219) return 0;
  return 3;
}

function scoreNews2Temperature(value) {
  if (value <= 35.0) return 3;
  if (value <= 36.0) return 1;
  if (value <= 38.0) return 0;
  if (value <= 39.0) return 1;
  return 2;
}

function scoreNews2Consciousness(value) {
  return normaliseConsciousness(value) === 'alert' ? 0 : 3;
}

function scoreMewsStyleRespiratoryRate(value) {
  if (value <= 8) return 2;
  if (value <= 14) return 0;
  if (value <= 20) return 1;
  if (value <= 29) return 2;
  return 3;
}

function scoreMewsStyleHeartRate(value) {
  if (value <= 40) return 2;
  if (value <= 50) return 1;
  if (value <= 100) return 0;
  if (value <= 110) return 1;
  if (value <= 129) return 2;
  return 3;
}

function scoreMewsStyleSystolicBp(value) {
  if (value <= 70) return 3;
  if (value <= 80) return 2;
  if (value <= 100) return 1;
  if (value <= 199) return 0;
  return 2;
}

function scoreMewsStyleTemperature(value) {
  if (value <= 35.0) return 2;
  if (value < 38.5) return 0;
  return 2;
}

function scoreMewsStyleConsciousness(value) {
  const consciousness = normaliseConsciousness(value);
  if (consciousness === 'alert') return 0;
  if (consciousness === 'voice') return 1;
  if (consciousness === 'pain') return 2;
  return 3;
}

function normaliseConsciousness(value) {
  const normalised = String(value).trim().toLowerCase().replace(/[\s_-]/g, '');

  if (normalised === 'alert') return 'alert';
  if (normalised === 'voice' || normalised === 'respondstovoice') return 'voice';
  if (normalised === 'pain' || normalised === 'respondstopain') return 'pain';
  if (normalised === 'unresponsive') return 'unresponsive';
  if (normalised === 'newconfusion' || normalised === 'confusion') return 'newconfusion';

  throw new RangeError(`Unsupported consciousness value: ${value}`);
}

function sumPoints(perParameter) {
  return Object.values(perParameter).reduce((total, points) => total + (points ?? 0), 0);
}
