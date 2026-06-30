import { buildSimulationSignals } from '../domain/signalEngine.js';
import { getDemoScenarioById, getDefaultDemoScenario } from '../data/demoScenarios.js';
import { initialAuditEvents } from '../domain/workflowEvents.js';

const defaultSettings = {
  compactMode: false,
  draftProvider: 'auto',
  simulationUser: 'Leanne Mitchell'
};
const SIMULATION_WORKSPACE_VERSION = 2;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deterministicTime(sequence) {
  const minutes = sequence % (24 * 60);
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${minute}`;
}

function createWorkspaceAuditEvent(
  state,
  action,
  label,
  detail,
  patientId = null,
  fallbackActor = state.settings.simulationUser
) {
  const sequence = state.auditEvents.length + 1;
  return {
    id: action.meta?.id ?? `audit-${sequence}`,
    time: action.meta?.time ?? deterministicTime(sequence),
    actor: action.meta?.actor ?? fallbackActor,
    label,
    detail,
    patientId
  };
}

function withAudit(state, event) {
  return {
    ...state,
    auditEvents: [event, ...state.auditEvents]
  };
}

function updatePatient(state, patientId, update) {
  return {
    ...state,
    patients: state.patients.map((patient) =>
      patient.id === patientId ? update(patient) : patient
    )
  };
}

function findPatient(state, patientId) {
  return state.patients.find((patient) => patient.id === patientId);
}

function taskCount(state) {
  return state.patients.reduce((total, patient) => total + patient.tasks.length, 0);
}

function patientEscalationStatus(escalations, patientId) {
  const open = escalations.filter(
    (escalation) => escalation.patientId === patientId && escalation.status !== 'Closed'
  );

  if (open.some((escalation) => escalation.status === 'Active')) return 'Active';
  if (open.length > 0) return 'Monitoring';
  return 'None';
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function normaliseTextList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry ?? '').trim()))
    .filter(Boolean);
}

function normaliseSnapshotEntry(entry) {
  if (!isPlainObject(entry)) return null;
  const cloned = safeClone(entry);
  return isPlainObject(cloned) ? cloned : null;
}

function normaliseSignalSnapshot(snapshot) {
  const fallback = {
    signalTimeline: [],
    riskSuggestions: [],
    sourceFreshness: {
      state: 'unavailable',
      label: 'No signal freshness available.'
    },
    missingDataNotes: [],
    receivedAt: null
  };

  if (!isPlainObject(snapshot)) {
    return fallback;
  }

  const sourceFreshnessClone = safeClone(snapshot.sourceFreshness);
  const sourceFreshness = isPlainObject(sourceFreshnessClone)
    ? {
        ...sourceFreshnessClone,
        state:
          typeof sourceFreshnessClone.state === 'string' && sourceFreshnessClone.state.trim()
            ? sourceFreshnessClone.state.trim()
            : fallback.sourceFreshness.state,
        label:
          typeof sourceFreshnessClone.label === 'string' && sourceFreshnessClone.label.trim()
            ? sourceFreshnessClone.label.trim()
            : fallback.sourceFreshness.label
      }
    : { ...fallback.sourceFreshness };

  return {
    signalTimeline: Array.isArray(snapshot.signalTimeline)
      ? snapshot.signalTimeline.map(normaliseSnapshotEntry).filter(Boolean)
      : [],
    riskSuggestions: Array.isArray(snapshot.riskSuggestions)
      ? snapshot.riskSuggestions.map(normaliseSnapshotEntry).filter(Boolean)
      : [],
    sourceFreshness,
    missingDataNotes: normaliseTextList(snapshot.missingDataNotes),
    receivedAt:
      typeof snapshot.receivedAt === 'string' && snapshot.receivedAt.trim()
        ? snapshot.receivedAt.trim()
        : null
  };
}

export function createInitialSimulationState(scenarioId = getDefaultDemoScenario().id) {
  return buildSimulationState(getDemoScenarioById(scenarioId));
}

export function simulationReducer(state, action) {
  const currentState = {
    ...state,
    intelligence: state.intelligence ?? { suggestionActions: [] },
    signalSnapshots: isPlainObject(state.signalSnapshots) ? state.signalSnapshots : {}
  };

  switch (action.type) {
    case 'navigation/changed':
      return { ...state, selectedView: action.payload.view };

    case 'patient/selected':
      return { ...state, selectedPatientId: action.payload.patientId };

    case 'scenario/selected':
      return {
        ...buildSimulationState(getDemoScenarioById(action.payload.scenarioId)),
        settings: { ...state.settings },
        selectedView: state.selectedView
      };

    case 'task/added': {
      const { patientId, label, owner, due } = action.payload;
      if (!findPatient(state, patientId)) return state;

      const task = {
        id: action.payload.id ?? `task-${taskCount(state) + 1}`,
        label,
        owner,
        due,
        status: 'Due'
      };
      const nextState = updatePatient(state, patientId, (patient) => ({
        ...patient,
        tasks: [...patient.tasks, task]
      }));
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(state, action, 'Task added', label, patientId)
      );
    }

    case 'task/statusChanged': {
      const { patientId, taskId, status } = action.payload;
      const patient = findPatient(state, patientId);
      const targetTask = patient?.tasks.find((task) => task.id === taskId);
      if (!targetTask) return state;

      const nextState = updatePatient(state, patientId, (patient) => ({
        ...patient,
        tasks: patient.tasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      }));
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          state,
          action,
          `Task marked ${status}`,
          `${targetTask.label}: ${status}`,
          patientId
        )
      );
    }

    case 'observation/added': {
      const { patientId, news2, respiratoryRate, oxygenSaturation } = action.payload;
      const patient = findPatient(state, patientId);
      if (!patient) return state;

      const sequence = patient.observations.length + 1;
      const observation = {
        id: action.payload.id ?? `observation-${patientId}-${sequence}`,
        time: action.meta?.time ?? deterministicTime(sequence),
        news2: Number(news2),
        respiratoryRate,
        oxygenSaturation
      };
      const nextState = updatePatient(state, patientId, (patient) => ({
        ...patient,
        news2: Number(news2),
        observations: [...patient.observations, observation]
      }));
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          state,
          action,
          'Observation recorded',
          `NEWS2 ${news2}`,
          patientId
        )
      );
    }

    case 'escalation/created': {
      const { patientId, reason, owner } = action.payload;
      if (!findPatient(state, patientId)) return state;

      const escalation = {
        id: action.payload.id ?? `escalation-${state.escalations.length + 1}`,
        patientId,
        reason,
        owner,
        status: 'Active'
      };
      const nextState = updatePatient(
        { ...state, escalations: [escalation, ...state.escalations] },
        patientId,
        (patient) => ({ ...patient, escalation: 'Active' })
      );
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(state, action, 'Escalation created', reason, patientId)
      );
    }

    case 'escalation/statusChanged': {
      const { escalationId, status } = action.payload;
      const current = state.escalations.find((escalation) => escalation.id === escalationId);
      if (!current) return state;
      if (action.payload.patientId !== undefined && action.payload.patientId !== current.patientId) {
        return state;
      }
      if (current.status === status) return state;

      const patientId = current.patientId;
      if (!findPatient(state, patientId)) return state;

      const escalations = state.escalations.map((escalation) =>
        escalation.id === escalationId ? { ...escalation, status } : escalation
      );
      const nextState = updatePatient({ ...state, escalations }, patientId, (patient) => ({
        ...patient,
        escalation: patientEscalationStatus(escalations, patientId)
      }));
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          state,
          action,
          `Escalation ${status}`,
          `${escalationId}: ${status}`,
          patientId
        )
      );
    }

    case 'handover/saved': {
      const { patientId, handoverComplete, recommendation } = action.payload;
      if (!findPatient(state, patientId)) return state;

      const nextState = updatePatient(state, patientId, (patient) => ({
        ...patient,
        handoverComplete: Number(handoverComplete),
        sbar: { ...patient.sbar, recommendation }
      }));
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          state,
          action,
          'Handover saved',
          `${handoverComplete}% complete`,
          patientId
        )
      );
    }

    case 'discharge/blockersChanged': {
      const { patientId, blockers } = action.payload;
      if (!findPatient(state, patientId)) return state;

      const nextState = updatePatient(state, patientId, (patient) => ({
        ...patient,
        dischargeBlockers: [...blockers],
        dischargeReady: blockers.length === 0
      }));
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          state,
          action,
          'Discharge blockers updated',
          blockers.length > 0 ? blockers.join(', ') : 'No blockers',
          patientId
        )
      );
    }

    case 'contact/recorded': {
      const patientId = action.payload.patientId;
      if (!findPatient(state, patientId)) return state;

      return withAudit(
        state,
        createWorkspaceAuditEvent(
          state,
          action,
          'Simulated team contact recorded',
          action.payload.detail ?? 'Contact recorded in simulation.',
          patientId
        )
      );
    }

    case 'signal/snapshotStored': {
      const { patientId, snapshot } = action.payload ?? {};
      if (typeof patientId !== 'string' || !findPatient(state, patientId)) return state;

      return {
        ...currentState,
        signalSnapshots: {
          ...currentState.signalSnapshots,
          [patientId]: normaliseSignalSnapshot(snapshot)
        }
      };
    }

    case 'intelligence/suggestionActioned': {
      const { suggestionId, patientId, actionType, actionReason } = action.payload;
      if (!findPatient(currentState, patientId)) return state;

      const currentIntelligence = currentState.intelligence;
      const suggestionActions = currentIntelligence.suggestionActions;
      const nextState = {
        ...currentState,
        intelligence: {
          ...currentIntelligence,
          suggestionActions: [
            {
              id: action.payload.id ?? `suggestion-action-${suggestionActions.length + 1}`,
              suggestionId,
              patientId,
              actionType,
              actionReason
            },
            ...suggestionActions
          ]
        }
      };

      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          currentState,
          action,
          `Intelligence suggestion ${actionType}`,
          actionReason,
          patientId
        )
      );
    }

    case 'settings/changed': {
      const nextState = {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
      return withAudit(
        nextState,
        createWorkspaceAuditEvent(
          state,
          action,
          'Settings updated',
          'Simulation preferences saved.'
        )
      );
    }

    case 'workspace/reset': {
      const resetState = createInitialSimulationState();
      return withAudit(
        resetState,
        createWorkspaceAuditEvent(
          resetState,
          action,
          'Simulation reset',
          'Fictional simulation defaults restored.',
          null,
          state.settings.simulationUser
        )
      );
    }

    default:
      return state;
  }
}

export function selectAllTasks(state) {
  return state.patients.flatMap((patient) =>
    patient.tasks.map((task) => ({
      ...task,
      patientId: patient.id,
      patientName: patient.name
    }))
  );
}

export function selectActiveEscalationCount(state) {
  return state.escalations.filter((escalation) => escalation.status !== 'Closed').length;
}

export function selectPatient(state, patientId = state.selectedPatientId) {
  return state.patients.find((patient) => patient.id === patientId);
}

export function selectPatientSimulationSignals(state, patientId = state.selectedPatientId) {
  const patient = selectPatient(state, patientId);
  if (!patient) return [];

  const snapshots = isPlainObject(state.signalSnapshots) ? state.signalSnapshots : {};
  const snapshot = snapshots[patient.id];
  if (!isPlainObject(snapshot)) return [];

  return buildSimulationSignals({
    patient,
    signals: snapshot.signalTimeline,
    suggestions: snapshot.riskSuggestions,
    snapshotMeta: {
      sourceFreshness: snapshot.sourceFreshness,
      missingDataNotes: snapshot.missingDataNotes,
      receivedAt: snapshot.receivedAt
    }
  });
}

function buildSimulationState(scenario) {
  const patients = clone(scenario.patients).map((patient) => ({
    ...patient,
    observations: Array.isArray(patient.observations) ? patient.observations : []
  }));
  const escalations = patients
    .filter((patient) => patient.escalation !== 'None')
    .map((patient, index) => ({
      id: `escalation-${index + 1}`,
      patientId: patient.id,
      reason: patient.nextAction,
      owner: patient.responsibleNurse,
      status: patient.escalation === 'Active' ? 'Active' : 'Monitoring'
    }));
  const auditEvents = patients.flatMap((patient) =>
    initialAuditEvents(patient).map((event) => ({
      ...event,
      patientId: patient.id
    }))
  ).reverse();

  return {
    version: SIMULATION_WORKSPACE_VERSION,
    selectedScenarioId: scenario.id,
    selectedView: 'board',
    selectedPatientId: scenario.selectedPatientId,
    scenarioDescription: scenario.description,
    currentWardName: scenario.currentWardName,
    hospitalName: scenario.hospitalName,
    wardSummary: clone(scenario.wardSummary),
    patients,
    escalations,
    signalSnapshots: {},
    intelligence: {
      suggestionActions: []
    },
    auditEvents,
    settings: { ...defaultSettings }
  };
}
