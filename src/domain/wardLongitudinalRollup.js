import { getPatientsForWard } from '../data/trustNetwork/index.js';
import { getPatientDay } from './longitudinalJourney.js';

const OBSERVATION_KEYS = Object.freeze([
  'respRate',
  'spo2',
  'heartRate',
  'systolicBp',
  'tempC'
]);

/**
 * Build a deterministic cohort snapshot for one trust-network ward and day.
 *
 * The rollup delegates every patient-day to the existing longitudinal engine.
 * A review flag is counted only when that engine returns its existing,
 * human-review-framed `reviewThemeCue` field; this module adds no scoring.
 *
 * @param {string} wardId Trust-network ward identifier.
 * @param {number} dayNumber One-based fictional journey day.
 * @returns {{wardId: string, dayNumber: number, patientCount: number, averages: Record<string, number|null>, reviewFlagCount: number}}
 */
export function buildWardLongitudinalRollup(wardId, dayNumber) {
  const safeWardId = String(wardId ?? '').trim();
  const safeDayNumber = normaliseDay(dayNumber);
  const dayRecords = getPatientsForWard(safeWardId)
    .map((patient) => getPatientDay(patient.id, safeDayNumber));

  const averages = Object.fromEntries(
    OBSERVATION_KEYS.map((key) => [key, average(dayRecords.map((record) => record.observations[key]))])
  );

  return Object.freeze({
    wardId: safeWardId,
    dayNumber: safeDayNumber,
    patientCount: dayRecords.length,
    averages: Object.freeze(averages),
    reviewFlagCount: dayRecords.filter(hasReviewSupportCue).length
  });
}

/**
 * Compare two deterministic cohort snapshots for one trust-network ward.
 *
 * Observation deltas are calculated as `now - then`, matching `compareDays()`.
 * The note describes change as review support for human follow-up, never as a
 * clinical judgement or an automated action.
 *
 * @param {string} wardId Trust-network ward identifier.
 * @param {number} dayA Earlier fictional journey day.
 * @param {number} dayB Later fictional journey day.
 * @returns {{wardId: string, dayA: number, dayB: number, averages: Record<string, {then: number|null, now: number|null, from: number|null, to: number|null, delta: number|null, changed: boolean}>, averageDelta: Record<string, number|null>, reviewFlagCount: {then: number, now: number}, trendNote: string}}
 */
export function compareWardDays(wardId, dayA, dayB) {
  const thenRollup = buildWardLongitudinalRollup(wardId, dayA);
  const nowRollup = buildWardLongitudinalRollup(wardId, dayB);
  const averageChanges = Object.fromEntries(
    OBSERVATION_KEYS.map((key) => {
      const thenValue = thenRollup.averages[key];
      const nowValue = nowRollup.averages[key];
      const rawDelta = typeof thenValue === 'number' && typeof nowValue === 'number'
        ? nowValue - thenValue
        : null;
      const delta = normaliseZero(rawDelta);

      return [key, Object.freeze({
        then: thenValue,
        now: nowValue,
        from: thenValue,
        to: nowValue,
        delta,
        changed: delta !== null && delta !== 0
      })];
    })
  );
  const averageDelta = Object.fromEntries(
    OBSERVATION_KEYS.map((key) => [key, averageChanges[key].delta])
  );
  const reviewFlagCount = Object.freeze({
    then: thenRollup.reviewFlagCount,
    now: nowRollup.reviewFlagCount
  });
  const changed = Object.values(averageChanges).some((change) => change.changed)
    || reviewFlagCount.then !== reviewFlagCount.now;

  return Object.freeze({
    wardId: thenRollup.wardId,
    dayA: thenRollup.dayNumber,
    dayB: nowRollup.dayNumber,
    averages: Object.freeze(averageChanges),
    averageDelta: Object.freeze(averageDelta),
    reviewFlagCount,
    trendNote: changed
      ? 'Changed between the compared fictional ward days - human review required; review-support cue only.'
      : 'No change identified between the compared fictional ward days - human review required; review-support cue only.'
  });
}

function hasReviewSupportCue(dayRecord) {
  return typeof dayRecord.reviewThemeCue === 'string' && dayRecord.reviewThemeCue.trim().length > 0;
}

function average(values) {
  if (values.length === 0) return null;
  return normaliseZero(values.reduce((total, value) => total + value, 0) / values.length);
}

function normaliseZero(value) {
  return Object.is(value, -0) ? 0 : value;
}

function normaliseDay(dayNumber) {
  const value = Number(dayNumber);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}
