import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import {
  createInitialSimulationState,
  selectActiveEscalationCount,
  selectAllTasks,
  selectPatient,
  selectPatientSimulationSignals,
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
      signalSnapshots: {},
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

  it('records nurse actions on intelligence suggestions', () => {
    const state = reduce({
      type: 'intelligence/suggestionActioned',
      payload: {
        suggestionId: 'suggestion-dcu-031-electrolyte-review',
        patientId: 'DCU-031',
        actionType: 'accepted',
        actionReason: 'Reviewed fictional evidence'
      }
    });

    expect(state.intelligence.suggestionActions[0]).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      patientId: 'DCU-031',
      actionType: 'accepted'
    });
    expect(state.auditEvents[0]).toMatchObject({
      label: 'Intelligence suggestion accepted',
      patientId: 'DCU-031'
    });
  });

  it('stores a signal snapshot for a valid patient', () => {
    const state = reduce({
      type: 'signal/snapshotStored',
      payload: {
        patientId: 'DCU-031',
        snapshot: {
          signalTimeline: [
            {
              signalId: 'signal-dcu-031-1',
              code: 'news2',
              value: 7,
              recordedAt: '08:40'
            }
          ],
          riskSuggestions: [
            {
              suggestionId: 'suggestion-dcu-031-electrolyte-review',
              title: 'Review suggested: electrolyte review',
              riskTier: 'watch'
            }
          ],
          sourceFreshness: {
            state: 'current',
            label: 'Latest simulated signal feed'
          },
          missingDataNotes: ['Magnesium result not visible.'],
          receivedAt: '09:10'
        }
      }
    });

    expect(state.signalSnapshots['DCU-031']).toEqual({
      signalTimeline: [
        {
          signalId: 'signal-dcu-031-1',
          code: 'news2',
          value: 7,
          recordedAt: '08:40'
        }
      ],
      riskSuggestions: [
        {
          suggestionId: 'suggestion-dcu-031-electrolyte-review',
          title: 'Review suggested: electrolyte review',
          riskTier: 'watch'
        }
      ],
      sourceFreshness: {
        state: 'current',
        label: 'Latest simulated signal feed'
      },
      missingDataNotes: ['Magnesium result not visible.'],
      receivedAt: '09:10'
    });
  });

  it('derives deterministic patient simulation signals from stored snapshots and current patient workflow state', () => {
    const state = reduce({
      type: 'signal/snapshotStored',
      payload: {
        patientId: 'DCU-031',
        snapshot: {
          signalTimeline: [
            {
              signalId: 'signal-dcu-031-news2-0915',
              syntheticPatientRef: 'DCU-031',
              simulationOnly: true,
              signalCode: 'NEWS2',
              displayName: 'NEWS2',
              value: '7',
              status: 'final',
              effectiveAt: '2026-06-10T09:15:00.000Z',
              sourceFreshness: 'current'
            }
          ],
          riskSuggestions: [
            {
              suggestionId: 'suggestion-dcu-031-electrolyte-review',
              syntheticPatientRef: 'DCU-031',
              simulationOnly: true,
              requiresHumanReview: true,
              riskTier: 'urgent',
              title: 'Electrolyte result review may be needed',
              suggestedTask: 'Review blood trend and document action'
            }
          ],
          sourceFreshness: {
            state: 'current',
            label: 'Latest simulated signal feed'
          },
          missingDataNotes: ['Magnesium result not visible.'],
          receivedAt: '2026-06-10T09:15:00.000Z'
        }
      }
    });

    const first = selectPatientSimulationSignals(state, 'DCU-031');
    const second = selectPatientSimulationSignals(state, 'DCU-031');

    expect(first).toEqual(second);
    expect(first).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'simulation-signal-dcu-031-discharge',
        category: 'discharge',
        simulationOnly: true,
        humanReviewRequired: true,
        unsafeClinicalAdvice: false
      }),
      expect.objectContaining({
        category: 'electrolyte-review',
        priority: 'review'
      })
    ]));
  });

  it('does not derive foreign-patient cues from mismatched snapshot records', () => {
    const state = reduce({
      type: 'signal/snapshotStored',
      payload: {
        patientId: 'DCU-017',
        snapshot: {
          signalTimeline: [
            {
              signalId: 'signal-dcu-028-urine-culture',
              syntheticPatientRef: 'DCU-028',
              simulationOnly: true,
              signalCode: 'urine_culture',
              displayName: 'Urine culture',
              value: 'Positive',
              status: 'final',
              effectiveAt: '2026-06-10T09:15:00.000Z',
              sourceFreshness: 'current'
            }
          ],
          riskSuggestions: [
            {
              suggestionId: 'suggestion-dcu-028-infection-review',
              syntheticPatientRef: 'DCU-028',
              simulationOnly: true,
              requiresHumanReview: true,
              riskTier: 'urgent',
              title: 'Review suggested: infection review'
            }
          ],
          sourceFreshness: {
            state: 'current',
            label: 'Latest simulated signal feed'
          },
          missingDataNotes: [],
          receivedAt: '2026-06-10T09:15:00.000Z'
        }
      }
    });

    const signals = selectPatientSimulationSignals(state, 'DCU-017');

    expect(signals.some((signal) => signal.category === 'infection-review')).toBe(false);
    expect(JSON.stringify(signals)).not.toMatch(/urine culture/i);
  });

  it('ignores invalid patient ids for signal snapshots', () => {
    const state = createInitialSimulationState();
    const result = simulationReducer(state, {
      type: 'signal/snapshotStored',
      payload: {
        patientId: 'DCU-999',
        snapshot: {
          signalTimeline: [],
          riskSuggestions: [],
          sourceFreshness: { state: 'current', label: 'Current' },
          missingDataNotes: [],
          receivedAt: '09:10'
        }
      },
      meta
    });

    expect(result).toBe(state);
  });

  it('stores a safe fallback snapshot shape when the payload is partial or malformed', () => {
    const state = reduce({
      type: 'signal/snapshotStored',
      payload: {
        patientId: 'DCU-031',
        snapshot: {
          signalTimeline: [
            null,
            {
              signalId: 'signal-dcu-031-2',
              code: 'potassium',
              value: 3.8
            }
          ],
          riskSuggestions: 'not-an-array',
          sourceFreshness: null,
          missingDataNotes: ['Needs review', null, 7],
          receivedAt: 12345
        }
      }
    });

    expect(state.signalSnapshots['DCU-031']).toEqual({
      signalTimeline: [
        {
          signalId: 'signal-dcu-031-2',
          code: 'potassium',
          value: 3.8
        }
      ],
      riskSuggestions: [],
      sourceFreshness: {
        state: 'unavailable',
        label: 'No signal freshness available.'
      },
      missingDataNotes: ['Needs review', '7'],
      receivedAt: null
    });
  });

  it('returns an unavailable fallback cue when the stored snapshot has no usable signal data', () => {
    const state = reduce({
      type: 'signal/snapshotStored',
      payload: {
        patientId: 'DCU-031',
        snapshot: {
          signalTimeline: [],
          riskSuggestions: [],
          sourceFreshness: {
            state: 'unavailable',
            label: 'No signal freshness available.'
          },
          missingDataNotes: ['No signal snapshot available yet.'],
          receivedAt: null
        }
      }
    });

    expect(selectPatientSimulationSignals(state, 'DCU-031')).toEqual([
      expect.objectContaining({
        category: 'simulation-fallback',
        simulationOnly: true,
        humanReviewRequired: true,
        unsafeClinicalAdvice: false,
        freshness: expect.objectContaining({ state: 'unavailable' })
      })
    ]);
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

  it('returns an empty signal list when no snapshot is available for the selected patient', () => {
    const state = createInitialSimulationState();

    expect(selectPatientSimulationSignals(state)).toEqual([]);
  });
});
