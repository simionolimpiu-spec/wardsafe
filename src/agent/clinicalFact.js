import { frozenCopy, isNonEmptyString } from './domainValues.js';
import { createProvenance } from './provenance.js';
import { TRUST_TIERS } from './trustTiers.js';

export const SIMULATION_REFERENCE_DATE = '2026-06-17';
export const LAB_UNITS = Object.freeze({ potassium: 'mmol/L', magnesium: 'mmol/L', creatinine: 'umol/L' });

export function createSourceFact({ factType, value, unit, patientId, provenance }) {
  if (!provenance) throw new TypeError('Source provenance is required.');
  const validatedProvenance = createProvenance(provenance);
  if (!isNonEmptyString(patientId)) throw new TypeError('Patient id is required.');
  if (!Object.hasOwn(LAB_UNITS, factType)) throw new TypeError('Unknown simulation lab fact type.');
  if (unit !== LAB_UNITS[factType]) throw new TypeError('Lab unit must match the simulation lab fact type.');
  if (!Number.isFinite(value)) throw new TypeError('Lab value must be a finite number.');
  return frozenCopy({
    factId: `${patientId}:${validatedProvenance.sourceRecordId}`,
    patientId, factType, value, unit, trustTier: TRUST_TIERS.SOURCE_FACT,
    provenance: validatedProvenance, simulationOnly: true
  });
}

export function labFactsFromSimulatedPatient(patient, { importedAt }) {
  const facts = Object.entries(patient.labs ?? {}).flatMap(([analyte, entries]) => {
    if (entries == null) return [];
    if (!Array.isArray(entries)) throw new TypeError('Simulation lab entries must be an array.');
    return entries.map(({ time, value }, index) => {
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new TypeError('Invalid simulation lab time.');
      const provenance = createProvenance({
        source: 'simulated-lab-system', sourceRecordId: `labs.${analyte}.${index}`,
        observedAt: `${SIMULATION_REFERENCE_DATE}T${time}:00.000Z`,
        observedAtLabel: time, importedAt
      });
      return createSourceFact({ factType: analyte, value, unit: LAB_UNITS[analyte], patientId: patient.id, provenance });
    });
  });
  return Object.freeze(facts);
}
