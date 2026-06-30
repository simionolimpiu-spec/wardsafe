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

    expect(defaultScenario.id).toBe('day-care-treatment-pathway');
    expect(defaultScenario.selectedPatientId).toBe('DCU-031');
    expect(options).toEqual([
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
      })
    ]);
  });

  it('returns a cloned scenario definition for each id', () => {
    const scenario = getDemoScenarioById('amu-discharge-readiness-review');

    expect(scenario).toMatchObject({
      id: 'amu-discharge-readiness-review',
      selectedPatientId: 'DCU-044',
      currentWardName: 'Acute Medical Unit'
    });
    expect(getDemoScenarioById('amu-discharge-readiness-review')).toEqual(scenario);
  });
});
