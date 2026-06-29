import { describe, expect, it } from 'vitest';
import { buildSimulationSignalFeatures } from './simulationFeatureBuilder.js';

const signals = [
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

describe('simulation signal feature builder', () => {
  it('extracts ML-shaped missed-action features from simulation-only signals', () => {
    const features = buildSimulationSignalFeatures({ patientId: 'DCU-031', signals });

    expect(features).toMatchObject({
      patientId: 'DCU-031',
      featureSetVersion: 'signal-features-v0',
      latestNews2: 7,
      lowPotassium: true,
      missingMagnesium: true,
      workflowPlanGap: true,
      simulationOnly: true
    });
    expect(features.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ signalId: 'signal-dcu-031-potassium-0910', label: 'Potassium 3.1 mmol/L final at 09:10' }),
      expect.objectContaining({ signalId: 'signal-dcu-031-news2-0915', label: 'NEWS2 7 at 09:15' })
    ]));
    expect(features.missingData).toContain('Magnesium result not visible');
    expect(JSON.stringify(features)).not.toMatch(/\bnhs_number|date_of_birth|postcode|address\b/i);
  });

  it('ignores non-simulation rows before feature extraction', () => {
    const features = buildSimulationSignalFeatures({
      patientId: 'DCU-031',
      signals: [
        ...signals,
        {
          syntheticPatientRef: 'DCU-031',
          signalCode: 'NEWS2',
          value: '12',
          simulationOnly: false
        }
      ]
    });

    expect(features.latestNews2).toBe(7);
  });
});
