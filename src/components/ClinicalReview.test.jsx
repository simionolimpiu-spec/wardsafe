import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ObservationsView } from './ObservationsView.jsx';
import { PatientNameWithChart } from './hospitals/PatientNameWithChart.jsx';
import { computeDonutSegments } from '../domain/patientRag.js';
import { createInitialSimulationState, simulationReducer } from '../state/simulationWorkspace.js';
import { loadSimulationState, saveSimulationState } from '../state/simulationPersistence.js';
import App from '../App.jsx';
import { requestSbarDraft } from '../services/draftClient.js';
vi.mock('../services/draftClient.js', () => ({ requestSbarDraft: vi.fn() }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => vi.restoreAllMocks());

it('rejects blank observations in both the form and reducer', () => {
  const state = createInitialSimulationState();
  const patient = state.patients[0];
  const onRecord = vi.fn();
  render(<ObservationsView patient={patient} onRecord={onRecord} />);
  fireEvent.change(screen.getByLabelText('NEWS2'), { target: { value: '  ' } });
  fireEvent.click(screen.getByRole('button', { name: /record simulated/i }));
  expect(onRecord).not.toHaveBeenCalled();
  expect(screen.getByLabelText('NEWS2')).toHaveAttribute('aria-invalid', 'true');
  expect(simulationReducer(state, { type: 'observation/added', payload: { patientId: patient.id, news2: '' } })).toBe(state);
});

it('renders missing and unrecognised assessments as unknown', () => {
  for (const patient of [{}, { careDomains: {} }, { careDomains: { observations: 'unexpected' } }]) {
    expect(computeDonutSegments(patient).every((segment) => segment.rag === 'unknown' && segment.colour)).toBe(true);
  }
});

it('opens a stable chart dialog and restores focus on Escape', () => {
  render(<PatientNameWithChart patient={{ id: 'fictional-1', name: 'Fictional patient', careDomains: {} }} />);
  const button = screen.getByRole('button', { name: 'Fictional patient' });
  button.focus();
  fireEvent.click(button);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Fictional patient');
  expect(screen.getAllByText('Not assessed').length).toBeGreaterThan(0);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(button).toHaveFocus();
});

it('persists versioned drafts and keeps them separate across scenarios', () => {
  const state = createInitialSimulationState();
  const key = `${state.selectedScenarioId}:${state.selectedPatientId}`;
  const action = { type: 'draft/saved', payload: { patientId: state.selectedPatientId, text: 'Fictional review note', savedAt: '2026-09-09' } };
  const saved = simulationReducer(simulationReducer(state, action), action);
  saveSimulationState(saved);
  expect(loadSimulationState().drafts[key]).toMatchObject({ text: 'Fictional review note', version: 2 });
  expect(saved.auditEvents[0].patientId).toBe(state.selectedPatientId);
});

it('retains saved draft text after remount and unsaved edits after patient switching', () => {
  const mounted = render(<App />);
  const draft = () => screen.getByLabelText('Editable SBAR draft');
  fireEvent.change(draft(), { target: { value: 'Fictional saved review' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save SBAR draft' }));
  mounted.unmount();
  render(<App />);
  expect(draft()).toHaveValue('Fictional saved review');
  fireEvent.change(draft(), { target: { value: 'Fictional unsaved edit' } });
  const buttons = screen.getAllByRole('button', { name: /^Open .+ \(/ });
  fireEvent.click(buttons[1]);
  fireEvent.click(buttons[0]);
  expect(draft()).toHaveValue('Fictional unsaved edit');
});

it('does not apply a delayed generation after switching patients', async () => {
  let resolve;
  requestSbarDraft.mockImplementation(() => new Promise((done) => { resolve = done; }));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Generate draft' }));
  const buttons = screen.getAllByRole('button', { name: /^Open .+ \(/ });
  fireEvent.click(buttons[1]);
  await act(async () => resolve({ provider: 'deterministic', sections: { situation: 'WRONG PATIENT TEXT' } }));
  fireEvent.click(buttons[0]);
  expect(screen.getByLabelText('Editable SBAR draft').value).not.toContain('WRONG PATIENT TEXT');
});

it('does not claim a successful save if browser storage is full', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Editable SBAR draft'), { target: { value: 'Fictional retained edit' } });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
  fireEvent.click(screen.getByRole('button', { name: 'Save SBAR draft' }));
  expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
  expect(screen.getByLabelText('Editable SBAR draft')).toHaveValue('Fictional retained edit');
  expect(screen.getByRole('status')).toHaveTextContent('SBAR draft not saved');
});
