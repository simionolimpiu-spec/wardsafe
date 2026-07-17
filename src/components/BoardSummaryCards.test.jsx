import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { wardSummary } from '../data/simulatedPatients.js';
import { BoardSummaryCards } from './BoardSummaryCards.jsx';

describe('BoardSummaryCards', () => {
  it('computes the five board summaries from ward summary metrics', () => {
    render(<BoardSummaryCards summary={wardSummary} />);
    const cards = screen.getByRole('region', { name: /ward summary cards/i });
    expect(within(cards).getByText('Patients in unit')).toBeInTheDocument();
    expect(within(cards).getByText(String(wardSummary.metrics.patients))).toBeInTheDocument();
    expect(within(cards).getByText('Escalations active')).toBeInTheDocument();
    expect(within(within(cards).getByText('Escalations active').closest('article')).getByText(String(wardSummary.metrics.activeEscalations))).toBeInTheDocument();
    expect(within(cards).getByText('NEWS2 ≥5')).toBeInTheDocument();
    expect(within(within(cards).getByText('NEWS2 ≥5').closest('article')).getByText(String(wardSummary.metrics.highNews))).toBeInTheDocument();
    expect(within(within(cards).getByText('Handover % complete').closest('article')).getByText(`${wardSummary.metrics.handoverCompletePercent}%`)).toBeInTheDocument();
    expect(within(within(cards).getByText('Discharge-ready today').closest('article')).getByText(String(wardSummary.metrics.dischargeReadyToday))).toBeInTheDocument();
  });
});
