import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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
    expect(within(dialog).getByRole('heading', { name: /simulation boundary/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /ward safety board \/ hospital insights context/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /heuristic cue engine flags/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /simulation-risk trend summary/i })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: /Competency Passport verified-learning evidence/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /exportable learning summary/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /copy report/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /print report/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /close report/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('note', { name: /simulation data source status/i })).toHaveTextContent(/static prototype data/i);
    expect(
      within(dialog).getByText(/^simulation-only prototype\. fictional data only\. human review required\.$/i)
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /copy report/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toBe(buildWardQualitySafetyReviewExportText(snapshot));
    expect(writeText.mock.calls[0][0]).toContain(snapshot.boundaryDetail);
    expect(writeText.mock.calls[0][0]).toContain(snapshot.humanReviewNote);
  });

  it('renders the ward quality and safety review trigger button', () => {
    render(<WardQualitySafetyReviewButton />);

    expect(screen.getByRole('button', { name: /ward quality & safety review/i })).toBeInTheDocument();
  });

  it('keeps focus on the drawer controls and preserves source-note contrast', async () => {
    const user = userEvent.setup();
    const snapshot = buildSnapshot();

    render(<WardReviewHarness snapshot={snapshot} />);

    await user.click(screen.getByRole('button', { name: /ward quality & safety review/i }));

    const dialog = screen.getByRole('dialog', { name: /ward quality & safety review/i });
    const closeButton = within(dialog).getByRole('button', { name: /close report/i });
    const copyButton = within(dialog).getByRole('button', { name: /copy report/i });
    const printButton = within(dialog).getByRole('button', { name: /print report/i });
    const sourceNote = within(dialog).getByRole('note', { name: /simulation data source status/i });
    const sourceStatus = within(sourceNote).getByText(/static prototype data/i);

    expect(closeButton).toHaveFocus();
    expect(sourceStatus).toHaveTextContent(/^static prototype data$/i);

    await user.tab();
    expect(copyButton).toHaveFocus();

    await user.tab();
    expect(printButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    const contrast = getContrastRatio('#53657a', '#f5f8fc');
    expect(contrast).toBeGreaterThanOrEqual(4.5);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: /ward quality & safety review/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ward quality & safety review/i })).toHaveFocus();
  });

  it('prints the same simulation boundary note that the plain-text export serialises', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const snapshot = buildSnapshot();

    render(<WardQualitySafetyReviewDrawer isOpen onClose={() => {}} snapshot={snapshot} />);

    const dialog = screen.getByRole('dialog', { name: /ward quality & safety review/i });
    await user.click(within(dialog).getByRole('button', { name: /print report/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(buildWardQualitySafetyReviewExportText(snapshot)).toContain(snapshot.boundaryDetail);
  });
});

function WardReviewHarness({ snapshot }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <WardQualitySafetyReviewButton isOpen={isOpen} onClick={() => setIsOpen(true)} />
      <WardQualitySafetyReviewDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} snapshot={snapshot} />
    </>
  );
}

function getContrastRatio(foreground, background) {
  const fg = parseRgb(foreground);
  const bg = parseRgb(background);
  const fgLuminance = getRelativeLuminance(fg);
  const bgLuminance = getRelativeLuminance(bg);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(color) {
  const text = String(color).trim();
  if (text.startsWith('#')) {
    return hexToRgb(text);
  }

  const matches = text.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];

  return matches.map((value) => value / 255);
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((character) => `${character}${character}`).join('')
    : normalized;

  return [0, 1, 2].map((index) => {
    const value = Number.parseInt(expanded.slice(index * 2, index * 2 + 2), 16);
    return Number.isFinite(value) ? value / 255 : 0;
  });
}

function getRelativeLuminance([red, green, blue]) {
  const transform = (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [red, green, blue].map(transform);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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
