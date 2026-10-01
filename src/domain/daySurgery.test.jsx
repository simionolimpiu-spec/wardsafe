import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createDayList, dayCaseSnapshot, DAY_SNAPSHOT_MINUTES, DEFAULT_ACTIVITY_DATE } from './daySurgery.js';
import { getPopulatedHospital } from './wardPopulation.js';
import { createHospitalWardScenario } from './hospitalWorkspace.js';
import { createInitialSimulationState, simulationReducer } from '../state/simulationWorkspace.js';
import { DaySurgeryBoard } from '../components/DaySurgeryBoard.jsx';
import { ObservationsView } from '../components/ObservationsView.jsx';
import { scanBoundaryAwareSafetyLanguage } from './safetyLanguage.js';

beforeEach(() => localStorage.clear());
it('varies weekday activity reproducibly, keeps weekends empty and rejects invalid dates', () => {
  expect(createDayList(DEFAULT_ACTIVITY_DATE)).toHaveLength(30);
  expect(createDayList('2026-06-18')).toEqual(createDayList('2026-06-18'));
  expect(createDayList('2026-06-18')).not.toEqual(createDayList(DEFAULT_ACTIVITY_DATE));
  const days = Array.from({ length: 30 }, (_, index) => `2026-06-${String(index + 1).padStart(2, '0')}`);
  const sizes = new Set(days.map((date) => createDayList(date).length));
  expect(sizes.size).toBeGreaterThan(3);
  expect(createDayList('2026-06-20')).toEqual([]);
  expect(createDayList('2026-02-31')).toEqual([]);
});
it('keeps arrival/theatre/recovery/departure ordered and never reports future completion', () => {
  for (const booking of createDayList(DEFAULT_ACTIVITY_DATE)) {
    expect(booking.theatre).toBeGreaterThanOrEqual(booking.arrival);
    expect(booking.procedureEnd).toBeGreaterThan(booking.theatre);
    expect(booking.returnToUnit).toBeGreaterThan(booking.recovery);
    const snapshot = dayCaseSnapshot(booking);
    for (const field of ['arrival', 'theatre', 'procedureEnd', 'recovery', 'returnToUnit', 'departure']) {
      if (snapshot[field] != null) expect(snapshot[field]).toBeLessThanOrEqual(DAY_SNAPSHOT_MINUTES);
    }
    if (snapshot.procedureEnd == null && !booking.cancellation) expect(snapshot.outcome).toBe('Outcome not yet recorded.');
    if (booking.cancellation) expect(snapshot.theatre).toBeNull();
  }
  const bookings = createDayList(DEFAULT_ACTIVITY_DATE);
  for (const resource of ['theatreRoom', 'consultant', 'anaesthetist']) {
    for (const value of new Set(bookings.map((booking) => booking[resource]))) {
      const allocation = bookings.filter((booking) => booking[resource] === value).sort((a, b) => a.theatre - b.theatre);
      for (let index = 1; index < allocation.length; index += 1) expect(allocation[index].theatre).toBeGreaterThanOrEqual(allocation[index - 1].procedureEnd);
    }
  }
});
it('allows variable rare overnight admissions and identifies receiving service without overnight DCU stays', () => {
  const destinations = new Set();
  let quietDays = 0;
  for (let day = 1; day <= 30; day += 1) {
    const snapshots = createDayList(`2026-06-${String(day).padStart(2, '0')}`).map((booking) => dayCaseSnapshot(booking, 22 * 60));
    if (snapshots.length && snapshots.every((item) => !item.transfer)) quietDays += 1;
    for (const item of snapshots.filter((entry) => entry.transfer)) {
      destinations.add(item.transfer.destination);
      expect(['jpuh-ward-9', 'jpuh-icu-hdu']).toContain(item.transfer.wardId);
      expect(item.stage).toBe('Transferred');
      expect(item.stayMinutes).toBeLessThan(15 * 60);
    }
  }
  expect(quietDays).toBeGreaterThan(0);
  expect([...destinations].sort()).toEqual(['HDU', 'ITU', 'Surgical ward']);
});
it('separates day surgery, dialysis and neonatal populations and retains unconfirmed services visibly', () => {
  const hospital = getPopulatedHospital('jpuh');
  const dcu = hospital.wards.find((ward) => ward.id === 'jpuh-day-care');
  expect(dcu.patientCount).toBe(30); expect(dcu.bedCount).toBe(20); expect(dcu.occupancyRate).toBeNull();
  expect(dcu.patients.every((patient) => patient.lengthOfStayDays === 0 && patient.dayCase)).toBe(true);
  expect(hospital.wards.find((ward) => ward.id === 'jpuh-renal').patients.every((patient) => /dialysis/i.test(patient.diagnosis))).toBe(true);
  const nicu = getPopulatedHospital('nnuh').wards.find((ward) => ward.id === 'nnuh-nicu');
  expect(nicu.category).toBe('neonatal');
  expect(nicu.patients.every((patient) => patient.age === 0 && patient.comorbidities.length === 0 && patient.news2 === null)).toBe(true);
  expect(getPopulatedHospital('nnuh').wards.find((ward) => ward.id === 'nnuh-cley').patients).toEqual([]);
});
it('prevents recording adult NEWS2 for neonatal patients in both form and reducer', () => {
  const state = simulationReducer(createInitialSimulationState(), { type: 'workspace/wardOpened', payload: { hospitalId: 'jpuh', wardId: 'jpuh-neonatal' } });
  const patient = state.patients[0];
  const onRecord = vi.fn();
  render(<ObservationsView patient={patient} onRecord={onRecord} />);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByText(/Adult NEWS2 is not used/)).toBeInTheDocument();
  expect(simulationReducer(state, { type: 'observation/added', payload: { patientId: patient.id, news2: 4 } })).toBe(state);
});
it('renders the full surgical pathway with sourced capability notes and weekday validation', () => {
  const scenario = createHospitalWardScenario('jpuh', 'jpuh-day-care');
  const onDateChange = vi.fn();
  const { container } = render(<DaySurgeryBoard patients={scenario.patients} date={DEFAULT_ACTIVITY_DATE} onDateChange={onDateChange} />);
  expect(screen.getByRole('table', { name: 'Day surgery list' })).toBeInTheDocument();
  expect(within(screen.getByLabelText('Day surgery activity')).getByText('30')).toBeInTheDocument();
  expect(screen.getByText(/no overnight accommodation/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Day list date'), { target: { value: '2026-06-20' } });
  expect(onDateChange).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('Monday to Friday');
  fireEvent.change(screen.getByLabelText('Day list date'), { target: { value: '2026-06-18' } });
  expect(onDateChange).toHaveBeenCalledWith('2026-06-18');
  expect(scanBoundaryAwareSafetyLanguage(container.textContent).violations).toEqual([]);
});
it('archives patient edits separately for each date and restores the selected day', () => {
  const open = (date) => ({ type: 'workspace/wardOpened', payload: { hospitalId: 'jpuh', wardId: 'jpuh-day-care', date } });
  let state = simulationReducer(createInitialSimulationState(), open(DEFAULT_ACTIVITY_DATE));
  const patientId = state.selectedPatientId;
  state = simulationReducer(state, { type: 'task/added', payload: { patientId, label: 'Review fictional record', owner: 'Reviewer', due: '15:00' } });
  state = simulationReducer(state, open('2026-06-18'));
  expect(state.patients.every((patient) => patient.tasks.length === 0)).toBe(true);
  state = simulationReducer(state, open(DEFAULT_ACTIVITY_DATE));
  expect(state.patients[0].tasks[0].label).toBe('Review fictional record');
});

it('carries completed transfers into the receiving census using the same identity without exceeding capacity', () => {
  let checked = 0;
  for (let day = 1; day <= 30; day += 1) {
    const hospital = getPopulatedHospital('jpuh', `2026-06-${String(day).padStart(2, '0')}`);
    const dcu = hospital.wards.find((ward) => ward.id === 'jpuh-day-care');
    for (const patient of dcu.patients.filter((item) => item.dayCase.stage === 'Transferred')) {
      const destination = hospital.wards.find((ward) => ward.id === patient.dayCase.transfer.wardId);
      const arrived = destination.patients.find((item) => item.id === patient.id);
      expect(arrived.name).toBe(patient.name);
      expect(arrived.admissionSource).toBe('Transfer from Day Care Unit');
      expect(destination.patientCount).toBeLessThanOrEqual(destination.bedCount);
      expect(patient.dayCase.present).toBe(false);
      checked += 1;
    }
  }
  expect(checked).toBeGreaterThan(0);
});
