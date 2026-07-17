// Maps deterministic longitudinal-journey engine output (getPatientDay,
// buildEpisodes) onto flat rows matching database/schema.sql's
// journey_episodes / longitudinal_observations tables. Pure functions only —
// no I/O, no database access — so they can be reused by both the CLI
// materialisation script (scripts/build-longitudinal-db.mjs) and, in future,
// a database-backed read model. SIMULATION-ONLY: every row stays
// non-identifying (fictional patient_id only, no name/DOB/NHS number).

import { getPatientDay } from './longitudinalJourney.js';

export const OBSERVATION_ROW_TYPES = Object.freeze([
  'respRate',
  'spo2',
  'heartRate',
  'systolicBp',
  'tempC',
  'consciousness'
]);

export function mapEpisodeToRow(episode, patientId) {
  return Object.freeze({
    patient_id: patientId,
    episode_id: episode.episodeId,
    start_day: episode.startDay,
    end_day: episode.endDay ?? null,
    phase: episode.phase,
    phase_label: episode.phaseLabel,
    trust_id: episode.trustId,
    ward_id: episode.wardId,
    journey_id: episode.journeyId ?? null,
    journey_type: episode.journeyType ?? null,
    journey_stage: episode.journeyStage ?? null,
    simulation_only: true,
    human_review_required: true
  });
}

export function mapDayToObservationRows(patientId, dayNumber, dayRecord = getPatientDay(patientId, dayNumber)) {
  return OBSERVATION_ROW_TYPES.map((observationType) => Object.freeze({
    patient_id: patientId,
    day_number: dayRecord.dayNumber,
    observation_type: observationType,
    observed_value: String(dayRecord.observations[observationType]),
    source_label: 'simulation-longitudinal',
    simulation_only: true
  }));
}

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const JOURNEY_EPISODE_CSV_HEADERS = Object.freeze([
  'patient_id',
  'episode_id',
  'start_day',
  'end_day',
  'phase',
  'phase_label',
  'trust_id',
  'ward_id',
  'journey_id',
  'journey_type',
  'journey_stage',
  'simulation_only',
  'human_review_required'
]);

export const LONGITUDINAL_OBSERVATION_CSV_HEADERS = Object.freeze([
  'patient_id',
  'day_number',
  'observation_type',
  'observed_value',
  'source_label',
  'simulation_only'
]);

export function rowToCsvLine(row, headers) {
  return headers.map((header) => csvCell(row[header])).join(',');
}
