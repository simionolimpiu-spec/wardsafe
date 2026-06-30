import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('SafeFlow interactive controls', () => {
  it('supports keyboard navigation across the hero workflow tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    const workflowTabs = screen.getByRole('tablist', { name: /safeflow workflow steps/i });
    const readinessTab = within(workflowTabs).getByRole('tab', { name: /readiness/i });
    readinessTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(within(workflowTabs).getByRole('tab', { name: /signals/i })).toHaveFocus();
    expect(screen.getByRole('heading', { level: 3, name: /risk signal review/i })).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(within(workflowTabs).getByRole('tab', { name: /audit/i })).toHaveFocus();
    expect(screen.getByRole('heading', { level: 3, name: /audit learning loop/i })).toBeInTheDocument();
  });

  it('supports keyboard navigation across the dashboard tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    const dashboardTabs = screen.getByRole('tablist', { name: /dashboard sections/i });
    const readinessTab = within(dashboardTabs).getByRole('tab', { name: /readiness/i });
    readinessTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(within(dashboardTabs).getByRole('tab', { name: /signals/i })).toHaveFocus();
    expect(screen.getByText(/documentation gap cluster/i)).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(within(dashboardTabs).getByRole('tab', { name: /escalation/i })).toHaveFocus();
    expect(screen.getByText(/observe -> review/i)).toBeInTheDocument();
  });
});
