import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { buildSimulationReviewCues, buildSimulationSignals } from './signalEngine.js';

const patient = simulatedPatients.find((item) => item.id === 'DCU-031');

const timelineSignals = [
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

describe('buildSimulationSignals', () => {
  it('builds deterministic simulation signals from the same fictional inputs', () => {
    const first = buildSimulationSignals({
      patient: clone(patient),
      signals: clone(timelineSignals),
      suggestions: clone(suggestions)
    });
    const second = buildSimulationSignals({
      patient: clone(patient),
      signals: clone(timelineSignals),
      suggestions: clone(suggestions)
    });

    expect(first).toEqual(second);
    expect(buildSimulationReviewCues({
      patient: clone(patient),
      signals: clone(timelineSignals),
      suggestions: clone(suggestions)
    })).toEqual(first);
    expect(first.map((signal) => signal.category)).toEqual([
      'documentation',
      'electrolyte-review',
      'infection-review',
      'escalation',
      'handover',
      'discharge',
      'learning'
    ]);

    const documentationSignal = first.find((signal) => signal.category === 'documentation');
    const electrolyteSignal = first.find((signal) => signal.category === 'electrolyte-review');
    const infectionSignal = first.find((signal) => signal.category === 'infection-review');
    const dischargeSignal = first.find((signal) => signal.category === 'discharge');

    expect(documentationSignal).toMatchObject({
      id: 'simulation-signal-dcu-031-documentation',
      title: 'Review suggested: documentation gap',
      priority: 'review',
      humanReviewRequired: true,
      simulationOnly: true,
      unsafeClinicalAdvice: false
    });
    expect(documentationSignal.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Potassium 3.1 mmol/L final at 09:10' }),
      expect.objectContaining({ label: 'Magnesium result not visible' }),
      expect.objectContaining({ label: 'Electrolyte monitoring plan unclear at 09:20' })
    ]));
    expect(documentationSignal.suggestedHumanReviewAction).toMatch(/human review required/i);

    expect(electrolyteSignal).toMatchObject({
      category: 'electrolyte-review',
      priority: 'review',
      humanReviewRequired: true,
      simulationOnly: true,
      unsafeClinicalAdvice: false
    });
    expect(electrolyteSignal.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Potassium 3.1 mmol/L final at 09:10' }),
      expect.objectContaining({ label: 'NEWS2 7 at 09:15' })
    ]));
    expect(electrolyteSignal.suggestedHumanReviewAction).toMatch(/human review required/i);

    expect(infectionSignal).toMatchObject({
      category: 'infection-review',
      priority: 'review',
      title: 'Review suggested: infection review',
      simulationOnly: true,
      humanReviewRequired: true,
      unsafeClinicalAdvice: false
    });
    expect(infectionSignal.explanation).toMatch(/simulation-only cue/i);
    expect(infectionSignal.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Risk flag: Sepsis Concern' }),
      expect.objectContaining({ label: 'NEWS2 7 at 09:15' })
    ]));

    expect(dischargeSignal).toMatchObject({
      category: 'discharge',
      priority: 'blocker',
      title: 'Review suggested: discharge-readiness blocker',
      unsafeClinicalAdvice: false
    });
  });

  it('handles missing signal data safely', () => {
    const derivedSignals = buildSimulationSignals({
      patient: clone(readyPatient),
      signals: null,
      suggestions: undefined
    });

    expect(derivedSignals).toHaveLength(1);
    expect(derivedSignals[0]).toMatchObject({
      category: 'simulation-fallback',
      humanReviewRequired: true,
      simulationOnly: true,
      unsafeClinicalAdvice: false
    });
    expect(derivedSignals[0].freshness).toMatchObject({ state: 'unavailable' });
    expect(derivedSignals[0].suggestedHumanReviewAction).toMatch(/human review required/i);
  });

  it('includes human-review wording on every cue', () => {
    const derivedSignals = buildSimulationSignals({
      patient: clone(patient),
      signals: clone(timelineSignals),
      suggestions: clone(suggestions)
    });

    expect(derivedSignals.every((signal) => signal.humanReviewRequired === true)).toBe(true);
    expect(derivedSignals.every((signal) => /human review required/i.test(signal.suggestedHumanReviewAction))).toBe(true);
    expect(derivedSignals.every((signal) => signal.simulationOnly === true)).toBe(true);
  });

  it('blocks diagnosis, prescribing and autonomous wording in cue text', () => {
    const derivedSignals = buildSimulationSignals({
      patient: clone(patient),
      signals: clone(timelineSignals),
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

    expect(JSON.stringify(derivedSignals)).not.toMatch(
      /diagnos|prescrib|autonomous clinical decision|AI decided|give potassium|treatment recommendation|administer potassium|patient needs potassium|replace potassium|potassium replacement|clinical decision engine|live NHS use/i
    );
    expect(derivedSignals.every((signal) => signal.unsafeClinicalAdvice === false)).toBe(true);
  });

  it('ignores non-simulation signal and suggestion inputs when deriving cues', () => {
    const derivedSignals = buildSimulationSignals({
      patient: clone(readyPatient),
      signals: [
        {
          signalId: 'signal-live-news2',
          syntheticPatientRef: 'DCU-099',
          signalCode: 'NEWS2',
          displayName: 'NEWS2',
          value: '9',
          effectiveAt: '2026-06-10T09:15:00.000Z',
          simulationOnly: false
        }
      ],
      suggestions: [
        {
          suggestionId: 'suggestion-live-treatment',
          syntheticPatientRef: 'DCU-099',
          riskType: 'missed_action',
          riskTier: 'urgent',
          title: 'Replace potassium immediately',
          requiresHumanReview: false,
          simulationOnly: false,
          createdAt: '2026-06-10T09:12:00.000Z'
        }
      ]
    });

    expect(derivedSignals).toEqual([
      expect.objectContaining({
        category: 'simulation-fallback',
        simulationOnly: true,
        humanReviewRequired: true,
        unsafeClinicalAdvice: false
      })
    ]);
    expect(JSON.stringify(derivedSignals)).not.toMatch(/replace potassium|live-treatment/i);
  });

  it('ignores simulation inputs that belong to a different fictional patient', () => {
    const derivedSignals = buildSimulationSignals({
      patient: clone(readyPatient),
      signals: [
        {
          signalId: 'signal-dcu-028-urine-culture',
          syntheticPatientRef: 'DCU-028',
          signalCode: 'urine_culture',
          displayName: 'Urine culture',
          value: 'Positive',
          effectiveAt: '2026-06-10T09:15:00.000Z',
          simulationOnly: true
        }
      ],
      suggestions: [
        {
          suggestionId: 'suggestion-dcu-028-sepsis-review',
          syntheticPatientRef: 'DCU-028',
          riskType: 'missed_action',
          riskTier: 'urgent',
          title: 'Review suggested: infection review',
          requiresHumanReview: true,
          simulationOnly: true,
          createdAt: '2026-06-10T09:12:00.000Z'
        }
      ]
    });

    expect(derivedSignals).toEqual([
      expect.objectContaining({
        category: 'simulation-fallback',
        simulationOnly: true,
        humanReviewRequired: true,
        unsafeClinicalAdvice: false
      })
    ]);
    expect(JSON.stringify(derivedSignals)).not.toMatch(/urine culture|infection review/i);
  });
});
