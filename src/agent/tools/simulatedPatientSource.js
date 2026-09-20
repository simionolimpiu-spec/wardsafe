import { simulatedPatients } from '../../data/simulatedPatients.js';
import { frozenCopy } from '../domainValues.js';

export function createSimulatedPatientSource(patients = simulatedPatients) {
  const snapshot = frozenCopy(patients);
  return Object.freeze({
    getPatient(patientId) {
      const patient = snapshot.find(({ id }) => id === patientId);
      if (!patient) throw new Error('Unknown simulation patient.');
      return patient;
    }
  });
}
