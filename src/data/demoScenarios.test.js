import { describe, expect, it } from 'vitest';
import {
  getDefaultDemoScenario,
  getDemoScenarioById,
  getDemoScenarioOptions
} from './demoScenarios.js';

describe('demo scenarios', () => {
  it('returns deterministic scenario options with a day care default', () => {
    const options = getDemoScenarioOptions();
    const defaultScenario = getDefaultDemoScenario();
    const correlatedPatient = defaultScenario.patients.find((patient) => patient.id === 'DCU-031');
    const uncorrelatedPatients = defaultScenario.patients.filter((patient) => patient.id !== 'DCU-031');

    expect(defaultScenario.id).toBe('day-care-treatment-pathway');
    expect(defaultScenario.selectedPatientId).toBe('DCU-031');
    expect(correlatedPatient?.riskFlags).toContain('Electrolyte / AKI safety gap');
    expect(uncorrelatedPatients.some((patient) => patient.riskFlags?.includes('Electrolyte / AKI safety gap'))).toBe(false);
    expect(options.slice(0, 7)).toEqual([
      expect.objectContaining({
        id: 'gastro-documentation-review',
        label: 'Gastro ward documentation review'
      }),
      expect.objectContaining({
        id: 'amu-discharge-readiness-review',
        label: 'AMU discharge readiness review'
      }),
      expect.objectContaining({
        id: 'day-care-treatment-pathway',
        label: 'Day Care treatment pathway review'
      }),
      expect.objectContaining({
        id: 'surgical-postop-deterioration-review',
        label: 'Surgical post-op deterioration review'
      }),
      expect.objectContaining({
        id: 'paediatric-sepsis-screen-review',
        label: 'Paediatric sepsis-screen review'
      }),
      expect.objectContaining({
        id: 'community-falls-risk-review',
        label: 'Community frailty falls-risk review'
      }),
      expect.objectContaining({
        id: 'community-medication-timing-review',
        label: 'Community medication-timing review'
      })
    ]);
  });

  it('adds the ward simulation database scenarios without replacing the existing defaults', () => {
    const options = getDemoScenarioOptions();
    const libraryScenario = getDemoScenarioById('ward-sim-surgical-01');

    expect(options).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'day-care-treatment-pathway',
        label: 'Day Care treatment pathway review'
      }),
      expect.objectContaining({
        id: 'ward-sim-surgical-01',
        label: expect.stringContaining('Surgical')
      })
    ]));
    expect(libraryScenario).toEqual(expect.objectContaining({
      id: 'ward-sim-surgical-01',
      currentWardName: 'Surgical Ward Alpha',
      hospitalName: 'Cityview Community Hospital',
      selectedPatientId: expect.stringMatching(/^WS-SURG-/)
    }));
    expect(libraryScenario.patients.length).toBeGreaterThanOrEqual(3);
    expect(libraryScenario.patients[0].riskFlags.length).toBeGreaterThan(0);
  });

  it('returns a cloned scenario definition for each id', () => {
    const scenario = getDemoScenarioById('amu-discharge-readiness-review');

    expect(scenario).toMatchObject({
      id: 'amu-discharge-readiness-review',
      selectedPatientId: 'DCU-044',
      currentWardName: 'Acute Medical Unit'
    });
    expect(getDemoScenarioById('amu-discharge-readiness-review')).toEqual(scenario);

    const surgicalScenario = getDemoScenarioById('surgical-postop-deterioration-review');
    expect(surgicalScenario).toMatchObject({
      id: 'surgical-postop-deterioration-review',
      selectedPatientId: 'DCU-028',
      currentWardName: 'Surgical Ward'
    });
    expect(getDemoScenarioById('surgical-postop-deterioration-review')).toEqual(surgicalScenario);
  });
});
