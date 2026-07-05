import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getDemoScenarioById } from '../data/demoScenarios.js';
import { buildHeuristicCues } from '../domain/heuristicCueEngine.js';
import { evaluatePotassiumSafetyGap } from '../domain/safetyRules.js';
import { getHospitalInsightsSnapshot } from '../services/hospitalInsightsService.js';
import {
  buildWardQualitySafetyReviewExportText,
  getWardQualitySafetyReviewSnapshot
} from '../services/wardQualitySafetyReviewService.js';
import {
  WardQualitySafetyReviewButton,
  WardQualitySafetyReviewDrawer
} from './WardQualitySafetyReviewDrawer.jsx';

describe('WardQualitySafetyReviewDrawer', () => {
  it('renders the review drawer and copies the export text', async () => {
    const user = userEvent.setup();
    const snapshot = buildSnapshot();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<WardQualitySafetyReviewDrawer isOpen onClose={() => {}} snapshot={snapshot} />);

    const dialog = screen.getByRole('dialog', { name: /ward quality & safety review/i });
    expect(within(dialog).getByText(/^Ward Quality & Safety Review$/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /heuristic cue engine flags/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /simulation-risk trend summary/i })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: /Competency Passport verified-learning evidence/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /copy report/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /print report/i })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /copy report/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toBe(buildWardQualitySafetyReviewExportText(snapshot));
  });

  it('renders the ward quality and safety review trigger button', () => {
    render(<WardQualitySafetyReviewButton />);

    expect(screen.getByRole('button', { name: /ward quality & safety review/i })).toBeInTheDocument();
  });
});

function buildSnapshot() {
  const scenario = getDemoScenarioById('day-care-treatment-pathway');
  const patient = scenario.patients.find((entry) => entry.id === scenario.selectedPatientId);
  const hospitalInsights = getHospitalInsightsSnapshot({
    currentWardName: scenario.currentWardName,
    hospitalName: scenario.hospitalName
  });
  const safetyFlag = evaluatePotassiumSafetyGap(patient);
  const reviewSignals = buildReviewSignals();
  const heuristicCues = buildHeuristicCues({ signals: reviewSignals, flag: safetyFlag });

  return getWardQualitySafetyReviewSnapshot({
    patient,
    reviewSignals,
    heuristicCues,
    safetyFlag,
    hospitalInsights,
    selectedScenario: scenario
  });
}

function buildReviewSignals() {
  return [
    {
      id: 'signal-documentation-1',
      category: 'documentation',
      priority: 'review',
      title: 'Documentation gap',
      explanation: 'Documentation gap visible in the simulation record.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-documentation-2',
      category: 'documentation',
      priority: 'review',
      title: 'Documentation gap follow-up',
      explanation: 'A second documentation gap remains visible.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-handover-1',
      category: 'handover',
      priority: 'watch',
      title: 'Handover completeness issue',
      explanation: 'Handover completeness issue remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-escalation-1',
      category: 'escalation',
      priority: 'blocker',
      title: 'Escalation readiness cue',
      explanation: 'Escalation readiness cue remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-discharge-1',
      category: 'discharge',
      priority: 'blocker',
      title: 'Discharge-readiness blocker',
      explanation: 'Discharge-readiness blocker remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-deteriorating-obs-1',
      category: 'deteriorating-obs',
      priority: 'blocker',
      title: 'Deteriorating observations cue',
      explanation: 'Deteriorating observations cue remains visible.',
      simulationOnly: true,
      humanReviewRequired: true
    }
  ];
}
