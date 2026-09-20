import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { createProvenance, createSourceFact, labFactsFromSimulatedPatient } from './index.js';

const importedAt = '2026-06-17T14:00:00.000Z';
const provenance = createProvenance({ source: 'simulation', sourceRecordId: 'labs.potassium.0', observedAt: '2026-06-17T07:00:00.000Z', observedAtLabel: '07:00', importedAt });
const input = { factType: 'potassium', value: 3.8, unit: 'mmol/L', patientId: 'DCU-031', provenance };

describe('source facts', () => {
  it('preserves provenance exactly and freezes all fact data', () => {
    const fact = createSourceFact(input);
    expect(fact).toEqual({ ...input, factId: 'DCU-031:labs.potassium.0', trustTier: 'source-fact', simulationOnly: true });
    expect(fact.provenance).toEqual(provenance);
    expect(Object.isFrozen(fact)).toBe(true);
    expect(Object.isFrozen(fact.provenance)).toBe(true);
    expect(() => { fact.value = 9; }).toThrow();
    expect(() => { fact.provenance.source = 'changed'; }).toThrow();
  });
  it.each([NaN, Infinity, -Infinity, '3.8'])('rejects non-finite numeric values: %s', (value) => {
    expect(() => createSourceFact({ ...input, value })).toThrow();
  });
  it('rejects units that do not match the lab fact type', () => {
    expect(() => createSourceFact({ ...input, unit: 'mg' })).toThrow(TypeError);
  });
  it('stores only validated provenance fields', () => {
    const callerProvenance = { ...provenance, note: 'x' };
    const fact = createSourceFact({ ...input, provenance: callerProvenance });
    expect(fact.provenance).toEqual(provenance);
    expect(fact.provenance).not.toHaveProperty('note');
    expect(callerProvenance.note).toBe('x');
    expect(Object.isFrozen(callerProvenance)).toBe(false);
  });
  it('rejects missing provenance and unknown lab types', () => {
    expect(() => createSourceFact({ ...input, provenance: undefined })).toThrow();
    expect(() => createSourceFact({ ...input, factType: 'unknown' })).toThrow();
    expect(() => createSourceFact({ ...input, factType: 'toString' })).toThrow();
  });
  it('maps DCU-031 reproducibly without changing the fixture', () => {
    const patient = simulatedPatients.find(({ id }) => id === 'DCU-031');
    const before = JSON.parse(JSON.stringify(patient));
    const facts = labFactsFromSimulatedPatient(patient, { importedAt });
    const potassium = facts.filter(({ factType }) => factType === 'potassium');
    expect(potassium).toHaveLength(2);
    expect(potassium.map(({ value }) => value)).toEqual([3.8, 3.2]);
    expect(potassium.map(({ unit }) => unit)).toEqual(['mmol/L', 'mmol/L']);
    expect(potassium.map(({ provenance: p }) => p.observedAtLabel)).toEqual(['07:00', '13:00']);
    expect(potassium.map(({ provenance: p }) => p.observedAt)).toEqual(['2026-06-17T07:00:00.000Z', '2026-06-17T13:00:00.000Z']);
    expect(potassium[0].provenance.source).toBe('simulated-lab-system');
    expect(facts.map(({ factId }) => factId)).toEqual(['DCU-031:labs.potassium.0', 'DCU-031:labs.potassium.1', 'DCU-031:labs.creatinine.0', 'DCU-031:labs.creatinine.1']);
    expect(facts.filter(({ factType }) => factType === 'magnesium')).toHaveLength(0);
    expect(labFactsFromSimulatedPatient(patient, { importedAt })).toEqual(facts);
    expect(patient).toEqual(before);
    expect(Object.isFrozen(patient.labs.potassium[0])).toBe(false);
    expect(Object.isFrozen(facts)).toBe(true);
  });
  it('does not invent missing analytes and rejects malformed times', () => {
    expect(labFactsFromSimulatedPatient({ id: 'simulation' }, { importedAt })).toEqual([]);
    expect(labFactsFromSimulatedPatient({ id: 'simulation', labs: { potassium: [], magnesium: null } }, { importedAt })).toEqual([]);
    expect(() => labFactsFromSimulatedPatient({ id: 'simulation', labs: { potassium: [{ time: '24:00', value: 3 }] } }, { importedAt })).toThrow();
  });
});
