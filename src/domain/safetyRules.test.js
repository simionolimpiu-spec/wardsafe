import { describe, expect, it } from 'vitest';
import { evaluatePotassiumSafetyGap } from './safetyRules.js';

const basePatient = {
  id: 'DCU-031',
  name: 'Patient 031',
  medicines: ['Furosemide 40mg OD'],
  symptoms: ['Weakness', 'Poor oral intake'],
  labs: {
    potassium: [
      { time: '2026-06-17T07:00:00Z', value: 3.8 },
      { time: '2026-06-17T13:00:00Z', value: 3.2 }
    ],
    magnesium: [],
    creatinine: [
      { time: '2026-06-17T07:00:00Z', value: 82 },
      { time: '2026-06-17T13:00:00Z', value: 108 }
    ]
  },
  plan: ''
};

describe('evaluatePotassiumSafetyGap', () => {
  it('flags an explainable possible potassium safety gap without prescribing', () => {
    const result = evaluatePotassiumSafetyGap(basePatient);

    expect(result.level).toBe('medium');
    expect(result.title).toBe('Possible electrolyte / AKI safety gap');
    expect(result.reasons).toContain('Potassium has fallen from 3.8 to 3.2 mmol/L.');
    expect(result.reasons).toContain('Diuretic therapy is present.');
    expect(result.missingInformation).toContain('Magnesium result not visible.');
    expect(result.boundary).toContain('does not prescribe');
    expect(result.recommendedNursingActions.join(' ')).not.toMatch(/administer|prescribe|replace potassium/i);
  });

  it('does not flag when potassium falls slightly but remains above the concern threshold', () => {
    const result = evaluatePotassiumSafetyGap({
      ...basePatient,
      labs: {
        ...basePatient.labs,
        potassium: [
          { time: '2026-06-17T07:00:00Z', value: 4.1 },
          { time: '2026-06-17T13:00:00Z', value: 4.0 }
        ],
        magnesium: [{ time: '2026-06-17T13:00:00Z', value: 0.82 }]
      },
      plan: 'Electrolytes reviewed by medical team. Repeat U&Es tomorrow.'
    });

    expect(result.level).toBe('none');
    expect(result.reasons).toContain('No low falling potassium trend detected.');
  });

  it('does not throw when lab arrays are missing', () => {
    const result = evaluatePotassiumSafetyGap({
      id: 'DCU-099',
      name: 'Patient 099',
      medicines: [],
      symptoms: [],
      labs: {},
      plan: 'Review complete.'
    });

    expect(result.level).toBe('none');
    expect(result.reasons).toContain('No low falling potassium trend detected.');
  });

  it('treats a potassium value exactly at 3.4 mmol/L as a boundary, not an automatic gap', () => {
    const result = evaluatePotassiumSafetyGap({
      id: 'DCU-100',
      medicines: [],
      symptoms: [],
      labs: {
        potassium: [
          { time: '2026-06-17T07:00:00Z', value: 3.5 },
          { time: '2026-06-17T13:00:00Z', value: 3.4 }
        ],
        magnesium: [{ time: '2026-06-17T13:00:00Z', value: 0.82 }],
        creatinine: [
          { time: '2026-06-17T07:00:00Z', value: 82 },
          { time: '2026-06-17T13:00:00Z', value: 82 }
        ]
      },
      plan: 'Electrolytes reviewed and a current plan is visible.'
    });

    expect(result.level).toBe('none');
    expect(result.reasons).toContain('Potassium has fallen from 3.5 to 3.4 mmol/L.');
    expect(result.missingInformation).toEqual([]);
  });

  it('stays defensive when the patient record is sparse or partially undefined', () => {
    const result = evaluatePotassiumSafetyGap({
      id: 'DCU-101',
      medicines: undefined,
      symptoms: undefined,
      labs: undefined,
      plan: undefined
    });

    expect(result.level).toBe('none');
    expect(result.reasons).toContain('No low falling potassium trend detected.');
    expect(result.missingInformation).toEqual(expect.arrayContaining([
      'Magnesium result not visible.',
      'No clear electrolyte plan documented.'
    ]));
  });
});
