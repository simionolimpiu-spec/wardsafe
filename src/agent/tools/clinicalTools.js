import { buildSimulationSignals } from '../../domain/signalEngine.js';
import { evaluatePotassiumSafetyGap } from '../../domain/safetyRules.js';
import { CUE_TYPES, getEvidenceForCue, isValidCueType } from '../../domain/evidenceCorpus.js';
import { labFactsFromSimulatedPatient, LAB_UNITS } from '../clinicalFact.js';
import { createProvenance } from '../provenance.js';
import { timestampFrom } from '../domainValues.js';
import { TRUST_TIERS } from '../trustTiers.js';
import { sourceContent } from '../untrustedContent.js';

const string = { type: 'string' };
const number = { type: 'number' };
const yes = { type: 'boolean', enum: [true] };
const array = (items) => ({ type: 'array', items });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const tier = (value) => ({ type: 'string', enum: [value] });
const sourceTier = tier(TRUST_TIERS.SOURCE_FACT);
const derivedTier = tier(TRUST_TIERS.DETERMINISTIC_DERIVATION);
const analytes = Object.keys(LAB_UNITS);
const analyteSchema = { type: 'string', enum: analytes };
const patientInput = object({ patientId: { type: 'string', minLength: 1, pattern: '\\S' } });
const provenance = object({ source: string, sourceRecordId: string, observedAt: string, observedAtLabel: string, importedAt: string, simulationOnly: yes });
const fact = object({ factId: string, patientId: string, factType: analyteSchema, value: number, unit: string, trustTier: sourceTier, provenance, simulationOnly: yes });
const content = (kind) => object({ content: string, kind: tier(kind), trustLevel: tier('untrusted-data'), source: string, sourceId: string, simulationOnly: yes, trustTier: sourceTier });
const signalFields = {
  id: string, category: string, priority: string, title: string, explanation: string,
  evidence: array(object({ id: string, label: string })), suggestedHumanReviewAction: string,
  simulationOnly: yes, humanReviewRequired: yes, unsafeClinicalAdvice: { type: 'boolean', enum: [false] },
  freshness: object({ state: string, label: string }), missingDataNotes: array(string),
  outputGuard: object({ flaggedUnsafeText: { type: 'boolean' } }),
  level: string, reasons: array(string), missingInformation: array(string), confidence: string,
  limitations: array(string), recommendedNursingActions: array(string), boundary: string, trustTier: derivedTier
};
const cue = object(signalFields, ['title', 'simulationOnly', 'humanReviewRequired', 'trustTier']);
const envelope = (fields, trustTier = sourceTier) => object({ ...fields, simulationOnly: yes, trustTier });

export function createSimulatedClinicalTools({ patientSource, now }) {
  if (typeof patientSource?.getPatient !== 'function' || typeof now !== 'function') throw new TypeError('Simulation source and clock are required.');
  const factsFor = (patient) => labFactsFromSimulatedPatient(patient, { importedAt: timestampFrom(now) })
    .slice().sort((left, right) => left.provenance.observedAt.localeCompare(right.provenance.observedAt));
  const provenanceFor = (source, sourceRecordId) => {
    const timestamp = timestampFrom(now);
    return createProvenance({ source, sourceRecordId, observedAt: timestamp, observedAtLabel: 'Simulation snapshot', importedAt: timestamp });
  };
  const definition = (name, outputSchema, read, inputSchema = patientInput, permission = 'read:simulated-patient') => ({
    name, description: `Read simulation data with ${name}.`, permissions: [permission], inputSchema, outputSchema,
    handler(input) { return { ...read(input), simulationOnly: true }; }
  });
  const sourceEnvelope = (patientId, fields) => ({ patientId, ...fields, trustTier: TRUST_TIERS.SOURCE_FACT });
  return [
    definition('getPatientSummary', envelope({ patientId: string, age: number, riskBand: string, news2: number, allergies: array(string), provenance }), ({ patientId }) => {
      const patient = patientSource.getPatient(patientId);
      return sourceEnvelope(patientId, { age: patient.age, riskBand: patient.risk, news2: patient.news2, allergies: patient.allergies,
        provenance: provenanceFor('simulated-patient-record', `${patientId}:summary`) });
    }),
    definition('getLatestLabs', envelope({ patientId: string, facts: array(fact), missingAnalytes: array(analyteSchema) }), ({ patientId }) => {
      const facts = factsFor(patientSource.getPatient(patientId));
      return sourceEnvelope(patientId, {
        facts: analytes.flatMap((analyte) => facts.filter(({ factType }) => factType === analyte).slice(-1)),
        missingAnalytes: analytes.filter((analyte) => !facts.some(({ factType }) => factType === analyte))
      });
    }),
    definition('getLabTrend', object({ patientId: string, analyte: analyteSchema, sourceFactIds: array(string), first: number, latest: number, change: number,
      direction: { type: 'string', enum: ['falling', 'rising', 'unchanged', 'insufficient-data'] }, trustTier: derivedTier, simulationOnly: yes },
    ['patientId', 'analyte', 'sourceFactIds', 'direction', 'trustTier', 'simulationOnly']), ({ patientId, analyte }) => {
      const facts = factsFor(patientSource.getPatient(patientId)).filter(({ factType }) => factType === analyte);
      const result = { patientId, analyte, sourceFactIds: facts.map(({ factId }) => factId), direction: 'insufficient-data', trustTier: TRUST_TIERS.DETERMINISTIC_DERIVATION };
      if (facts.length) Object.assign(result, { first: facts[0].value, latest: facts.at(-1).value });
      if (facts.length >= 2) {
        const delta = result.latest - result.first;
        result.change = Number(delta.toFixed(2));
        result.direction = delta < 0 ? 'falling' : delta > 0 ? 'rising' : 'unchanged';
      }
      return result;
    }, object({ ...patientInput.properties, analyte: analyteSchema })),
    definition('getCurrentMedications', envelope({ patientId: string, medications: array(object({ text: string, trustTier: sourceTier, provenance, simulationOnly: yes })) }), ({ patientId }) => {
      const patient = patientSource.getPatient(patientId);
      return sourceEnvelope(patientId, { medications: (patient.medicines ?? []).map((text, index) => ({ text, trustTier: TRUST_TIERS.SOURCE_FACT,
        provenance: provenanceFor('simulated-medication-chart', `medicines.${index}`), simulationOnly: true })) });
    }),
    definition('getClinicalNotes', envelope({ patientId: string, notes: array(content('clinical-free-text')) }), ({ patientId }) => {
      const patient = patientSource.getPatient(patientId);
      const entries = Object.entries(patient.sbar ?? {}).map(([key, text]) => [`sbar.${key}`, text]);
      for (const key of ['currentState', 'trajectory', 'uncertainty', 'responseHistory']) {
        (patient[key] ?? []).forEach((text, index) => entries.push([`${key}.${index}`, text]));
      }
      return sourceEnvelope(patientId, { notes: entries.map(([sourceId, text]) => sourceContent({ content: text, kind: 'clinical-free-text', source: 'simulated-patient-record', sourceId })) });
    }),
    definition('getExistingReviewCues', envelope({ patientId: string, cues: array(cue) }, derivedTier), ({ patientId }) => {
      const patient = patientSource.getPatient(patientId);
      return { patientId, trustTier: TRUST_TIERS.DETERMINISTIC_DERIVATION,
        cues: [...buildSimulationSignals({ patient }), evaluatePotassiumSafetyGap(patient)].map((item) => ({
          ...item, trustTier: TRUST_TIERS.DETERMINISTIC_DERIVATION, simulationOnly: true, humanReviewRequired: true
        })) };
    }),
    definition('getRelevantGuidance', envelope({ cueType: string, records: array(content('retrieved-knowledge')) }), ({ cueType }) => {
      if (!isValidCueType(cueType)) throw new TypeError('Unknown simulation cue type.');
      return { cueType, trustTier: TRUST_TIERS.SOURCE_FACT, records: getEvidenceForCue(cueType).map((record) => sourceContent({
        content: `${record.title}\n${record.journal ?? ''} (${record.year ?? ''}). PMID: ${record.pmid}${record.doi ? `. DOI: ${record.doi}` : ''}`,
        kind: 'retrieved-knowledge', source: 'safeflow-evidence-corpus', sourceId: record.pmid
      })) };
    }, object({ cueType: { type: 'string', enum: CUE_TYPES.map(({ id }) => id).filter(isValidCueType) } }), 'read:evidence-corpus')
  ];
}
