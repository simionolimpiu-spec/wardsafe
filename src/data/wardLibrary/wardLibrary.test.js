import { describe, expect, it } from 'vitest';
import { buildPatientTimelineCollection } from '../../domain/patientTimeline.js';
import { scanStrictSafetyLanguage } from '../../domain/safetyLanguage.js';
import {
  buildWardDatabaseExport,
  getWardLibraryDemoScenarioById,
  getWardLibraryScenarioOptions,
  wardLibrary
} from './index.js';
import {
  EXPORT_TABLES,
  renderWardDatabaseArtifacts
} from '../../../scripts/build-ward-db.mjs';

const ALLOWED_WARD_TYPES = new Set([
  'surgical',
  'general medical',
  'acute medical',
  'day care',
  'community frailty team',
  'rehab',
  'care-of-the-elderly',
  'paediatrics',
  'maternity',
  'ICU/HDU',
  'ED'
]);

const SAFETY_CATEGORIES = new Set([
  'documentation',
  'electrolyte-review',
  'infection-review',
  'sepsis-screen',
  'falls-risk',
  'medication-timing',
  'deteriorating-obs',
  'escalation',
  'handover',
  'discharge',
  'learning'
]);

const EVENT_TYPES = new Set(['vital', 'intervention', 'note', 'escalation', 'handover']);

describe('ward simulation database library', () => {
  it('contains the required fictional wards, flags, scenarios and patient journeys', () => {
    expect(wardLibrary.wards.length).toBeGreaterThanOrEqual(11);
    expect(wardLibrary.flags.length).toBeGreaterThanOrEqual(100);
    expect(wardLibrary.scenarios.length).toBeGreaterThanOrEqual(50);
    expect(wardLibrary.patientJourneys.length).toBeGreaterThanOrEqual(100);

    const wardTypes = new Set(wardLibrary.wards.map((ward) => ward.wardType));
    expect(wardTypes).toEqual(ALLOWED_WARD_TYPES);
    expect([...wardTypes].every((wardType) => ALLOWED_WARD_TYPES.has(wardType))).toBe(true);
  });

  it('uses complete safety flag fields aligned with the signal and heuristic cue categories', () => {
    const flagIds = new Set();
    const flagCodes = new Set();

    for (const flag of wardLibrary.flags) {
      expect(flag).toEqual(expect.objectContaining({
        id: expect.any(String),
        code: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        severity: expect.stringMatching(/^(low|moderate|high)$/),
        description: expect.any(String),
        triggerSignals: expect.any(Array),
        rationaleTemplate: expect.any(String),
        applicableWardTypes: expect.any(Array)
      }));
      expect(flagIds.has(flag.id)).toBe(false);
      expect(flagCodes.has(flag.code)).toBe(false);
      expect(SAFETY_CATEGORIES.has(flag.category)).toBe(true);
      expect(flag.triggerSignals.length).toBeGreaterThan(0);
      expect(flag.rationaleTemplate).toMatch(/human review required/i);
      expect(flag.applicableWardTypes.length).toBeGreaterThan(0);
      expect(flag.applicableWardTypes.every((wardType) => ALLOWED_WARD_TYPES.has(wardType))).toBe(true);
      flagIds.add(flag.id);
      flagCodes.add(flag.code);
    }
  });

  it('keeps scenarios, patients, flags and timeline events referentially intact', () => {
    const wardIds = new Set(wardLibrary.wards.map((ward) => ward.id));
    const patientIds = new Set(wardLibrary.patientJourneys.map((patient) => patient.patientId));
    const flagIds = new Set(wardLibrary.flags.map((flag) => flag.id));

    for (const scenario of wardLibrary.scenarios) {
      expect(ALLOWED_WARD_TYPES.has(scenario.wardType)).toBe(true);
      expect(scenario.patientIds.length).toBeGreaterThan(0);
      expect(scenario.patientIds.every((patientId) => patientIds.has(patientId))).toBe(true);
      expect(scenario.reviewCues.length).toBeGreaterThan(0);
      expect(scenario.reviewCues.every((flagId) => flagIds.has(flagId))).toBe(true);
    }

    for (const patient of wardLibrary.patientJourneys) {
      expect(wardIds.has(patient.wardId)).toBe(true);
      expect(patient.patientName).toMatch(/^Fictional Patient /);
      expect(patient.demographics).toEqual(expect.objectContaining({
        age: expect.any(Number),
        pronouns: expect.any(String),
        context: expect.any(String)
      }));
      expect(patient.riskFlags.length).toBeGreaterThan(0);
      expect(patient.riskFlags.every((flagId) => flagIds.has(flagId))).toBe(true);
      expect(patient.timeline.length).toBeGreaterThanOrEqual(5);
      expect(patient.timeline.map((event) => event.type)).toEqual(expect.arrayContaining([...EVENT_TYPES]));
      expect(patient.timeline.every((event) => event.simulationOnly === true)).toBe(true);
    }
  });

  it('reuses the patient timeline shape and normalises ordered fictional event entries', () => {
    const collection = buildPatientTimelineCollection(wardLibrary.patientJourneys);
    expect(collection).toHaveLength(wardLibrary.patientJourneys.length);

    for (const patient of collection) {
      expect(patient.simulationOnly).toBe(true);
      expect(patient.clinicalUse).toBe('not for live clinical deployment');
      const timestamps = patient.timeline.map((entry) => Date.parse(entry.timestamp));
      expect(timestamps).toEqual([...timestamps].sort((left, right) => left - right));
      expect(patient.timeline.every((entry) => EVENT_TYPES.has(entry.type))).toBe(true);
      expect(patient.timeline.every((entry) => entry.simulationLabel === 'Simulation-only')).toBe(true);
    }
  });

  it('builds a normalized export model with table-level referential integrity', () => {
    const exportModel = buildWardDatabaseExport(wardLibrary);
    const tables = exportModel.tables;
    const wardIds = new Set(tables.wards.map((ward) => ward.id));
    const flagIds = new Set(tables.flags.map((flag) => flag.id));
    const scenarioIds = new Set(tables.scenarios.map((scenario) => scenario.id));
    const patientIds = new Set(tables.patients.map((patient) => patient.id));

    expect(Object.keys(tables)).toEqual(EXPORT_TABLES);
    expect(tables.flags.length).toBeGreaterThanOrEqual(100);
    expect(tables.scenarios.length).toBeGreaterThanOrEqual(50);
    expect(tables.patients.length).toBeGreaterThanOrEqual(100);
    expect(tables.journey_events.length).toBeGreaterThanOrEqual(500);

    expect(tables.wards.every((ward) => ALLOWED_WARD_TYPES.has(ward.ward_type))).toBe(true);
    expect(tables.scenarios.every((scenario) => ALLOWED_WARD_TYPES.has(scenario.ward_type))).toBe(true);
    expect(tables.patients.every((patient) => wardIds.has(patient.ward_id))).toBe(true);
    expect(tables.patient_flags.every((row) => patientIds.has(row.patient_id) && flagIds.has(row.flag_id))).toBe(true);
    expect(tables.scenario_patients.every((row) => scenarioIds.has(row.scenario_id) && patientIds.has(row.patient_id))).toBe(true);
    expect(tables.journey_events.every((event) => patientIds.has(event.patient_id))).toBe(true);
  });

  it('renders deterministic CSV, schema and seed artifacts for the generator', () => {
    const artifacts = renderWardDatabaseArtifacts(buildWardDatabaseExport(wardLibrary));

    expect(Object.keys(artifacts.csvFiles)).toEqual(EXPORT_TABLES.map((tableName) => `${tableName}.csv`));
    expect(artifacts.schemaSql).toContain('CREATE TABLE wards');
    expect(artifacts.schemaSql).toContain('FOREIGN KEY (ward_id) REFERENCES wards(id)');
    expect(artifacts.seedSql).toContain('INSERT INTO wards');
    expect(artifacts.seedSql).toContain('INSERT INTO journey_events');
    expect(artifacts.sqliteFileName).toBe('wardsafe-sim.db');

    for (const tableName of EXPORT_TABLES) {
      const csv = artifacts.csvFiles[`${tableName}.csv`];
      expect(csv.split('\n')[0]).not.toBe('');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    }
  });

  it('exposes library scenarios in a demo-compatible shape for additive picker wiring', () => {
    const options = getWardLibraryScenarioOptions();
    expect(options.length).toBeGreaterThanOrEqual(50);
    expect(options[0]).toEqual(expect.objectContaining({
      id: 'ward-sim-surgical-01',
      label: expect.any(String),
      description: expect.any(String)
    }));

    const scenario = getWardLibraryDemoScenarioById('ward-sim-surgical-01');
    expect(scenario).toEqual(expect.objectContaining({
      id: 'ward-sim-surgical-01',
      hospitalName: 'Cityview Community Hospital',
      currentWardName: expect.any(String),
      selectedPatientId: expect.any(String),
      patients: expect.any(Array),
      signalFixtures: [],
      suggestionFixtures: []
    }));
    expect(scenario.patients.length).toBeGreaterThanOrEqual(3);
    expect(scenario.patients[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      name: expect.stringMatching(/^Fictional Patient /),
      riskFlags: expect.any(Array),
      sbar: expect.objectContaining({
        situation: expect.any(String),
        background: expect.any(String),
        assessment: expect.any(String),
        recommendation: expect.any(String)
      }),
      tasks: expect.any(Array)
    }));
  });

  it('keeps ward library wording inside the strict simulation-only safety boundary', () => {
    const result = scanStrictSafetyLanguage(wardLibrary, { checkedLabel: 'ward simulation database library' });
    expect(result.violations).toEqual([]);
    expect(result.passed).toBe(true);
  });
});
