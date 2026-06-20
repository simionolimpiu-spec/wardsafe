import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import {
  createInitialSimulationState,
  selectActiveEscalationCount,
  selectAllTasks,
  selectPatient,
  simulationReducer
} from './simulationWorkspace.js';

const meta = {
  id: 'audit-test',
  time: '10:15',
  actor: 'Test User'
};

function reduce(action, state = createInitialSimulationState()) {
  return simulationReducer(state, { ...action, meta });
}

describe('createInitialSimulationState', () => {
  it('creates fictional defaults without sharing mutable fixture data', () => {
    const state = createInitialSimulationState();

    expect(state).toMatchObject({
      version: 1,
      selectedView: 'board',
      selectedPatientId: simulatedPatients[0].id,
      settings: {
        compactMode: false,
        draftProvider: 'auto',
        simulationUser: 'Leanne Mitchell'
      }
    });
    expect(state.patients).not.toBe(simulatedPatients);
    expect(state.patients[0]).not.toBe(simulatedPatients[0]);
    expect(state.patients[0].tasks).not.toBe(simulatedPatients[0].tasks);
    expect(state.patients.every((patient) => patient.observations.length === 0)).toBe(true);
    expect(state.escalations).toEqual([
      expect.objectContaining({
        id: 'escalation-1',
        patientId: 'DCU-031',
        reason: 'Medical review documented',
        owner: 'Leanne Mitchell',
        status: 'Active'
      }),
      expect.objectContaining({
        id: 'escalation-2',
        patientId: 'DCU-028',
        reason: 'Repeat NEWS2 15:00',
        owner: 'Aisha Khan',
        status: 'Monitoring'
      })
    ]);
    expect(state.auditEvents.every((event) => 'patientId' in event)).toBe(true);

    state.patients[0].tasks[0].label = 'Changed locally';
    state.patients[0].labs.potassium[0].value = 99;
    expect(simulatedPatients[0].tasks[0].label).toBe('Medical review');
    expect(simulatedPatients[0].labs.potassium[0].value).toBe(3.8);
  });
});

describe('simulationReducer', () => {
  it('changes navigation and patient selection', () => {
    const navigated = reduce({ type: 'navigation/changed', payload: { view: 'handover' } });
    const selected = reduce(
      { type: 'patient/selected', payload: { patientId: 'DCU-017' } },
      navigated
    );

    expect(selected.selectedView).toBe('handover');
    expect(selected.selectedPatientId).toBe('DCU-017');
  });

  it('adds and completes a task with audit labels', () => {
    const added = reduce({
      type: 'task/added',
      payload: {
        id: 'task-new',
        patientId: 'DCU-017',
        label: 'Simulation check',
        owner: 'Test User',
        due: '11:30'
      }
    });
    const completed = reduce(
      {
        type: 'task/statusChanged',
        payload: { patientId: 'DCU-017', taskId: 'task-new', status: 'Done' }
      },
      added
    );

    expect(selectPatient(added, 'DCU-017').tasks.at(-1)).toEqual({
      id: 'task-new',
      label: 'Simulation check',
      owner: 'Test User',
      due: '11:30',
      status: 'Due'
    });
    expect(selectPatient(completed, 'DCU-017').tasks.at(-1).status).toBe('Done');
    expect(added.auditEvents[0].label).toBe('Task added');
    expect(completed.auditEvents[0].label).toBe('Task marked Done');
  });

  it('records an observation and updates the patient NEWS2', () => {
    const state = reduce({
      type: 'observation/added',
      payload: {
        patientId: 'DCU-028',
        news2: 5,
        respiratoryRate: 22,
        oxygenSaturation: 94
      }
    });
    const patient = selectPatient(state, 'DCU-028');

    expect(patient.news2).toBe(5);
    expect(patient.observations).toEqual([
      expect.objectContaining({
        news2: 5,
        respiratoryRate: 22,
        oxygenSaturation: 94,
        time: '10:15'
      })
    ]);
    expect(state.auditEvents[0].label).toBe('Observation recorded');
  });

  it('creates and closes an escalation while keeping the patient consistent', () => {
    const created = reduce({
      type: 'escalation/created',
      payload: {
        id: 'escalation-new',
        patientId: 'DCU-017',
        reason: 'Simulation review requested',
        owner: 'Test User'
      }
    });
    const closed = reduce(
      {
        type: 'escalation/statusChanged',
        payload: { escalationId: 'escalation-new', status: 'Closed' }
      },
      created
    );

    expect(selectPatient(created, 'DCU-017').escalation).toBe('Active');
    expect(selectActiveEscalationCount(created)).toBe(3);
    expect(selectPatient(closed, 'DCU-017').escalation).toBe('None');
    expect(selectActiveEscalationCount(closed)).toBe(2);
    expect(closed.auditEvents[0].label).toBe('Escalation Closed');
  });

  it('keeps a patient escalated while another non-closed escalation remains', () => {
    const created = reduce({
      type: 'escalation/created',
      payload: {
        id: 'escalation-extra',
        patientId: 'DCU-031',
        reason: 'Second simulation review',
        owner: 'Test User'
      }
    });
    const closed = reduce(
      {
        type: 'escalation/statusChanged',
        payload: {
          patientId: 'DCU-031',
          escalationId: 'escalation-extra',
          status: 'Closed'
        }
      },
      created
    );

    expect(selectPatient(closed, 'DCU-031').escalation).toBe('Active');
  });

  it('updates handover progress and the SBAR recommendation', () => {
    const state = reduce({
      type: 'handover/saved',
      payload: {
        patientId: 'DCU-044',
        handoverComplete: 80,
        recommendation: 'Continue fictional scenario review.'
      }
    });

    expect(selectPatient(state, 'DCU-044')).toMatchObject({
      handoverComplete: 80,
      sbar: { recommendation: 'Continue fictional scenario review.' }
    });
    expect(state.auditEvents[0].label).toBe('Handover saved');
  });

  it('derives discharge readiness from blockers', () => {
    const blocked = reduce({
      type: 'discharge/blockersChanged',
      payload: { patientId: 'DCU-052', blockers: ['Simulation checklist incomplete'] }
    });
    const ready = reduce(
      {
        type: 'discharge/blockersChanged',
        payload: { patientId: 'DCU-052', blockers: [] }
      },
      blocked
    );

    expect(selectPatient(blocked, 'DCU-052').dischargeReady).toBe(false);
    expect(selectPatient(ready, 'DCU-052')).toMatchObject({
      dischargeBlockers: [],
      dischargeReady: true
    });
  });

  it('records contacts as audit-only events', () => {
    const initial = createInitialSimulationState();
    const state = reduce(
      {
        type: 'contact/recorded',
        payload: { patientId: 'DCU-028', detail: 'Fictional contact logged.' }
      },
      initial
    );

    expect(state.patients).toBe(initial.patients);
    expect(state.auditEvents[0]).toMatchObject({
      label: 'Simulated team contact recorded',
      detail: 'Fictional contact logged.',
      patientId: 'DCU-028'
    });
  });

  it('merges settings and audits the change', () => {
    const state = reduce({
      type: 'settings/changed',
      payload: { compactMode: true, draftProvider: 'local' }
    });

    expect(state.settings).toEqual({
      compactMode: true,
      draftProvider: 'local',
      simulationUser: 'Leanne Mitchell'
    });
    expect(state.auditEvents[0]).toMatchObject({
      id: 'audit-test',
      time: '10:15',
      actor: 'Test User',
      label: 'Settings updated',
      patientId: null
    });
  });

  it('resets fictional defaults and prepends a reset audit event', () => {
    const changed = reduce({
      type: 'settings/changed',
      payload: { compactMode: true }
    });
    const reset = reduce({ type: 'workspace/reset' }, changed);

    expect(reset.settings.compactMode).toBe(false);
    expect(reset.selectedPatientId).toBe(simulatedPatients[0].id);
    expect(reset.auditEvents[0]).toMatchObject({
      id: 'audit-test',
      label: 'Simulation reset',
      patientId: null
    });
  });

  it('keeps fallback audit IDs unique across a reset boundary', () => {
    let state = createInitialSimulationState();
    state = simulationReducer(state, {
      type: 'settings/changed',
      payload: { compactMode: true }
    });
    state = simulationReducer(state, { type: 'workspace/reset' });
    state = simulationReducer(state, {
      type: 'settings/changed',
      payload: { compactMode: true }
    });

    const auditIds = state.auditEvents.map((event) => event.id);
    expect(new Set(auditIds).size).toBe(auditIds.length);
  });

  it('attributes reset to the pre-reset simulation user while preserving reset sequencing', () => {
    const customized = simulationReducer(createInitialSimulationState(), {
      type: 'settings/changed',
      payload: { simulationUser: 'Alice Jones' }
    });
    const baselineReset = simulationReducer(createInitialSimulationState(), {
      type: 'workspace/reset'
    });
    const reset = simulationReducer(customized, { type: 'workspace/reset' });

    expect(reset.auditEvents[0]).toMatchObject({
      id: baselineReset.auditEvents[0].id,
      time: baselineReset.auditEvents[0].time,
      actor: 'Alice Jones'
    });

    const overridden = simulationReducer(customized, {
      type: 'workspace/reset',
      meta: { id: 'reset-override', time: '14:20', actor: 'Override User' }
    });
    expect(overridden.auditEvents[0]).toMatchObject({
      id: 'reset-override',
      time: '14:20',
      actor: 'Override User'
    });
  });

  it('returns the same state object for unknown actions', () => {
    const state = createInitialSimulationState();

    expect(simulationReducer(state, { type: 'unknown/action' })).toBe(state);
  });

  it('produces deeply equal output for equivalent state and action inputs', () => {
    const actions = [
      {
        type: 'task/added',
        payload: {
          patientId: 'DCU-017',
          label: 'Deterministic task',
          owner: 'Test User',
          due: '12:30'
        }
      },
      {
        type: 'observation/added',
        payload: {
          patientId: 'DCU-028',
          news2: 5,
          respiratoryRate: 22,
          oxygenSaturation: 94
        }
      },
      {
        type: 'escalation/created',
        payload: {
          patientId: 'DCU-017',
          reason: 'Deterministic simulation review',
          owner: 'Test User'
        }
      },
      {
        type: 'handover/saved',
        payload: {
          patientId: 'DCU-044',
          handoverComplete: 50,
          recommendation: 'Deterministic recommendation.'
        }
      },
      {
        type: 'discharge/blockersChanged',
        payload: { patientId: 'DCU-052', blockers: [] }
      },
      {
        type: 'contact/recorded',
        payload: { patientId: 'DCU-028', detail: 'Deterministic contact.' }
      },
      { type: 'settings/changed', payload: { compactMode: true } },
      { type: 'workspace/reset' }
    ];

    for (const action of actions) {
      const first = simulationReducer(createInitialSimulationState(), action);
      const second = simulationReducer(createInitialSimulationState(), action);

      expect(first).toEqual(second);
    }
  });

  it.each([
    ['task/added', { label: 'Missing patient task', owner: 'Test User', due: '13:00' }],
    [
      'observation/added',
      { news2: 4, respiratoryRate: 20, oxygenSaturation: 95 }
    ],
    ['escalation/created', { reason: 'Missing patient review', owner: 'Test User' }],
    [
      'handover/saved',
      { handoverComplete: 100, recommendation: 'Missing patient recommendation.' }
    ],
    ['discharge/blockersChanged', { blockers: [] }],
    ['contact/recorded', { detail: 'Missing patient contact.' }]
  ])('ignores %s for an unknown patient without auditing', (type, payload) => {
    const state = createInitialSimulationState();
    const auditLength = state.auditEvents.length;
    const result = simulationReducer(state, {
      type,
      payload: { patientId: 'DCU-999', ...payload },
      meta
    });

    expect(result).toBe(state);
    expect(result.auditEvents).toHaveLength(auditLength);
  });

  it('ignores task status changes when the patient or task is missing', () => {
    const state = createInitialSimulationState();
    const auditLength = state.auditEvents.length;
    const missingPatient = simulationReducer(state, {
      type: 'task/statusChanged',
      payload: { patientId: 'DCU-999', taskId: 'task-1', status: 'Done' },
      meta
    });
    const missingTask = simulationReducer(state, {
      type: 'task/statusChanged',
      payload: { patientId: 'DCU-031', taskId: 'task-missing', status: 'Done' },
      meta
    });

    expect(missingPatient).toBe(state);
    expect(missingTask).toBe(state);
    expect(state.auditEvents).toHaveLength(auditLength);
  });

  it('ignores missing or patient-mismatched escalation status changes', () => {
    const state = createInitialSimulationState();
    const auditLength = state.auditEvents.length;
    const missing = simulationReducer(state, {
      type: 'escalation/statusChanged',
      payload: { escalationId: 'escalation-missing', status: 'Closed' },
      meta
    });
    const mismatched = simulationReducer(state, {
      type: 'escalation/statusChanged',
      payload: {
        patientId: 'DCU-028',
        escalationId: 'escalation-1',
        status: 'Closed'
      },
      meta
    });

    expect(missing).toBe(state);
    expect(mismatched).toBe(state);
    expect(state.auditEvents).toHaveLength(auditLength);
  });

  it('ignores an escalation status change that is not a real transition', () => {
    const state = createInitialSimulationState();
    const auditLength = state.auditEvents.length;
    const result = simulationReducer(state, {
      type: 'escalation/statusChanged',
      payload: { escalationId: 'escalation-1', status: 'Active' },
      meta
    });

    expect(result).toBe(state);
    expect(result.auditEvents).toHaveLength(auditLength);
  });
});

describe('selectors', () => {
  it('reflects current nested tasks and uses the selected patient by default', () => {
    const initial = createInitialSimulationState();
    const state = reduce(
      {
        type: 'task/added',
        payload: {
          id: 'task-selector',
          patientId: initial.selectedPatientId,
          label: 'Selector task',
          owner: 'Test User',
          due: '12:00'
        }
      },
      initial
    );

    expect(selectAllTasks(state)).toHaveLength(
      simulatedPatients.reduce((total, patient) => total + patient.tasks.length, 0) + 1
    );
    expect(selectAllTasks(state).find((task) => task.id === 'task-selector')).toMatchObject({
      id: 'task-selector',
      patientId: initial.selectedPatientId,
      patientName: simulatedPatients[0].name
    });
    expect(selectPatient(state).id).toBe(initial.selectedPatientId);
    expect(selectPatient(state, 'missing-patient')).toBeUndefined();
  });
});
