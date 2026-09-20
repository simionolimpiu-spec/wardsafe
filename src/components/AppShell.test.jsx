import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getDemoScenarioSelectionOptions } from '../data/demoScenarios.js';
import { wardSummary } from '../data/simulatedPatients.js';
import { AppShell } from './AppShell.jsx';

describe('AppShell', () => {
  it('renders the approved navigation, context controls and safety banner', () => {
    render(
      <AppShell
        currentWardName={wardSummary.unitName}
        dateLabel={wardSummary.dateLabel}
        escalationCount={wardSummary.metrics.activeEscalations}
        onNavigate={vi.fn()}
        onScenarioChange={vi.fn()}
        scenarioOptions={getDemoScenarioSelectionOptions()}
        selectedScenarioId="day-care-treatment-pathway"
        taskCount={5}
      >
        <section aria-label="Shell test content"><h2>Ward content</h2></section>
      </AppShell>
    );

    const workspace = screen.getByRole('navigation', { name: /SafeFlow workspace/i });
    ['Ward Safety Board', 'My Patients', 'Observations', 'Tasks', 'Escalations', 'Handover', 'Discharges', 'Reports', 'Scenarios', 'Hospital insights', 'Competency Passport', 'Learning Hub', 'Patient Journey Twin', 'Trust Network', 'Audit Trail', 'Settings']
      .forEach((label) => expect(within(workspace).getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument());
    expect(screen.getByRole('combobox', { name: 'Training scenario' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /simulation date/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /simulation safety boundary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SafeFlow' })).toBeInTheDocument();
  });

  it('shows the snapshot date without misleading date controls', async () => {
    render(<AppShell currentWardName={wardSummary.unitName} dateLabel={wardSummary.dateLabel} />);

    const dateGroup = screen.getByRole('group', { name: /simulation date/i });
    expect(dateGroup).toHaveAttribute('aria-describedby', 'simulation-date-note');
    expect(screen.getByText(/fictional snapshot date/i)).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2026-06-17');

    expect(within(dateGroup).queryByRole('button')).not.toBeInTheDocument();

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2026-06-17');
  });

  it('provides a human-readable simulation notification state', async () => {
    const user = userEvent.setup();
    render(<AppShell currentWardName={wardSummary.unitName} dateLabel={wardSummary.dateLabel} />);

    const bell = screen.getByRole('button', { name: 'Notifications' });
    expect(bell).toHaveAttribute('aria-expanded', 'false');

    await user.click(bell);

    expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No simulation notifications recorded.')).toBeInTheDocument();

    await user.click(bell);
    expect(screen.queryByText('No simulation notifications recorded.')).not.toBeInTheDocument();
  });

  it('offers mobile quick tabs whose More button opens the workspace drawer (SF-300)', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<AppShell activeView="board" currentWardName="Day Care Unit" dateLabel={wardSummary.dateLabel} onNavigate={onNavigate} taskCount={5} />);

    const quick = screen.getByRole('navigation', { name: 'Quick navigation' });
    expect(within(quick).getAllByRole('button').map((button) => button.textContent)).toEqual(['Board', 'Patients', 'Obs', 'Tasks5', 'More']);
    expect(within(quick).getByRole('button', { name: 'Board' })).toHaveAttribute('aria-current', 'page');

    const more = within(quick).getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-controls', 'workspace-navigation');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const drawer = document.getElementById('workspace-navigation');
    expect(drawer).toHaveClass('is-open');
    expect(drawer).toHaveAttribute('role', 'dialog');
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(drawer).not.toHaveClass('is-open');
    await waitFor(() => expect(more).toHaveFocus());

    await user.click(within(quick).getByRole('button', { name: 'Obs' }));
    expect(onNavigate).toHaveBeenLastCalledWith('observations');
  });

  it('marks More as current for screens outside the quick tabs', () => {
    render(<AppShell activeView="handover" currentWardName="Day Care Unit" dateLabel={wardSummary.dateLabel} />);
    const quick = screen.getByRole('navigation', { name: 'Quick navigation' });
    expect(within(quick).getByRole('button', { name: 'More' })).toHaveClass('is-current');
    expect(within(quick).queryByRole('button', { current: 'page' })).toBeNull();
  });

  it('switches the quick tabs to primary care screens in the primary care setting', () => {
    render(<AppShell activeView="practice-overview" carePathway="primary-care" currentWardName="Fictional practice" dateLabel={wardSummary.dateLabel} taskCount={3} />);
    const quick = screen.getByRole('navigation', { name: 'Quick navigation' });
    expect(within(quick).getAllByRole('button').map((button) => button.textContent)).toEqual(['Overview', 'Requests', 'Results', 'Tasks3', 'More']);
    expect(within(quick).getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  });
});
