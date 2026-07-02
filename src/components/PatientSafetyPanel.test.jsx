import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { buildHeuristicCues } from '../domain/heuristicCueEngine.js';
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
      heuristicCues={overrides.heuristicCues ?? []}
      patient={patient}
      reviewSignals={overrides.reviewSignals ?? []}
      signalSnapshot={overrides.signalSnapshot ?? null}
    />
  );
}

describe('PatientSafetyPanel', () => {
  it('renders the Simulation Review Cues section when derived signals are available', () => {
    renderPanel({
      reviewSignals: [
        {
          id: 'simulation-signal-dcu-031-documentation',
          category: 'documentation',
          priority: 'review',
          title: 'Review suggested: documentation gap',
          explanation: 'Simulation-only cue. Evidence to check is visible in the fictional record.',
          evidence: [
            { label: 'Potassium 3.1 mmol/L final at 09:10' },
            { label: 'Magnesium result not visible' }
          ],
          suggestedHumanReviewAction: 'Human review required: confirm the visible evidence and document the outcome.',
          simulationOnly: true,
          humanReviewRequired: true,
          unsafeClinicalAdvice: false
        },
        {
          id: 'simulation-signal-dcu-031-sepsis-screen',
          category: 'sepsis-screen',
          priority: 'watch',
          title: 'Review suggested: sepsis-screen cue',
          explanation: 'Simulation-only cue highlighting sepsis-screen evidence to check.',
          evidence: [{ label: 'Sepsis screen overdue final at 09:05' }],
          suggestedHumanReviewAction: 'Human review required: confirm the visible sepsis-screen status and document the outcome.',
          simulationOnly: true,
          humanReviewRequired: true,
          unsafeClinicalAdvice: false
        }
      ],
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
        signalSourceMetadata: {
          source: 'private-lambda-signals-placeholder',
          provider: 'placeholder',
          mode: 'simulation',
          clinicalUse: false,
          validationStatus: 'not-clinically-validated',
          explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.'
        },
        suggestionSourceMetadata: {
          source: 'private-lambda-risk-suggestions-placeholder',
          provider: 'placeholder',
          mode: 'simulation',
          clinicalUse: false,
          validationStatus: 'not-clinically-validated',
          explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.'
        },
        missingDataNotes: ['Magnesium result not visible.'],
        receivedAt: '2026-06-10T09:15:00.000Z'
      }
    });

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const reviewCues = within(panel).getByRole('region', { name: /simulation review cues/i });

    expect(within(reviewCues).getByText(/simulation-only cues/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/not clinically validated and not for clinical decision-making/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/Signals: private-lambda-signals-placeholder/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/Risk suggestions: private-lambda-risk-suggestions-placeholder/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/^Documentation$/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/^Sepsis screen$/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/^Review$/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/^Watch$/i)).toBeInTheDocument();
    expect(within(reviewCues).getAllByText(/human review required/i).length).toBeGreaterThan(1);
    expect(within(reviewCues).getAllByText(/review suggested/i).length).toBeGreaterThan(0);
    expect(reviewCues.textContent).not.toMatch(/diagnos|prescrib|administer|AI decided|automatically treat|autonomous decision|replace potassium|potassium replacement/i);
  });

  it('reveals the heuristic rationale when Why flagged is expanded', async () => {
    const user = userEvent.setup();
    renderPanel({
      heuristicCues: buildHeuristicCues({
        signals: [
          {
            id: 'simulation-signal-dcu-031-documentation',
            category: 'documentation'
          },
          {
            id: 'simulation-signal-dcu-031-electrolyte-review',
            category: 'electrolyte-review'
          }
        ],
        flag: {
          level: 'medium',
          title: 'Potassium review suggested'
        }
      }),
      signalSnapshot: {
        signalTimeline: [],
        riskSuggestions: [],
        sourceFreshness: {
          state: 'current',
          label: 'Latest simulated signal feed'
        },
        signalSourceMetadata: {
          source: 'private-lambda-signals-placeholder',
          provider: 'placeholder',
          mode: 'simulation',
          clinicalUse: false,
          validationStatus: 'not-clinically-validated',
          explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.'
        },
        suggestionSourceMetadata: {
          source: 'private-lambda-risk-suggestions-placeholder',
          provider: 'placeholder',
          mode: 'simulation',
          clinicalUse: false,
          validationStatus: 'not-clinically-validated',
          explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.'
        },
        missingDataNotes: [],
        receivedAt: '2026-06-10T09:15:00.000Z'
      }
    });

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const reviewCues = within(panel).getByRole('region', { name: /simulation review cues/i });
    const whyFlaggedSummary = within(reviewCues).getByText(/^why flagged$/i);

    expect(within(reviewCues).getByText(/^Heuristic$/i)).toBeInTheDocument();
    expect(within(reviewCues).getByText(/documentation gap/i)).toBeInTheDocument();

    await user.click(whyFlaggedSummary);

    const details = whyFlaggedSummary.closest('details');
    expect(details).not.toBeNull();
    expect(details).toHaveAttribute('open');
    expect(details).toHaveTextContent(/A documentation cue appears alongside an unresolved safety flag/i);
    expect(details).toHaveTextContent(/documentation-gap/i);
    expect(details).toHaveTextContent(/1 documentation cue plus an unresolved safety flag/i);
  });

  it('shows a quiet fallback message when no signal snapshot is available', () => {
    renderPanel();

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const reviewCues = within(panel).getByRole('region', { name: /simulation review cues/i });

    expect(within(reviewCues).getByText(/no signal snapshot available yet/i)).toBeInTheDocument();
    expect(reviewCues.textContent).not.toMatch(/diagnos|prescrib|administer|AI decided|automatically treat|autonomous decision|replace potassium|potassium replacement/i);
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

  it('moves between patient tabs with arrow keys', async () => {
    const user = userEvent.setup();
    renderPanel();

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const overviewTab = within(panel).getByRole('tab', { name: /safety overview/i });
    const sbarTab = within(panel).getByRole('tab', { name: /^sbar$/i });

    overviewTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(sbarTab).toHaveFocus();
    expect(within(panel).getByRole('tabpanel', { name: /^sbar$/i })).toBeInTheDocument();
    expect(within(panel).getByText(/SBAR summary/i)).toBeInTheDocument();
  });
});
