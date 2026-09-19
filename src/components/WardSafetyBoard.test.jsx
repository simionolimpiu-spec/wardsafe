import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { simulatedPatients, wardSummary } from '../data/simulatedPatients.js';
import { scanStrictSafetyLanguage } from '../domain/safetyLanguage.js';
import { WardSafetyBoard } from './WardSafetyBoard.jsx';

function renderBoard(props = {}) {
  return render(<WardSafetyBoard summary={wardSummary} patients={simulatedPatients}
    selectedPatientId={simulatedPatients[0].id} onSelectPatient={() => {}} {...props} />);
}

describe('Ward Safety Board design-system migration', () => {
  it('keeps native table semantics, scoped headers and priority order', () => {
    renderBoard();
    const table = screen.getByRole('table', { name: 'Ward patient list' });
    expect(table.tagName).toBe('TABLE');
    expect(table.parentElement).toHaveClass('table-scroll');
    expect(table.parentElement).toHaveAttribute('tabindex', '0');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'Fictional label', 'Risk', 'Escalation status', 'Next action',
      'NEWS2', 'Responsible fictional nurse', 'Handover %', 'Discharge-ready'
    ]);
    headers.forEach((header) => expect(header).toHaveAttribute('scope', 'col'));
    expect(within(table).getAllByRole('row')).toHaveLength(simulatedPatients.length + 1);
    expect(within(table).getByRole('row', { name: /DCU-031.*Electrolyte \/ AKI safety gap/i })).toBeInTheDocument();
    table.querySelectorAll('tbody tr').forEach((row) => expect(row.children).toHaveLength(headers.length));
  });

  it.each([
    ['High', 'Active', 2], ['High', 'None', 1], ['Medium', 'Active', 1],
    ['Medium', 'Monitoring', 0], ['Low', 'None', 0]
  ])('shows risk once and restricts red for %s risk / %s escalation', (risk, escalation, criticalCount) => {
    renderBoard({ patients: [{ ...simulatedPatients[0], risk, escalation, news2: 6 }] });
    const row = screen.getByRole('button', { name: 'Open Patient 031 (DCU-031)' }).closest('tr');
    const riskCell = row.querySelector('.sf-ward-status-cell--risk');
    expect(riskCell.querySelectorAll('.sf-clinical-status')).toHaveLength(1);
    expect(within(riskCell).getAllByText(`${risk} risk`)).toHaveLength(1);
    const critical = row.querySelectorAll('.sf-badge--critical, .sf-tone-critical');
    expect(critical).toHaveLength(criticalCount);
    critical.forEach((badge) => expect(['High risk', 'Escalation active']).toContain(badge.textContent));
  });

  it('renders every recorded flag as a neutral outline badge', () => {
    renderBoard();
    for (const patient of simulatedPatients) {
      const row = screen.getByRole('button', { name: `Open ${patient.name} (${patient.id})` }).closest('tr');
      for (const flag of patient.riskFlags ?? []) {
        const badge = within(row).getByText(flag).closest('.sf-badge');
        expect(badge).toHaveClass('sf-badge--neutral', 'sf-badge--outline');
        expect(badge).not.toHaveClass('sf-clinical-status');
      }
    }
  });

  it('does not invent a flag when no flags are recorded', () => {
    renderBoard({ patients: [{ ...simulatedPatients[0], riskFlags: [] }] });
    expect(within(screen.getByRole('table')).queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getAllByText('High risk')).toHaveLength(1);
  });

  it.each([[0, 'Normal band'], [2, 'Normal band'], [3, 'Watch band'], [4, 'Watch band'], [5, 'High band'], [6, 'High band']])(
    'shows recorded NEWS2 %s with the existing %s label', (news2, band) => {
      renderBoard({ patients: [{ ...simulatedPatients[0], news2 }] });
      const row = screen.getByRole('button', { name: 'Open Patient 031 (DCU-031)' }).closest('tr');
      const value = row.querySelector('.sf-clinical-value');
      expect(within(value).getByText(String(news2))).toHaveClass('sf-numeric');
      expect(within(value).getByText(band)).toBeInTheDocument();
      expect(value).not.toHaveClass('sf-tone-critical');
    }
  );

  it.each([null, undefined, ''])('shows missing NEWS2 (%s) explicitly without assigning a band', (news2) => {
    renderBoard({ patients: [{ ...simulatedPatients[0], news2 }] });
    const row = screen.getByRole('button', { name: 'Open Patient 031 (DCU-031)' }).closest('tr');
    const value = row.querySelector('.sf-clinical-value');
    expect(within(value).getByText('Not recorded')).toBeInTheDocument();
    expect(value).toHaveClass('sf-tone-neutral');
    expect(within(value).queryByText(/band/i)).not.toBeInTheDocument();
  });

  it('exposes selection without colour and preserves the open action name and callback', async () => {
    const onSelectPatient = vi.fn();
    renderBoard({ onSelectPatient });
    const current = screen.getByRole('button', { name: 'Open Patient 031 (DCU-031)' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current.closest('tr')).toHaveClass('is-selected');
    const next = screen.getByRole('button', { name: 'Open Patient 028 (DCU-028)' });
    expect(next).not.toHaveAttribute('aria-current');
    await userEvent.setup().click(next);
    expect(onSelectPatient).toHaveBeenCalledWith('DCU-028');
  });

  it('keeps the handover label and reports missing fields without inventing values', () => {
    const { rerender } = renderBoard();
    expect(screen.getByLabelText('Handover progress 100 percent for Patient 052')).toHaveTextContent('100%');
    const patient = { ...simulatedPatients[0], nextAction: '', responsibleNurse: null, handoverComplete: null, dischargeReady: null };
    rerender(<WardSafetyBoard summary={wardSummary} patients={[patient]} onSelectPatient={() => {}} />);
    const row = screen.getByRole('button', { name: 'Open Patient 031 (DCU-031)' }).closest('tr');
    expect(within(row).getAllByText('Not recorded')).toHaveLength(4);
    expect(row.querySelector('.progress-ring')).toBeNull();
    expect(within(row).queryByText('Ready')).not.toBeInTheDocument();
  });

  it('keeps the simulation boundary and passes the strict safety-language scan', () => {
    renderBoard();
    const board = screen.getByRole('region', { name: 'Ward Safety Board' });
    expect(within(board).getByText('Simulation-only')).toBeInTheDocument();
    expect(within(board).getByText(/Human review required/)).toBeInTheDocument();
    expect(within(board).getByText('Not clinically validated and not for clinical decision-making.')).toBeInTheDocument();
    expect(scanStrictSafetyLanguage(board.textContent).violations).toEqual([]);
  });

  it('preserves the export action', async () => {
    const onExport = vi.fn();
    renderBoard({ onExport });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Export ward board CSV' }));
    expect(onExport).toHaveBeenCalledOnce();
  });
});
