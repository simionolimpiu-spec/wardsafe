import { escalationStatus, riskStatus } from '../design-system/clinical/clinicalStates.js';

/**
 * Adapts a simulation patient fixture to PatientBanner props (SF-295).
 * Uses only fields the fixture already holds. The fictional simulation
 * identifier stays the heading, as it was before the design-system migration.
 * NHS number, date of birth, bed and consultant are deliberately absent:
 * the data model does not contain them.
 */
export function toPatientBannerModel(patient, { wardName, hospitalName } = {}) {
  if (!patient) return null;

  return {
    displayName: patient.id,
    identifiers: [
      { label: 'Name', value: patient.name },
      { label: 'Age', value: patient.age }
    ],
    context: [
      { label: 'Ward', value: wardName },
      { label: 'Hospital', value: hospitalName },
      { label: 'Responsible nurse', value: patient.responsibleNurse }
    ],
    allergies: Array.isArray(patient.allergies) ? patient.allergies : undefined,
    statuses: [riskStatus(patient.risk), escalationStatus(patient.escalation)]
  };
}
