import { beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { getPopulatedHospitals } from './wardPopulation.js';
import { createHospitalWardScenario, directoryPatientsForWard } from './hospitalWorkspace.js';
import { createInitialSimulationState, simulationReducer } from '../state/simulationWorkspace.js';
import { saveSimulationState, loadSimulationState } from '../state/simulationPersistence.js';
import App from '../App.jsx';
import { PatientNameWithChart } from '../components/hospitals/PatientNameWithChart.jsx';

const hospital = getPopulatedHospitals()[0];
const ward = hospital.wards[0];
const otherWard = hospital.wards[1];
const open = (wardId, patientId) => ({ type: 'workspace/wardOpened', payload: { hospitalId: hospital.id, wardId, patientId } });
beforeEach(() => localStorage.clear());

it('preserves older saved patient notes without inventing missing service metadata', () => {
  let state = simulationReducer(createInitialSimulationState(), open(ward.id));
  const patientId = state.selectedPatientId;
  state = { ...state, patients: state.patients.map((patient) => {
    const { simulatedCareLevel, documentationTopics, serviceRecordEvidence, ...legacy } = patient;
    return { ...legacy, plan: 'Existing fictional review note', sbar: { ...legacy.sbar, situation: 'Edited fictional handover' } };
  }) };
  const originalPatient = structuredClone(state.patients[0]);
  saveSimulationState(state);
  state = simulationReducer(loadSimulationState(), open(otherWard.id));
  saveSimulationState(state);
  state = simulationReducer(loadSimulationState(), open(ward.id));
  expect(state.selectedPatientId).toBe(patientId);
  expect(state.patients[0]).toEqual(originalPatient);
  expect(state.patients[0]).not.toHaveProperty('simulatedCareLevel');
  render(<PatientNameWithChart patient={state.patients[0]} />);
  fireEvent.click(screen.getByRole('button', { name: originalPatient.name }));
  expect(within(screen.getByRole('dialog')).getByText(/no care level has been inferred/i)).toBeInTheDocument();
});

it('uses the exact census identities and leaves missing clinical details empty', () => {
  const scenario = createHospitalWardScenario(hospital.id, ward.id);
  expect(scenario.patients.map((patient) => patient.id)).toEqual(ward.patients.map((patient) => patient.id));
  expect(scenario.patients[0]).toMatchObject({ name: ward.patients[0].name, news2: ward.patients[0].news2,
    medicines: [], labs: {}, tasks: [], handoverComplete: 0, escalation: 'None' });
  expect(createHospitalWardScenario('unknown', ward.id)).toBeNull();
});

it('restores ward edits and selected patient after visiting another ward and reloading', () => {
  let state = simulationReducer(createInitialSimulationState(), open(ward.id, ward.patients[1].id));
  const patientId = state.selectedPatientId;
  state = simulationReducer(state, { type: 'task/added', payload: { patientId, label: 'Fictional review', owner: 'Simulation reviewer', due: '12:00' } });
  state = simulationReducer(state, { type: 'observation/added', payload: { patientId, news2: 4 } });
  expect(state.patients[1].careDomains.observations).toBe('green');
  expect(state.wardSummary.metrics.highNews).toBe(state.patients.filter((patient) => patient.news2 >= 5).length);
  state = simulationReducer(state, open(otherWard.id));
  expect(directoryPatientsForWard(state, hospital.id, ward.id, [])[1].news2).toBe(4);
  saveSimulationState(state);
  state = simulationReducer(loadSimulationState(), open(ward.id));
  expect(state.selectedPatientId).toBe(patientId);
  expect(state.patients[1].tasks[0].label).toBe('Fictional review');
  expect(state.patients[1].news2).toBe(4);
  expect(state.workspaces[state.selectedScenarioId]?.workspaces).toBeUndefined();
});

it('renders a connected patient across observations, tasks, handover and SBAR', () => {
  const state = simulationReducer(createInitialSimulationState(), open(ward.id, ward.patients[1].id));
  saveSimulationState(state);
  render(<App />);
  expect(screen.getByLabelText('Selected patient')).toHaveValue(ward.patients[1].id);
  const nav = screen.getByRole('navigation', { name: 'SafeFlow workspace' });
  for (const name of ['Observations', /^Tasks/, 'Handover', 'Discharges']) {
    fireEvent.click(within(nav).getByRole('button', { name, exact: typeof name === 'string' }));
    expect(screen.getByLabelText('Selected patient')).toHaveValue(ward.patients[1].id);
  }
  fireEvent.click(screen.getByRole('tab', { name: 'SBAR', exact: true }));
  expect(screen.getByLabelText('Editable SBAR draft').value).toContain(ward.patients[1].name);
});
