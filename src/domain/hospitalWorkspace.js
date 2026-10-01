import { getPopulatedHospital } from './wardPopulation.js';
import { DEFAULT_ACTIVITY_DATE } from './daySurgery.js';

export function hospitalWorkspaceKey(hospitalId, wardId, date = DEFAULT_ACTIVITY_DATE) {
  return `hospital:v3:${hospitalId}:${wardId}:${date}`;
}

// Adapt the existing fictional census without inventing missing medicines,
// results, completed handovers or documented escalation activity.
export function createHospitalWardScenario(hospitalId, wardId, date = DEFAULT_ACTIVITY_DATE) {
  date = date ?? DEFAULT_ACTIVITY_DATE;
  const hospital = getPopulatedHospital(hospitalId, date);
  const ward = hospital?.wards.find((item) => item.id === wardId);
  if (!ward || !ward.patients.length) return null;
  const patients = ward.patients.map((patient) => ({
    ...patient,
    source: 'hospital-census',
    risk: { red: 'High', amber: 'Medium', green: 'Low' }[patient.rag] ?? 'Unknown',
    riskFlags: [patient.dayCase ? `Day surgery: ${patient.dayCase.stage}` : 'Fictional care-status review'],
    baseline: [...patient.comorbidities],
    currentState: [patient.diagnosis, ...(patient.dayCase ? [patient.dayCase.stage] : [])],
    allergies: patient.allergy ? [patient.allergy] : [],
    medicines: [], symptoms: [], labs: {}, plan: '',
    tasks: [], observations: [], responseHistory: [],
    escalation: 'None', handoverComplete: patient.dayCase?.departure != null ? 100 : 0,
    dischargeReady: patient.dayCase?.stage === 'Discharged',
    dischargeBlockers: patient.dayCase?.stage === 'Discharged' ? [] : [patient.dayCase?.transfer ? 'Inpatient transfer recorded; not a home discharge' : 'Discharge readiness not yet reviewed'],
    nextAction: patient.dayCase ? `${patient.dayCase.stage}. Human review required.` : `Review ${ward.profile.focus.toLowerCase()}.`,
    sbar: {
      situation: `${patient.name}, ${patient.bed}: ${patient.diagnosis}. ${patient.dayCase ? `Day surgery ${patient.dayCase.stage}.` : ''} Fictional census.`,
      background: patient.comorbidities.join(', ') || 'Background not recorded.',
      assessment: 'Care-status snapshot only. Detailed assessment not recorded.',
      recommendation: 'Human review required. Document the review and agreed next action.'
    }
  }));
  return {
    id: hospitalWorkspaceKey(hospitalId, wardId, date),
    censusVersion: 3, activityDate: date, serviceProfile: ward.profile,
    label: `${hospital.shortName} · ${ward.name}`,
    description: 'Connected fictional ward workspace. Human review required.',
    hospitalName: hospital.name, currentWardName: ward.name,
    selectedHospitalId: hospitalId, selectedWardId: wardId,
    selectedPatientId: patients[0]?.id,
    patients,
    wardSummary: {
      unitName: ward.name, dateLabel: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }), lastUpdated: '14:00 fictional snapshot',
      metrics: { patients: patients.length, activeEscalations: 0,
    highNews: patients.every((patient) => patient.observationScale !== 'NEWS2') ? null : patients.filter((patient) => patient.news2 >= 5).length,
        handoverCompletePercent: 0, dischargeReadyToday: 0 }
    }
  };
}

export function directoryPatientsForWard(state, hospitalId, wardId, fallback, date = state.activityDate ?? DEFAULT_ACTIVITY_DATE) {
  const key = hospitalWorkspaceKey(hospitalId, wardId, date);
  const workspace = state.selectedScenarioId === key ? state : state.workspaces?.[key];
  return workspace?.patients ?? fallback;
}
