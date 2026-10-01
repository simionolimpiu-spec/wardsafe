import { describe, it, expect } from 'vitest';
import {
  getPopulatedHospitals, getPopulatedHospital, generateWard, resolveClinicalCategory
} from './wardPopulation.js';
import { FEATURED_HOSPITALS } from '../data/clinical/selectedHospitals.js';

describe('ward population generator', () => {
  it('builds exactly three featured hospitals', () => {
    const hospitals = getPopulatedHospitals();
    expect(hospitals).toHaveLength(3);
    expect(hospitals.map((h) => h.id)).toEqual(['jpuh', 'nnuh', 'cuh']);
  });

  it('is deterministic across calls', () => {
    const a = getPopulatedHospital('jpuh');
    const b = getPopulatedHospital('jpuh');
    expect(a.wards[0].patients[0].name).toBe(b.wards[0].patients[0].name);
  });

  it('gives fictional patients a service-appropriate location and observation scale', () => {
    for (const ward of getPopulatedHospital('nnuh').wards) {
      for (const patient of ward.patients) {
        expect(patient.name).toMatch(/\w+ \w+/);
        expect(patient.name).not.toMatch(/^Patient \d+$/);
        expect(patient.bed).toMatch(/^(Bed|Attendance) \d+$/);
        expect(patient.diagnosis.length).toBeGreaterThan(2);
        expect(['red', 'amber', 'green', 'unknown']).toContain(patient.rag);
        if (patient.observationScale === 'NEWS2') expect(patient.news2).toBeGreaterThanOrEqual(0);
        else expect(patient.news2).toBeNull();
      }
    }
  });

  it('keeps inpatient counts within capacity without forcing every ward into the same occupancy range', () => {
    for (const ward of getPopulatedHospital('cuh').wards) {
      if (ward.profile.mode === 'inpatient') expect(ward.patientCount).toBeLessThanOrEqual(ward.bedCount ?? 0);
      else if (ward.profile.mode !== 'assessment') expect(ward.occupancyRate).toBeNull();
      expect(ward.patients).toHaveLength(ward.patientCount);
    }
  });

  it('uses varying illustrative rosters rather than claiming the real nursing establishment', () => {
    for (const ward of getPopulatedHospital('jpuh').wards) {
      const { staffing } = ward;
      expect(staffing.matron.band).toBe('8a');
      expect(['6', '7']).toContain(staffing.sister.band);
      expect(staffing.inCharge.role).toMatch(/in charge/i);
      expect(staffing.staffNurses.length).toBeGreaterThanOrEqual(3);
      expect(staffing.staffNurses.length).toBeLessThanOrEqual(12);
      staffing.staffNurses.forEach((nurse) => expect(nurse.band).toBe('5'));
    }
    expect(new Set(getPopulatedHospital('jpuh').wards.map((ward) => ward.staffing.staffNurses.length)).size).toBeGreaterThan(2);
  });

  it('maps ward specialties to sensible clinical categories', () => {
    expect(resolveClinicalCategory({ specialty: 'Cardiology', wardGroup: 'medical', name: 'Ward 2' })).toBe('cardiology');
    expect(resolveClinicalCategory({ specialty: 'Stroke Unit', wardGroup: 'medical', name: 'Ward 1' })).toBe('stroke');
    expect(resolveClinicalCategory({ specialty: "Elderly Care", wardGroup: 'frailty', name: 'Ward 12' })).toBe('elderly');
    expect(resolveClinicalCategory({ specialty: 'Intensive Care', wardGroup: 'critical-care', name: 'ICU' })).toBe('criticalCare');
  });

  it('keeps NEWS2 and overall RAG clinically consistent', () => {
    const ward = generateWard(FEATURED_HOSPITALS[0].wards[0], 'jpuh');
    for (const patient of ward.patients) {
      if (patient.news2 >= 7) expect(patient.rag).toBe('red');
      if (patient.rag === 'green') expect(patient.news2).toBeLessThan(5);
    }
  });
});
