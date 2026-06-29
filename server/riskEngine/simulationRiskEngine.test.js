import { describe, expect, it } from 'vitest';
import { createSimulationRiskSuggestion } from './simulationRiskEngine.js';

const highRiskSignals = [
  {
    signalId: 'signal-dcu-031-potassium-0910',
    syntheticPatientRef: 'DCU-031',
    sourceType: 'lab',
    signalCode: 'potassium',
    displayName: 'Potassium',
    value: '3.1',
    unit: 'mmol/L',
    status: 'final',
    effectiveAt: '2026-06-10T09:10:00.000Z',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-magnesium-missing-0910',
    syntheticPatientRef: 'DCU-031',
    sourceType: 'lab',
    signalCode: 'magnesium',
    displayName: 'Magnesium',
    value: null,
    status: 'missing',
    effectiveAt: '2026-06-10T09:10:30.000Z',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-news2-0915',
    syntheticPatientRef: 'DCU-031',
    sourceType: 'observation',
    signalCode: 'NEWS2',
    displayName: 'NEWS2',
    value: '7',
    status: 'final',
    effectiveAt: '2026-06-10T09:15:00.000Z',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-plan-gap-0920',
    syntheticPatientRef: 'DCU-031',
    sourceType: 'workflow',
    signalCode: 'electrolyte_plan_gap',
    displayName: 'Electrolyte monitoring plan',
    value: 'unclear',
    status: 'final',
    effectiveAt: '2026-06-10T09:20:00.000Z',
    simulationOnly: true
  }
];

describe('simulation risk engine', () => {
  it('creates a nurse-review-only missed-action suggestion from high-risk features', () => {
    const suggestion = createSimulationRiskSuggestion({
      patientId: 'DCU-031',
      signals: highRiskSignals,
      createdAt: '2026-06-10T09:12:00.000Z'
    });

    expect(suggestion).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      syntheticPatientRef: 'DCU-031',
      riskType: 'missed_action',
      riskTier: 'urgent',
      riskScore: 0.86,
      status: 'suggested',
      title: 'Electrolyte result review may be needed',
      suggestedBlocker: 'Unresolved abnormal blood result',
      suggestedTask: 'Review blood trend and document action',
      modelVersion: 'simulation-risk-v0',
      featureSetVersion: 'signal-features-v0',
      requiresHumanReview: true,
      simulationOnly: true,
      createdAt: '2026-06-10T09:12:00.000Z'
    });
    expect(suggestion.evidence).toHaveLength(4);
    expect(suggestion.missingData).toEqual(['Magnesium result not visible']);
    expect(suggestion).not.toHaveProperty('autoEscalate');
    expect(JSON.stringify(suggestion)).not.toMatch(/\bdiagnose|prescribe|treatment instruction\b/i);
  });

  it('does not create a workflow suggestion when the simulated risk score is low', () => {
    const suggestion = createSimulationRiskSuggestion({
      patientId: 'DCU-017',
      signals: [{
        signalId: 'signal-low-news2',
        syntheticPatientRef: 'DCU-017',
        signalCode: 'NEWS2',
        displayName: 'NEWS2',
        value: '1',
        status: 'final',
        effectiveAt: '2026-06-10T08:20:00.000Z',
        simulationOnly: true
      }]
    });

    expect(suggestion).toBeNull();
  });
});
