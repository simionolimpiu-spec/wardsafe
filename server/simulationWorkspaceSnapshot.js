import {
  createInitialSimulationState,
  selectActiveEscalationCount,
  selectAllTasks
} from '../src/state/simulationWorkspace.js';

const SNAPSHOT_GENERATED_AT = '2026-06-10T09:32:00.000Z';

function summarizeWorkspace(state) {
  const tasks = selectAllTasks(state);
  const openTasks = tasks.filter((task) => task.status !== 'Done');

  return {
    wardName: 'Day Care Unit',
    patientCount: state.patients.length,
    openTaskCount: openTasks.length,
    activeEscalationCount: selectActiveEscalationCount(state),
    dischargeReadyCount: state.patients.filter((patient) => patient.dischargeReady).length,
    highRiskCount: state.patients.filter((patient) => patient.risk === 'High').length
  };
}

function projectPatient(patient) {
  return {
    syntheticPatientRef: patient.id,
    displayLabel: patient.name,
    ageBand: `${patient.age}s`,
    sexLabel: 'fictional',
    riskLevel: patient.risk,
    responsibleNurse: patient.responsibleNurse,
    news2: patient.news2,
    riskFlags: patient.riskFlags,
    nextAction: patient.nextAction,
    escalation: patient.escalation,
    handoverComplete: patient.handoverComplete,
    dischargeReady: patient.dischargeReady,
    dischargeBlockers: patient.dischargeBlockers,
    tasks: patient.tasks.map((task) => ({
      id: task.id,
      label: task.label,
      status: task.status,
      owner: task.owner,
      due: task.due
    }))
  };
}

export function createSimulationWorkspaceSnapshot({
  source = 'local-fictional-fixture',
  generatedAt = SNAPSHOT_GENERATED_AT
} = {}) {
  const state = createInitialSimulationState();

  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    source,
    generatedAt,
    simulationOnly: true,
    safetyBoundary: {
      noLivePatientData: true,
      directCareIdentifiers: false,
      humanReviewRequired: true
    },
    workspace: {
      selectedPatientId: state.selectedPatientId,
      summary: summarizeWorkspace(state),
      patients: state.patients.map(projectPatient),
      escalations: state.escalations,
      auditEvents: state.auditEvents
    }
  };
}
