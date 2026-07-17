import { describe, expect, it } from 'vitest';
import { getPatientDay, buildEpisodes } from './longitudinalJourney.js';
import {
  JOURNEY_EPISODE_CSV_HEADERS,
  LONGITUDINAL_OBSERVATION_CSV_HEADERS,
  OBSERVATION_ROW_TYPES,
  csvCell,
  mapDayToObservationRows,
  mapEpisodeToRow,
  rowToCsvLine
} from './longitudinalMaterialization.js';

describe('longitudinalMaterialization', () => {
  const patientId = 'JPUH-P-001';

  it('maps an episode onto a flat, schema-shaped row with no identifiers', () => {
    const [episode] = buildEpisodes(patientId, 5);
    const row = mapEpisodeToRow(episode, patientId);

    expect(row.patient_id).toBe(patientId);
    expect(row.episode_id).toBe(episode.episodeId);
    expect(row.start_day).toBe(episode.startDay);
    expect(row.simulation_only).toBe(true);
    expect(row.human_review_required).toBe(true);
    expect(JSON.stringify(row)).not.toMatch(/"(?:name|patientName|nhsNumber|dob)"\s*:/i);
  });

  it('maps a patient-day onto one observation row per observation type', () => {
    const rows = mapDayToObservationRows(patientId, 42);

    expect(rows).toHaveLength(OBSERVATION_ROW_TYPES.length);
    expect(rows.map((row) => row.observation_type).sort()).toEqual([...OBSERVATION_ROW_TYPES].sort());
    rows.forEach((row) => {
      expect(row.patient_id).toBe(patientId);
      expect(row.day_number).toBe(42);
      expect(row.simulation_only).toBe(true);
      expect(typeof row.observed_value).toBe('string');
    });
  });

  it('accepts a pre-fetched day record to avoid recomputation', () => {
    const dayRecord = getPatientDay(patientId, 1300);
    const rows = mapDayToObservationRows(patientId, 1300, dayRecord);

    expect(rows.every((row) => row.day_number === 1300)).toBe(true);
  });

  it('is deterministic - same patient/day always maps to the same rows', () => {
    const first = mapDayToObservationRows(patientId, 250);
    const second = mapDayToObservationRows(patientId, 250);

    expect(first).toEqual(second);
  });

  it('renders CSV cells safely, quoting only when needed', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(7)).toBe('7');
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('has,comma')).toBe('"has,comma"');
    expect(csvCell('has "quote"')).toBe('"has ""quote"""');
  });

  it('renders a full CSV line matching the declared header order', () => {
    const [episode] = buildEpisodes(patientId, 5);
    const row = mapEpisodeToRow(episode, patientId);
    const line = rowToCsvLine(row, JOURNEY_EPISODE_CSV_HEADERS);

    expect(line.split(',')).toHaveLength(JOURNEY_EPISODE_CSV_HEADERS.length);

    const obsRow = mapDayToObservationRows(patientId, 1)[0];
    const obsLine = rowToCsvLine(obsRow, LONGITUDINAL_OBSERVATION_CSV_HEADERS);
    expect(obsLine.split(',')).toHaveLength(LONGITUDINAL_OBSERVATION_CSV_HEADERS.length);
  });
});
