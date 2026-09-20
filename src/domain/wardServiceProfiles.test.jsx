import { expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { serviceProfile, documentationFor } from './wardServiceProfiles.js';
import { generateWard, getPopulatedHospitals, patientServiceRecord } from './wardPopulation.js';
import { assumption, auditServiceEvidence, evidenceNeedsReview, simulationDestination } from '../data/clinical/serviceDefinitions.js';
import { ServiceEvidence, HospitalCapabilities } from '../components/hospitals/ServiceEvidence.jsx';
import { PatientNameWithChart } from '../components/hospitals/PatientNameWithChart.jsx';
import { scanBoundaryAwareSafetyLanguage } from './safetyLanguage.js';

const ward = { id: 'test-ward', name: 'Test ward', specialty: 'Surgery', kind: 'inpatient', simulatedBedCount: 20,
  serviceDefinition: { category: 'generalSurgery' } };
it('preserves explicit zero capacity and ward overrides with auditable defaults', () => {
  const profile = serviceProfile({ ...ward, serviceDefinition: { category: 'generalSurgery', capacity: assumption(0),
    simulation: { stayDays: [2, 3], occupancyPercent: [20, 30], staffNurses: [2, 2] } } });
  expect(profile).toMatchObject({ capacity: 0, stay: [2, 3], occupancy: [20, 30], staffNurses: [2, 2] });
  expect(profile.fieldEvidence.capacity.status).toBe('simulation-assumption');
  expect(profile.fieldEvidence.stayDays.value).toEqual([2, 3]);
  expect(profile.fieldEvidence.careLevelShare.value).toEqual({ 0: .9, 1: .1 });
});
it('rejects malformed ranges and probability mixes instead of silently generating inconsistent patients', () => {
  for (const simulation of [{ stayDays: [5, 1] }, { occupancyPercent: [0, 101] },
    { careLevelShare: { 0: .7, 1: .7 } }, { careLevelShare: { 0: 1, 3: 0 } }, { careLevelShare: { 0: NaN, 1: 0 } }]) {
    expect(() => serviceProfile({ ...ward, serviceDefinition: { category: 'generalSurgery', simulation } })).toThrow(/Invalid simulation/);
  }
});
it('samples patient levels reproducibly with a minority at level 1 and respects explicit recorded levels', () => {
  const profile = serviceProfile(ward);
  const records = Array.from({ length: 1000 }, (_, index) => patientServiceRecord(profile, String(index)));
  expect(records.filter((record) => record.simulatedCareLevel === 1).length).toBeGreaterThan(50);
  expect(records.filter((record) => record.simulatedCareLevel === 1).length).toBeLessThan(150);
  expect(patientServiceRecord(profile, 'fixed')).toEqual(patientServiceRecord(profile, 'fixed'));
  expect(patientServiceRecord(profile, 'fixed', 0).simulatedCareLevel).toBe(0);
  expect(patientServiceRecord(profile, 'fixed', null).simulatedCareLevel).toBeNull();
  expect(() => patientServiceRecord(profile, 'fixed', 3)).toThrow(/exceeds/);
});
it('keeps combined critical care mixed and dedicated level 2 services distinct', () => {
  const hospitals = getPopulatedHospitals();
  const combined = hospitals[0].wards.find((item) => item.id === 'jpuh-icu-hdu');
  expect(new Set(combined.patients.map((patient) => patient.simulatedCareLevel))).toEqual(new Set([2, 3]));
  const hdu = hospitals[2].wards.find((item) => item.id === 'cuh-f5');
  expect(hdu.patients.every((patient) => patient.simulatedCareLevel === 2)).toBe(true);
  expect(hdu.patients.every((patient) => patient.documentationTopics.includes('Transplant-team review record'))).toBe(true);
});
it('never assigns adult levels or adult critical-care documentation to neonatal, paediatric or maternity records', () => {
  for (const category of ['neonatal', 'paediatrics', 'maternity']) {
    const profile = serviceProfile({ ...ward, serviceDefinition: { category } });
    expect(patientServiceRecord(profile, 'child').simulatedCareLevel).toBeNull();
    expect(documentationFor(profile, 3)).toEqual([]);
    expect(() => serviceProfile({ ...ward, serviceDefinition: { category, supportedCareLevels: [2, 3] } })).toThrow(/Adult care levels/);
  }
});
it('does not attach the James Paget list to another day unit or generate procedure-area patients', () => {
  const other = generateWard({ ...ward, serviceDefinition: { category: 'daySurgery', serviceType: 'day-surgery' } }, 'test');
  expect(other.patients).toEqual([]);
  for (const mode of ['admission-area', 'discharge-lounge', 'procedure-area']) {
    const profile = serviceProfile({ ...ward, serviceDefinition: { category: 'generalSurgery', serviceType: mode } });
    expect(documentationFor(profile, 3)).toEqual([]);
    expect(documentationFor(profile).join(' ')).not.toMatch(/organ-support|level 3/i);
    if (mode === 'procedure-area') expect(generateWard({ ...ward, serviceDefinition: { category: 'generalSurgery', serviceType: mode } }, 'test').patients).toEqual([]);
  }
});
it('audits inherited assumptions and missing citations as well as capability entries', () => {
  const findings = auditServiceEvidence(getPopulatedHospitals());
  for (const field of ['careLevels', 'careLevelShare', 'occupancyPercent', 'staffNurses']) expect(findings.some((item) => item.field === field)).toBe(true);
  expect(findings.some((item) => item.field.startsWith('capability:'))).toBe(true);
  expect(evidenceNeedsReview({ status: 'published' })).toBe(true);
  expect(simulationDestination('cuh', 'adult-critical-care', 'jpuh-icu-hdu')).toBeNull();
  expect(simulationDestination('jpuh', 'adult-critical-care', 'jpuh-icu-hdu')).toMatchObject({ humanReviewRequired: true });
});
it('exposes per-field sources, withheld conflicts and reviewable assumptions in accessible details', () => {
  const profile = serviceProfile({ ...ward, serviceDefinition: { category: 'generalSurgery', capacity: { value: 999, status: 'conflicting', note: 'Resolve source disagreement.' } } });
  const { container } = render(<><ServiceEvidence profile={profile} /><HospitalCapabilities hospital={getPopulatedHospitals()[1]} /></>);
  expect(screen.getByText(/Value withheld/)).toBeInTheDocument();
  expect(container.textContent).not.toContain('999');
  expect(screen.getByText(/Fictional patient mix by level/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /source for specialist trauma care/i, hidden: true })).toHaveAttribute('href', 'https://www.nnuh.nhs.uk/our-services/emergency-care/trauma-services/');
  expect(scanBoundaryAwareSafetyLanguage(container.textContent).violations).toEqual([]);
});
it('shows patient-level documentation as review topics without claiming completion', () => {
  const patient = getPopulatedHospitals()[0].wards.find((item) => item.id === 'jpuh-icu-hdu').patients[0];
  render(<PatientNameWithChart patient={patient} />);
  fireEvent.click(screen.getByRole('button', { name: patient.name }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText(/Simulated adult care level/)).toBeInTheDocument();
  expect(within(dialog).getByText(/completion has not been recorded/)).toBeInTheDocument();
  expect(scanBoundaryAwareSafetyLanguage(dialog.textContent).violations).toEqual([]);
});
