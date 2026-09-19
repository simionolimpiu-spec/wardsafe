import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { toPatientBannerModel } from './patientBannerModel.js';

describe('toPatientBannerModel', () => {
  it('maps only fields present in the simulation fixture and workspace', () => {
    const model = toPatientBannerModel(simulatedPatients[0], { wardName: 'Day Care Unit', hospitalName: 'Cityview' });

    expect(model.displayName).toBe('DCU-031');
    expect(model.identifiers).toEqual([{ label: 'Name', value: 'Patient 031' }, { label: 'Age', value: 57 }]);
    expect(model.context.map((fact) => fact.value)).toEqual(['Day Care Unit', 'Cityview', 'Leanne Mitchell']);
    expect(model.allergies).toEqual(['Penicillin', 'Latex']);
    expect(model.statuses.map((status) => status.label)).toEqual(['High risk', 'Escalation active']);
  });

  it('does not invent identifiers the data model does not hold', () => {
    const model = toPatientBannerModel(simulatedPatients[0]);
    const labels = [...model.identifiers, ...model.context].map((fact) => fact.label.toLowerCase()).join(' ');
    expect(labels).not.toMatch(/nhs|date of birth|dob|bed|consultant/);
  });

  it('treats a missing allergy field as unavailable, not as none', () => {
    const { allergies, ...withoutAllergies } = simulatedPatients[0];
    expect(allergies.length).toBeGreaterThan(0);
    expect(toPatientBannerModel(withoutAllergies).allergies).toBeUndefined();
  });
});
