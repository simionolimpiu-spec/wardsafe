import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { PatientSafetyPanel } from './PatientSafetyPanel.jsx';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function renderPanel(overrides = {}) {
  const patient = {
    ...clone(simulatedPatients[0]),
    ...overrides.patient
  };

  return render(
    <PatientSafetyPanel
      flag={overrides.flag ?? { level: 'warning', title: 'Potassium review suggested' }}
      onAddTask={overrides.onAddTask ?? (() => {})}
      onRequestContact={overrides.onRequestContact ?? (() => {})}
      patient={patient}
      signalSnapshot={overrides.signalSnapshot ?? null}
    />
  );
}

describe('PatientSafetyPanel', () => {
  it('renders the Review cues section when a signal snapshot is available', () => {
    renderPanel({
      signalSnapshot: {
        signalTimeline: [
          {
            signalId: 'signal-dcu-031-potassium-0910',
            syntheticPatientRef: 'DCU-031',
            simulationOnly: true,
            sourceSystem: 'simulation-ice',
            sourceType: 'lab',
            signalCode: 'potassium',
            displayName: 'Potassium',
            value: '3.1',
            unit: 'mmol/L',
            status: 'final',
            effectiveAt: '2026-06-10T09:10:00.000Z',
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
            title: 'Diagnosis and prescribe potassium now',
            suggestedFlag: 'AI decided treatment recommendation',
            suggestedBlocker: 'Autonomous decision',
            suggestedTask: 'Administer potassium',
            evidence: [{ label: 'AI decided' }],
            missingData: ['Need diagnosis']
          }
        ],
        sourceFreshness: {
          state: 'current',
          label: 'Latest simulated signal feed'
        },
        missingDataNotes: ['Magnesium result not visible.'],
        receivedAt: '2026-06-10T09:15:00.000Z'
      }
    });

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const reviewCues = within(panel).getByRole('region', { name: /review cues/i });

    expect(within(reviewCues).getByText(/simulation-only cues/i)).toBeInTheDocument();
    expect(within(reviewCues).getAllByText(/human review required/i).length).toBeGreaterThan(1);
    expect(within(reviewCues).getAllByText(/review suggested/i).length).toBeGreaterThan(0);
    expect(reviewCues.textContent).not.toMatch(/diagnos|prescrib|administer|AI decided|automatically treat|autonomous decision/i);
  });

  it('shows a quiet fallback message when no signal snapshot is available', () => {
    renderPanel();

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const reviewCues = within(panel).getByRole('region', { name: /review cues/i });

    expect(within(reviewCues).getByText(/no signal snapshot available yet/i)).toBeInTheDocument();
    expect(reviewCues.textContent).not.toMatch(/diagnos|prescrib|administer|AI decided|automatically treat|autonomous decision/i);
  });

  it('keeps the existing tasks and audit tabs working', async () => {
    const user = userEvent.setup();
    renderPanel();

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });

    await user.click(within(panel).getByRole('tab', { name: /tasks/i }));
    expect(within(panel).getByRole('heading', { name: /^tasks/i })).toBeInTheDocument();
    expect(within(panel).getByText(/medical review/i)).toBeInTheDocument();

    await user.click(within(panel).getByRole('tab', { name: /audit trail/i }));
    expect(within(panel).getByText(/escalation created/i)).toBeInTheDocument();
  });
});
