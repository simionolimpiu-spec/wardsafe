# SafeFlow Interactive Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every SafeFlow sidebar destination, visible tab and command perform a coherent simulation-safe action using shared fictional state.

**Architecture:** Add a reducer-driven simulation workspace with versioned browser persistence, then build dedicated operational views against that single state boundary. `App` remains the composition root, the sidebar becomes primary navigation, and every successful mutation appends an audit event. Existing server-side draft generation remains unchanged.

**Tech Stack:** React 19, Vitest, Testing Library, Playwright, Lucide React, Vite, browser `localStorage` and Blob downloads.

---

## File Structure

- `src/state/simulationWorkspace.js` - initial state, reducer, action names and derived selectors.
- `src/state/simulationWorkspace.test.js` - reducer and selector contracts.
- `src/state/simulationPersistence.js` - versioned load/save/clear boundary.
- `src/state/simulationPersistence.test.js` - persistence fallback and reset contracts.
- `src/state/useSimulationWorkspace.js` - React hook that hydrates and persists reducer state.
- `src/components/SimulationDialog.jsx` - accessible contact/reset confirmation dialog.
- `src/components/MyPatientsView.jsx` - assigned patient workspace.
- `src/components/ObservationsView.jsx` - observation history and entry form.
- `src/components/TasksView.jsx` - task register and mutations.
- `src/components/EscalationsView.jsx` - escalation register and mutations.
- `src/components/DischargesView.jsx` - discharge blocker workspace.
- `src/components/ReportsView.jsx` - fictional export previews and downloads.
- `src/components/SettingsView.jsx` - preferences and reset controls.
- `src/components/WorkspaceNav.jsx` - controlled primary navigation.
- `src/components/PatientSafetyPanel.jsx` - working contact and task actions.
- `src/components/HandoverDischargeView.jsx` - editable handover completion.
- `src/components/AuditLearningView.jsx` - searchable/filterable audit history.
- `src/App.jsx` - view registry, shared state and command orchestration.
- `src/App.test.jsx` - navigation and integrated interaction tests.
- `src/styles.css` - operational view, form, dialog and responsive styles.
- `e2e/safeflow.spec.js` - all-destination browser journey.

### Task 1: Shared Simulation State

**Files:**
- Create: `src/state/simulationWorkspace.js`
- Create: `src/state/simulationWorkspace.test.js`
- Read: `src/data/simulatedPatients.js`
- Read: `src/domain/workflowEvents.js`

- [ ] **Step 1: Write the failing reducer tests**

```js
import { describe, expect, it } from 'vitest';
import {
  createInitialSimulationState,
  selectActiveEscalationCount,
  selectAllTasks,
  simulationReducer
} from './simulationWorkspace.js';

const meta = { id: 'event-test', time: '10:15', actor: 'Leanne Mitchell' };

describe('simulation workspace', () => {
  it('adds and completes a patient task while recording audit events', () => {
    const initial = createInitialSimulationState();
    const added = simulationReducer(initial, {
      type: 'task/added',
      payload: { patientId: 'DCU-031', label: 'Confirm transport', owner: 'Leanne Mitchell', due: '14:00' },
      meta
    });
    const task = selectAllTasks(added).find((item) => item.label === 'Confirm transport');

    expect(task.status).toBe('Due');
    expect(added.auditEvents[0].label).toBe('Task added');

    const completed = simulationReducer(added, {
      type: 'task/statusChanged',
      payload: { patientId: 'DCU-031', taskId: task.id, status: 'Done' },
      meta: { ...meta, id: 'event-complete' }
    });

    expect(selectAllTasks(completed).find((item) => item.id === task.id).status).toBe('Done');
    expect(completed.auditEvents[0].label).toBe('Task marked Done');
  });

  it('records observations, escalation changes, handover and discharge updates', () => {
    let state = createInitialSimulationState();
    state = simulationReducer(state, {
      type: 'observation/added',
      payload: { patientId: 'DCU-028', news2: 5, respiratoryRate: 22, oxygenSaturation: 94 },
      meta
    });
    state = simulationReducer(state, {
      type: 'escalation/created',
      payload: { patientId: 'DCU-028', reason: 'NEWS2 increased', owner: 'Aisha Khan' },
      meta: { ...meta, id: 'event-escalation' }
    });
    state = simulationReducer(state, {
      type: 'handover/saved',
      payload: { patientId: 'DCU-028', handoverComplete: 100, recommendation: 'Review fictional observation trend.' },
      meta: { ...meta, id: 'event-handover' }
    });
    state = simulationReducer(state, {
      type: 'discharge/blockersChanged',
      payload: { patientId: 'DCU-028', blockers: [] },
      meta: { ...meta, id: 'event-discharge' }
    });

    expect(state.patients.find((patient) => patient.id === 'DCU-028').news2).toBe(5);
    expect(selectActiveEscalationCount(state)).toBeGreaterThan(1);
    expect(state.patients.find((patient) => patient.id === 'DCU-028').handoverComplete).toBe(100);
    expect(state.patients.find((patient) => patient.id === 'DCU-028').dischargeReady).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/state/simulationWorkspace.test.js`

Expected: FAIL because `simulationWorkspace.js` does not exist.

- [ ] **Step 3: Implement the reducer and selectors**

Create exports with these exact contracts:

```js
import { simulatedPatients } from '../data/simulatedPatients.js';
import { initialAuditEvents } from '../domain/workflowEvents.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

function audit(action, label, detail) {
  return {
    id: action.meta?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: action.meta?.time ?? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    actor: action.meta?.actor ?? 'Leanne Mitchell',
    label,
    detail,
    patientId: action.payload?.patientId ?? null
  };
}

export function createInitialSimulationState() {
  const patients = clone(simulatedPatients).map((patient) => ({ ...patient, observations: [] }));
  return {
    version: 1,
    selectedView: 'board',
    selectedPatientId: patients[0].id,
    patients,
    escalations: patients
      .filter((patient) => patient.escalation !== 'None')
      .map((patient, index) => ({
        id: `escalation-${index + 1}`,
        patientId: patient.id,
        reason: patient.nextAction,
        owner: patient.responsibleNurse,
        status: patient.escalation === 'Active' ? 'Active' : 'Monitoring'
      })),
    auditEvents: patients.flatMap(initialAuditEvents).reverse(),
    settings: { compactMode: false, draftProvider: 'auto', simulationUser: 'Leanne Mitchell' }
  };
}

export const selectAllTasks = (state) => state.patients.flatMap((patient) =>
  patient.tasks.map((task) => ({ ...task, patientId: patient.id, patientName: patient.name }))
);
export const selectActiveEscalationCount = (state) =>
  state.escalations.filter((item) => item.status !== 'Closed').length;
export const selectPatient = (state, patientId = state.selectedPatientId) =>
  state.patients.find((patient) => patient.id === patientId) ?? state.patients[0];

export function simulationReducer(state, action) {
  switch (action.type) {
    case 'navigation/changed':
      return { ...state, selectedView: action.payload.view };
    case 'patient/selected':
      return { ...state, selectedPatientId: action.payload.patientId };
    case 'task/added': {
      const task = {
        id: action.payload.id ?? `task-${Date.now()}`,
        label: action.payload.label,
        owner: action.payload.owner,
        due: action.payload.due,
        status: 'Due'
      };
      return {
        ...state,
        patients: state.patients.map((patient) => patient.id === action.payload.patientId
          ? { ...patient, tasks: [...patient.tasks, task] }
          : patient),
        auditEvents: [audit(action, 'Task added', `${task.label} for ${action.payload.patientId}`), ...state.auditEvents]
      };
    }
    case 'task/statusChanged':
      return {
        ...state,
        patients: state.patients.map((patient) => patient.id === action.payload.patientId
          ? { ...patient, tasks: patient.tasks.map((task) => task.id === action.payload.taskId
            ? { ...task, status: action.payload.status }
            : task) }
          : patient),
        auditEvents: [audit(action, `Task marked ${action.payload.status}`, action.payload.taskId), ...state.auditEvents]
      };
    case 'observation/added':
      return {
        ...state,
        patients: state.patients.map((patient) => patient.id === action.payload.patientId
          ? { ...patient, news2: Number(action.payload.news2), observations: [...patient.observations, action.payload] }
          : patient),
        auditEvents: [audit(action, 'Observation recorded', `NEWS2 ${action.payload.news2}`), ...state.auditEvents]
      };
    case 'escalation/created': {
      const escalation = { id: action.payload.id ?? `escalation-${Date.now()}`, ...action.payload, status: 'Active' };
      return {
        ...state,
        escalations: [escalation, ...state.escalations],
        patients: state.patients.map((patient) => patient.id === action.payload.patientId
          ? { ...patient, escalation: 'Active' }
          : patient),
        auditEvents: [audit(action, 'Escalation created', action.payload.reason), ...state.auditEvents]
      };
    }
    case 'escalation/statusChanged': {
      const target = state.escalations.find((item) => item.id === action.payload.escalationId);
      const escalations = state.escalations.map((item) => item.id === action.payload.escalationId
        ? { ...item, status: action.payload.status }
        : item);
      const patientEscalation = action.payload.status === 'Closed'
        ? (escalations.some((item) => item.patientId === target?.patientId && item.status !== 'Closed') ? 'Active' : 'None')
        : action.payload.status;
      return {
        ...state,
        escalations,
        patients: state.patients.map((patient) => patient.id === target?.patientId
          ? { ...patient, escalation: patientEscalation }
          : patient),
        auditEvents: [audit(action, `Escalation ${action.payload.status}`, action.payload.escalationId), ...state.auditEvents]
      };
    }
    case 'handover/saved':
      return {
        ...state,
        patients: state.patients.map((patient) => patient.id === action.payload.patientId
          ? { ...patient, handoverComplete: Number(action.payload.handoverComplete), sbar: { ...patient.sbar, recommendation: action.payload.recommendation } }
          : patient),
        auditEvents: [audit(action, 'Handover saved', `${action.payload.handoverComplete}% complete`), ...state.auditEvents]
      };
    case 'discharge/blockersChanged':
      return {
        ...state,
        patients: state.patients.map((patient) => patient.id === action.payload.patientId
          ? { ...patient, dischargeBlockers: action.payload.blockers, dischargeReady: action.payload.blockers.length === 0 }
          : patient),
        auditEvents: [audit(action, 'Discharge blockers updated', action.payload.blockers.join(', ') || 'No blockers'), ...state.auditEvents]
      };
    case 'contact/recorded':
      return { ...state, auditEvents: [audit(action, 'Simulated team contact recorded', action.payload.detail), ...state.auditEvents] };
    case 'settings/changed':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        auditEvents: [audit(action, 'Settings updated', 'Simulation preferences saved.'), ...state.auditEvents]
      };
    case 'workspace/reset': {
      const initial = createInitialSimulationState();
      return {
        ...initial,
        auditEvents: [audit(action, 'Simulation reset', 'Fictional defaults restored.'), ...initial.auditEvents]
      };
    }
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run reducer tests and the existing suite**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/state/simulationWorkspace.test.js src/App.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/state/simulationWorkspace.js src/state/simulationWorkspace.test.js
git commit -m "feat: add shared simulation workspace state"
```

### Task 2: Versioned Persistence Hook

**Files:**
- Create: `src/state/simulationPersistence.js`
- Create: `src/state/simulationPersistence.test.js`
- Create: `src/state/useSimulationWorkspace.js`

- [ ] **Step 1: Write failing persistence tests**

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { clearSimulationState, loadSimulationState, saveSimulationState, STORAGE_KEY } from './simulationPersistence.js';
import { createInitialSimulationState } from './simulationWorkspace.js';

describe('simulation persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips version 1 state', () => {
    const state = createInitialSimulationState();
    state.selectedView = 'tasks';
    saveSimulationState(state);
    expect(loadSimulationState().selectedView).toBe('tasks');
  });

  it('rejects corrupt and incompatible records', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    expect(loadSimulationState()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, patients: [] }));
    expect(loadSimulationState()).toBeNull();
  });

  it('clears the saved simulation', () => {
    saveSimulationState(createInitialSimulationState());
    clearSimulationState();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/state/simulationPersistence.test.js`

Expected: FAIL because the persistence module does not exist.

- [ ] **Step 3: Implement persistence and hook**

```js
// src/state/simulationPersistence.js
export const STORAGE_KEY = 'safeflow.simulation.v1';

export function loadSimulationState(storage = window.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY));
    return value?.version === 1 && Array.isArray(value.patients) && value.patients.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveSimulationState(state, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearSimulationState(storage = window.localStorage) {
  storage.removeItem(STORAGE_KEY);
}
```

```js
// src/state/useSimulationWorkspace.js
import { useEffect, useReducer } from 'react';
import { createInitialSimulationState, simulationReducer } from './simulationWorkspace.js';
import { clearSimulationState, loadSimulationState, saveSimulationState } from './simulationPersistence.js';

export function useSimulationWorkspace() {
  const [state, dispatch] = useReducer(simulationReducer, undefined, () => loadSimulationState() ?? createInitialSimulationState());

  useEffect(() => saveSimulationState(state), [state]);

  function reset() {
    clearSimulationState();
    dispatch({ type: 'workspace/reset' });
  }

  return { state, dispatch, reset };
}
```

- [ ] **Step 4: Run tests**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/state/simulationPersistence.test.js src/state/simulationWorkspace.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/state/simulationPersistence.js src/state/simulationPersistence.test.js src/state/useSimulationWorkspace.js
git commit -m "feat: persist simulation workspace state"
```

### Task 3: Patients And Observations Screens

**Files:**
- Create: `src/components/MyPatientsView.jsx`
- Create: `src/components/ObservationsView.jsx`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: Add failing component tests**

```jsx
it('opens distinct patients and observations screens', async () => {
  const user = userEvent.setup();
  render(<App />);
  const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

  await user.click(within(nav).getByRole('button', { name: 'My Patients' }));
  expect(screen.getByRole('heading', { name: 'My Patients' })).toBeInTheDocument();
  expect(screen.getByText(/assigned to Leanne Mitchell/i)).toBeInTheDocument();

  await user.click(within(nav).getByRole('button', { name: 'Observations' }));
  expect(screen.getByRole('heading', { name: 'Observations' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /record simulated observation/i })).toBeInTheDocument();
});

it('records a validated fictional observation', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Observations' }));
  await user.clear(screen.getByLabelText('NEWS2'));
  await user.type(screen.getByLabelText('NEWS2'), '5');
  await user.click(screen.getByRole('button', { name: /record simulated observation/i }));
  expect(screen.getByRole('status')).toHaveTextContent(/observation recorded/i);
  expect(screen.getByText(/NEWS2 5/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx -t "patients and observations|fictional observation"`

Expected: FAIL because the sidebar controls do not navigate.

- [ ] **Step 3: Build both screens with these contracts**

```jsx
// MyPatientsView.jsx
export function MyPatientsView({ patients, simulationUser, onSelectPatient }) {
  const assigned = patients.filter((patient) => patient.responsibleNurse === simulationUser);
  return <section className="operational-view" aria-labelledby="my-patients-title">
    <header className="view-heading"><div><p className="eyebrow">Assigned workload</p><h2 id="my-patients-title">My Patients</h2></div><strong>{assigned.length} assigned</strong></header>
    <p>Fictional patients assigned to {simulationUser}.</p>
    <div className="record-list">{assigned.map((patient) => <article key={patient.id}>
      <button className="link-button" onClick={() => onSelectPatient(patient.id)} type="button">{patient.id}</button>
      <strong>{patient.name}</strong><span>NEWS2 {patient.news2}</span><span>{patient.nextAction}</span>
    </article>)}</div>
    {assigned.length === 0 && <p className="empty-state">No fictional patients match this simulation identity.</p>}
  </section>;
}
```

```jsx
// ObservationsView.jsx
import { useState } from 'react';
export function ObservationsView({ patient, onRecord }) {
  const [news2, setNews2] = useState(patient.news2);
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const value = Number(news2);
    if (!Number.isInteger(value) || value < 0 || value > 20) return setError('NEWS2 must be a whole number from 0 to 20.');
    setError('');
    onRecord({ patientId: patient.id, news2: value, respiratoryRate: '', oxygenSaturation: '' });
  }
  return <section className="operational-view" aria-labelledby="observations-title">
    <header className="view-heading"><div><p className="eyebrow">Fictional record</p><h2 id="observations-title">Observations</h2></div><strong>{patient.id}</strong></header>
    <div className="observation-summary"><strong>Current NEWS2 {patient.news2}</strong><span>{patient.currentState.join(' | ')}</span></div>
    <form className="inline-form" onSubmit={submit}><label>NEWS2<input aria-describedby="news2-error" aria-label="NEWS2" inputMode="numeric" value={news2} onChange={(event) => setNews2(event.target.value)} /></label>
      {error && <p id="news2-error" role="alert">{error}</p>}<button className="primary-action" type="submit">Record simulated observation</button></form>
    <ol className="timeline">{patient.observations.map((item, index) => <li key={`${item.news2}-${index}`}><strong>NEWS2 {item.news2}</strong><span>Simulation entry</span></li>)}</ol>
  </section>;
}
```

- [ ] **Step 4: Wire temporary direct rendering in `App` and run tests**

Use `selectedView` from the workspace hook and dispatch `observation/added`. Do not remove existing board or journey tabs.

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx`

Expected: PASS for existing tests and the two new tests.

- [ ] **Step 5: Commit**

```powershell
git add src/components/MyPatientsView.jsx src/components/ObservationsView.jsx src/App.jsx src/App.test.jsx
git commit -m "feat: add patient and observation workspaces"
```

### Task 4: Tasks And Escalations Screens

**Files:**
- Create: `src/components/TasksView.jsx`
- Create: `src/components/EscalationsView.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: Add failing interaction tests**

```jsx
it('creates and completes tasks from the task register', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /tasks 6/i }));
  expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Add task' }));
  await user.type(screen.getByLabelText('Task description'), 'Confirm fictional transport');
  await user.type(screen.getByLabelText('Owner'), 'Leanne Mitchell');
  await user.type(screen.getByLabelText('Due time'), '14:00');
  await user.click(screen.getByRole('button', { name: 'Save task' }));
  expect(screen.getByText('Confirm fictional transport')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /mark Confirm fictional transport done/i }));
  expect(screen.getByText(/Task marked Done/i)).toBeInTheDocument();
});

it('creates and closes a simulated escalation', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /escalations 2/i }));
  await user.click(screen.getByRole('button', { name: 'New escalation' }));
  await user.type(screen.getByLabelText('Escalation reason'), 'Fictional NEWS2 review needed');
  await user.click(screen.getByRole('button', { name: 'Create simulated escalation' }));
  expect(screen.getByText('Fictional NEWS2 review needed')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /close Fictional NEWS2 review needed/i }));
  expect(screen.getByText(/Escalation Closed/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx -t "task register|simulated escalation"`

Expected: FAIL because the operational views do not exist.

- [ ] **Step 3: Implement the task and escalation component APIs**

`TasksView` must accept `{ tasks, patients, onAddTask, onChangeStatus }`, provide status and owner filters, validate description/owner/due, and render one icon button per task with an accessible name `Mark <label> Done` or `Reopen <label>`.

`EscalationsView` must accept `{ escalations, patients, onCreate, onChangeStatus }`, validate a reason, create an `Active` record for the selected patient, and expose `Acknowledge <reason>` and `Close <reason>` commands. Each form remains inline within its screen rather than opening nested cards.

Use these exact submit payloads:

```js
onAddTask({ patientId, label: description.trim(), owner: owner.trim(), due });
onCreate({ patientId, reason: reason.trim(), owner: simulationUser });
onChangeStatus({ patientId, taskId, status: 'Done' });
onChangeStatus({ patientId, escalationId, status: 'Closed' });
```

- [ ] **Step 4: Wire reducer actions and dynamic sidebar counts**

`App` dispatches the matching reducer actions. `WorkspaceNav` receives `taskCount={selectAllTasks(state).filter(task => task.status !== 'Done').length}` and `escalationCount={selectActiveEscalationCount(state)}` so badges update after actions.

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx src/state/simulationWorkspace.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/TasksView.jsx src/components/EscalationsView.jsx src/components/WorkspaceNav.jsx src/App.jsx src/App.test.jsx
git commit -m "feat: add task and escalation workspaces"
```

### Task 5: Handover And Discharge Mutations

**Files:**
- Modify: `src/components/HandoverDischargeView.jsx`
- Create: `src/components/DischargesView.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: Add failing workflow tests**

```jsx
it('saves handover progress and clears discharge blockers', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Handover' }));
  await user.clear(screen.getByLabelText('Handover completion'));
  await user.type(screen.getByLabelText('Handover completion'), '100');
  await user.click(screen.getByRole('button', { name: 'Save handover' }));
  expect(screen.getByRole('status')).toHaveTextContent(/Handover saved/i);

  await user.click(screen.getByRole('button', { name: 'Discharges' }));
  const blocker = screen.getByRole('checkbox', { name: 'Medical plan unclear' });
  await user.click(blocker);
  await user.click(screen.getByRole('checkbox', { name: 'Electrolyte review outstanding' }));
  await user.click(screen.getByRole('button', { name: 'Save discharge readiness' }));
  expect(screen.getByText(/Ready for simulated discharge/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx -t "handover progress"`

Expected: FAIL because handover is read-only and Discharges does not navigate.

- [ ] **Step 3: Implement forms**

`HandoverDischargeView` accepts `onSaveHandover`, stores local completion and recommendation fields, validates completion from 0 to 100, and calls:

```js
onSaveHandover({
  patientId: patient.id,
  handoverComplete: Number(completion),
  recommendation: recommendation.trim()
});
```

`DischargesView` accepts `{ patients, selectedPatientId, onSelectPatient, onSaveBlockers }`. It lists every fictional patient, allows blocker checkboxes only for the selected patient, and calls:

```js
onSaveBlockers({ patientId: selectedPatientId, blockers: selectedBlockers });
```

- [ ] **Step 4: Wire and verify**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/HandoverDischargeView.jsx src/components/DischargesView.jsx src/App.jsx src/App.test.jsx
git commit -m "feat: add handover and discharge actions"
```

### Task 6: Reports, Audit And Settings

**Files:**
- Create: `src/components/ReportsView.jsx`
- Create: `src/components/SettingsView.jsx`
- Modify: `src/components/AuditLearningView.jsx`
- Modify: `src/components/WardSafetyBoard.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: Add failing screen tests**

```jsx
it('opens report, audit and settings workspaces', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Reports' }));
  expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
  expect(screen.getByText(/fictional identifiers only/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Export ward board CSV' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Audit Trail' }));
  expect(screen.getByRole('searchbox', { name: /search audit/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Settings' }));
  expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reset simulation' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx -t "report, audit and settings"`

Expected: FAIL because the destinations are not wired.

- [ ] **Step 3: Implement exports, filters and preferences**

`ReportsView` accepts `{ patients, auditEvents, onStatus }`, renders ward/handover/audit summary tabs, and downloads CSV through:

```js
export function downloadSimulationCsv(filename, rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

`WardSafetyBoard` accepts `onExport` and renders an `Export board` button after the table. It calls `onExport` with no arguments; `App` delegates to the same fictional ward CSV exporter used by `ReportsView`.

`AuditLearningView` adds `query` and `actor` controls and filters `events` without changing their order.

`SettingsView` accepts `{ settings, onChangeSettings, onRequestReset }`, provides a compact-mode checkbox, draft-provider select with `auto` and `deterministic`, simulation-user input, Save settings, and Reset simulation.

- [ ] **Step 4: Add reset confirmation with `SimulationDialog`**

```jsx
import { useEffect, useRef } from 'react';

export function SimulationDialog({ title, children, confirmLabel, onConfirm, onClose }) {
  const titleRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    titleRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section aria-labelledby="simulation-dialog-title" aria-modal="true" className="simulation-dialog" role="dialog">
      <h2 id="simulation-dialog-title" ref={titleRef} tabIndex="-1">{title}</h2>
      {children}
      <div className="dialog-actions"><button className="secondary-action" onClick={onClose} type="button">Cancel</button><button className="primary-action" onClick={onConfirm} type="button">{confirmLabel}</button></div>
    </section>
  </div>;
}
```

`App` opens this dialog for reset, calls the persistence hook's `reset`, closes the dialog and sets status text to `Simulation reset to fictional defaults`.

- [ ] **Step 5: Verify and commit**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx`

Expected: PASS.

```powershell
git add src/components/ReportsView.jsx src/components/SettingsView.jsx src/components/SimulationDialog.jsx src/components/AuditLearningView.jsx src/components/WardSafetyBoard.jsx src/App.jsx src/App.test.jsx
git commit -m "feat: add reports audit and settings workspaces"
```

### Task 7: Primary Navigation And Patient Panel Commands

**Files:**
- Modify: `src/components/WorkspaceNav.jsx`
- Modify: `src/components/PatientSafetyPanel.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: Add failing all-navigation and patient-command tests**

```jsx
it.each([
  ['Ward Safety Board', 'Ward Safety Board'],
  ['My Patients', 'My Patients'],
  ['Observations', 'Observations'],
  [/Tasks/, 'Tasks'],
  [/Escalations/, 'Escalations'],
  ['Handover', 'Handover and Discharge Readiness'],
  ['Discharges', 'Discharges'],
  ['Reports', 'Reports'],
  ['Audit Trail', 'Audit and Learning'],
  ['Settings', 'Settings']
])('opens %s as a distinct workspace', async (buttonName, heading) => {
  const user = userEvent.setup();
  render(<App />);
  const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });
  await user.click(within(nav).getByRole('button', { name: buttonName }));
  expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
});

it('records simulated team contact without creating a telephone link', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Call team' }));
  expect(screen.getByRole('dialog', { name: /Record simulated team contact/i })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /call/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Record contact' }));
  expect(screen.getByRole('status')).toHaveTextContent(/Simulated team contact recorded/i);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx -t "distinct workspace|team contact"`

Expected: FAIL because navigation is uncontrolled and Call team has no handler.

- [ ] **Step 3: Make `WorkspaceNav` controlled**

Each item receives a stable id: `board`, `patients`, `observations`, `tasks`, `escalations`, `handover`, `discharges`, `reports`, `audit`, `settings`. The component signature becomes:

```jsx
export function WorkspaceNav({ activeView, taskCount, escalationCount, onNavigate })
```

Each button sets `aria-current={activeView === item.id ? 'page' : undefined}`, applies the active class from `activeView`, and calls `onNavigate(item.id)`.

- [ ] **Step 4: Wire patient commands**

`PatientSafetyPanel` accepts `onAddTask` and `onRequestContact`. **Call team** calls `onRequestContact(patient)`. **Add task** expands a compact validated form that calls:

```js
onAddTask({ patientId: patient.id, label: description.trim(), owner: patient.responsibleNurse, due });
```

`App` shows `SimulationDialog` for contact confirmation and dispatches `contact/recorded` with detail `Medical team contact documented for <patientId> in simulation.`

The existing journey tabs dispatch these exact view ids: Ward board to `board`, Handover to `handover`, Potassium flag to `potassium`, Scenarios to `scenarios`, and Audit to `audit`. Their selected state derives from `state.selectedView`; they do not maintain a second navigation state.

- [ ] **Step 5: Verify and commit**

Run: `node.exe .\node_modules\vitest\vitest.mjs run src/App.test.jsx`

Expected: PASS.

```powershell
git add src/components/WorkspaceNav.jsx src/components/PatientSafetyPanel.jsx src/App.jsx src/App.test.jsx
git commit -m "feat: connect all workspace controls"
```

### Task 8: Visual Polish, Responsive Behaviour And Browser Journey

**Files:**
- Modify: `src/styles.css`
- Modify: `e2e/safeflow.spec.js`
- Modify: `playwright.config.js`
- Modify: `README.md`

- [ ] **Step 1: Extend the Playwright test before styling**

```js
const destinations = [
  ['My Patients', 'My Patients'],
  ['Observations', 'Observations'],
  ['Tasks', 'Tasks'],
  ['Escalations', 'Escalations'],
  ['Handover', 'Handover and Discharge Readiness'],
  ['Discharges', 'Discharges'],
  ['Reports', 'Reports'],
  ['Audit Trail', 'Audit and Learning'],
  ['Settings', 'Settings']
];

for (const [button, heading] of destinations) {
  await page.getByRole('button', { name: new RegExp(`^${button}`) }).click();
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
}

await page.getByRole('button', { name: 'Reset simulation' }).click();
await expect(page.getByRole('dialog', { name: 'Reset simulation' })).toBeVisible();
await page.getByRole('button', { name: 'Confirm reset' }).click();
await expect(page.getByRole('status')).toContainText('Simulation reset');
```

- [ ] **Step 2: Run E2E and verify the new journey fails before final wiring**

Run: `npm.cmd run e2e`

Expected: FAIL at the first destination or incomplete command not yet wired.

Update `playwright.config.js` so the same journey runs at desktop and mobile widths:

```js
projects: [
  { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }
]
```

- [ ] **Step 3: Add stable operational styles**

Add these layout contracts to `src/styles.css` and reuse existing colors:

```css
.operational-view {
  min-width: 0;
  padding: 18px;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #fff;
}
.view-heading,
.record-list article,
.form-actions,
.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.record-list,
.operational-grid {
  display: grid;
  gap: 10px;
}
.record-list article {
  min-height: 58px;
  padding: 10px 12px;
  border-bottom: 1px solid #e4e9f0;
}
.inline-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  align-items: end;
}
.inline-form label {
  display: grid;
  gap: 5px;
  font-weight: 700;
}
.inline-form input,
.inline-form select,
.toolbar input,
.toolbar select {
  min-height: 38px;
  border: 1px solid #aeb9c7;
  border-radius: 5px;
  padding: 7px 9px;
  font: inherit;
}
.empty-state {
  padding: 24px;
  border: 1px dashed #aeb9c7;
  text-align: center;
  color: #45556b;
}
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(10, 24, 45, 0.48);
}
.simulation-dialog {
  width: min(460px, 100%);
  padding: 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(9, 30, 66, 0.24);
}
@media (max-width: 860px) {
  .view-heading,
  .record-list article,
  .dialog-actions { align-items: stretch; flex-direction: column; }
  .inline-form { grid-template-columns: 1fr; }
}
```

Keep cards at 8px radius or less, preserve table scrolling, avoid nested cards, and confirm no button label overflows at 1280x720 and 390x844.

- [ ] **Step 4: Document the interactive workspace**

Add this paragraph under Repository Status in `README.md`:

```markdown
The simulation workspace includes distinct patients, observations, tasks, escalations, handover, discharge, reports, audit and settings screens. Browser-local changes are fictional, versioned and reversible through **Reset simulation**.
```

- [ ] **Step 5: Run complete verification**

Run sequentially:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run
npm.cmd run build
npm.cmd run e2e
```

Expected: 0 failed unit/component tests, successful production bundle, and the Playwright simulation journey passes in Chromium.

- [ ] **Step 6: Inspect and commit**

```powershell
git diff --check
git status -sb
git add src/styles.css e2e/safeflow.spec.js playwright.config.js README.md
git commit -m "feat: complete interactive SafeFlow workspace"
```

## Final Review Checklist

- [ ] Every destination in the approved design has a dedicated component and heading.
- [ ] Every successful mutation appends an audit event.
- [ ] Sidebar badges derive from current state.
- [ ] Persistence restores state and reset clears it.
- [ ] Contact remains simulated with no `tel:` link or external call.
- [ ] Exports contain fictional identifiers only.
- [ ] Simulation banner remains visible on every screen.
- [ ] Forbidden diagnosis, prescribing and treatment wording assertions pass.
- [ ] Desktop and mobile browser screenshots show no overlap or clipped controls.
- [ ] Branch is pushed and the existing draft PR is updated after verification.
