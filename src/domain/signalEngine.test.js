import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { buildSimulationReviewCues } from './signalEngine.js';

const patient = simulatedPatients.find((item) => item.id === 'DCU-031');

const signals = [
  {
    signalId: 'signal-dcu-031-plan-gap-0920',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-workflow',
    sourceType: 'workflow',
    signalCode: 'electrolyte_plan_gap',
    displayName: 'Electrolyte monitoring plan',
    value: 'unclear',
    status: 'final',
    effectiveAt: '2026-06-10T09:20:00.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-news2-0915',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-observations',
    sourceType: 'observation',
    signalCode: 'NEWS2',
    displayName: 'NEWS2',
    value: '7',
    status: 'final',
    effectiveAt: '2026-06-10T09:15:00.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-magnesium-missing-0910',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'magnesium',
    displayName: 'Magnesium',
    value: null,
    status: 'missing',
    effectiveAt: '2026-06-10T09:10:30.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-potassium-0910',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'potassium',
    displayName: 'Potassium',
    value: '3.1',
    unit: 'mmol/L',
    status: 'final',
    effectiveAt: '2026-06-10T09:10:00.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  }
];

const suggestions = [
  {
    suggestionId: 'suggestion-dcu-031-electrolyte-review',
    syntheticPatientRef: 'DCU-031',
    riskType: 'missed_action',
    riskTier: 'urgent',
    title: 'Electrolyte result review may be needed',
    suggestedFlag: 'Electrolyte result review may be needed',
    suggestedBlocker: 'Unresolved abnormal blood result',
    suggestedTask: 'Review blood trend and document action',
    evidence: [
      { signalCode: 'potassium', label: 'Potassium 3.1 mmol/L final at 09:10' },
      { signalCode: 'magnesium', label: 'Magnesium result not visible' },
      { signalCode: 'NEWS2', label: 'NEWS2 7 at 09:15' }
    ],
    missingData: ['Magnesium result not visible'],
    requiresHumanReview: true,
    simulationOnly: true,
    createdAt: '2026-06-10T09:12:00.000Z',
    updatedAt: '2026-06-10T09:12:00.000Z'
  }
];

const readyPatient = {
  id: 'DCU-099',
  name: 'Patient 099',
  handoverComplete: 100,
  dischargeReady: true,
  dischargeBlockers: [],
  tasks: [],
  escalation: 'None',
  plan: 'Simulation review completed.',
  baseline: [],
  symptoms: [],
  uncertainty: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

describe('buildSimulationReviewCues', () => {
  it('builds deterministic cues from the same simulation inputs', () => {
    const first = buildSimulationReviewCues({
      patient: clone(patient),
      signals: clone(signals),
      suggestions: clone(suggestions)
    });
    const second = buildSimulationReviewCues({
      patient: clone(patient),
      signals: clone(signals),
      suggestions: clone(suggestions)
    });

    expect(first).toEqual(second);
    expect(first.map((cue) => cue.category)).toEqual([
      'documentation_gap',
      'escalation_readiness',
      'risk_support_signal',
      'handover_cue',
      'discharge_readiness_blocker',
      'scenario_learning'
    ]);

    const documentationCue = first.find((cue) => cue.category === 'documentation_gap');
    const riskCue = first.find((cue) => cue.category === 'risk_support_signal');

    expect(documentationCue).toMatchObject({
      title: 'Review suggested: documentation gap',
      priority: 'high',
      humanReviewRequired: true,
      simulationOnly: true
    });
    expect(documentationCue.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Potassium 3.1 mmol/L final at 09:10' }),
      expect.objectContaining({ label: 'Magnesium result not visible' }),
      expect.objectContaining({ label: 'Electrolyte monitoring plan unclear at 09:20' })
    ]));
    expect(documentationCue.missingDataNotes).toContain('Magnesium result not visible.');
    expect(documentationCue.suggestedHumanReviewAction).toMatch(/human review required/i);

    expect(riskCue).toMatchObject({
      category: 'risk_support_signal',
      priority: 'high',
      humanReviewRequired: true,
      simulationOnly: true
    });
    expect(riskCue.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Potassium 3.1 mmol/L final at 09:10' }),
      expect.objectContaining({ label: 'NEWS2 7 at 09:15' })
    ]));
    expect(riskCue.suggestedHumanReviewAction).toMatch(/human review required/i);
  });

  it('handles missing signal data safely', () => {
    const cues = buildSimulationReviewCues({
      patient: clone(readyPatient),
      signals: null,
      suggestions: undefined
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      category: 'simulation_fallback',
      humanReviewRequired: true,
      simulationOnly: true
    });
    expect(cues[0].freshness).toMatchObject({ state: 'unavailable' });
    expect(cues[0].suggestedHumanReviewAction).toMatch(/human review required/i);
  });

  it('includes human-review wording on every cue', () => {
    const cues = buildSimulationReviewCues({
      patient: clone(patient),
      signals: clone(signals),
      suggestions: clone(suggestions)
    });

    expect(cues.every((cue) => cue.humanReviewRequired === true)).toBe(true);
    expect(cues.every((cue) => /human review required/i.test(cue.suggestedHumanReviewAction))).toBe(true);
  });

  it('blocks diagnosis, prescribing and autonomous wording in cue text', () => {
    const cues = buildSimulationReviewCues({
      patient: clone(patient),
      signals: clone(signals),
      suggestions: [{
        suggestionId: 'suggestion-malicious',
        syntheticPatientRef: 'DCU-031',
        riskType: 'missed_action',
        riskTier: 'urgent',
        title: 'Diagnosis and prescribe potassium now',
        suggestedFlag: 'AI decided treatment recommendation',
        suggestedBlocker: 'Autonomous clinical decision',
        suggestedTask: 'Give potassium',
        evidence: [{ label: 'AI decided treatment' }],
        missingData: ['Need to diagnose'],
        requiresHumanReview: true,
        simulationOnly: true,
        createdAt: '2026-06-10T09:12:00.000Z'
      }]
    });

    expect(JSON.stringify(cues)).not.toMatch(/diagnos|prescrib|autonomous clinical decision|AI decided|give potassium|treatment recommendation/i);
  });
});
