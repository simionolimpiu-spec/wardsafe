import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { PatientJourneyTwin } from './PatientJourneyTwin.jsx';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const patient = clone(simulatedPatients[0]);

describe('PatientJourneyTwin', () => {
  it('renders the simulation-only patient timelines from the merged fixtures', () => {
    render(<PatientJourneyTwin patient={patient} />);

    expect(screen.getByRole('heading', { name: /patient journey twin/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Patient Journey Twin \/ Simulation Patient Twin — simulation-only timeline for review and learning\. Not a live clinical record\. Human review required\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Patient Journey Twin \/ Simulation Patient Twin/i)).toBeInTheDocument();
    expect(screen.getByText(/Current board selection:/i)).toHaveTextContent('DCU-031');

    expect(screen.getByText(/2 fictional patient timelines/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Simulation-only/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No live patient data/i).length).toBeGreaterThan(0);

    expect(screen.getByRole('heading', { name: /fictional patient alpha/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /fictional patient bravo/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^Source$/i)).toHaveLength(2);
    expect(screen.getAllByText(/fictional timeline fixture/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Clinical use$/i)).toHaveLength(2);
    expect(screen.getAllByText(/not for live clinical deployment/i).length).toBeGreaterThan(0);

    expect(screen.getAllByText(/^Missing information$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Limitations$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No live EPR, pathology, or observations integration\./i)).toBeInTheDocument();
    expect(screen.getByText(/No live discharge or transport integration\./i)).toBeInTheDocument();

    expect(screen.getByText(/Baseline observations recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/Discharge education completed/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-06-11 07:55 UTC/i)).toBeInTheDocument();

    expect(screen.queryByText(/illustrative model output, not clinically validated/i)).not.toBeInTheDocument();
  });
});
