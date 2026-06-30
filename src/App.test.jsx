import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('SafeFlow website', () => {
  it('renders the hero with one H1 and clear simulation-safe positioning', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText(/simulation preview · stakeholder discovery/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /make ward risk visible before escalation is missed/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open cep brief/i })).toHaveAttribute('href', '#cep-brief');
    expect(screen.getByRole('link', { name: /view pilot pathway/i })).toHaveAttribute('href', '#pilot-pathway');
    expect(screen.getAllByText(/no patient data shown/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/NHS approved|clinically validated decision support|AI diagnosis/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /what this preview shows/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /what this preview does not show/i })).toBeInTheDocument();
  });

  it('updates the hero workflow detail panel when a workflow step is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    const workflow = screen.getByRole('tablist', { name: /safeflow workflow steps/i });
    await user.click(within(workflow).getByRole('tab', { name: /audit/i }));

    expect(screen.getByRole('heading', { level: 3, name: /audit learning loop/i })).toBeInTheDocument();
    expect(screen.getAllByText(/captures the action trail so teams can turn repeated friction points into learning/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/action trace, learning note prompts, and governance-ready exports/i)).toBeInTheDocument();
  });

  it('switches the dashboard preview tabs and exposes simulation-safe content', async () => {
    const user = userEvent.setup();
    render(<App />);

    const dashboardTabs = screen.getByRole('tablist', { name: /dashboard sections/i });
    await user.click(within(dashboardTabs).getByRole('tab', { name: /signals/i }));

    expect(screen.getByRole('heading', { level: 4, name: /risk signal review/i })).toBeInTheDocument();
    expect(screen.getByText(/delayed senior review marker/i)).toBeInTheDocument();
    expect(screen.getByText(/^source: placeholder provider$/i)).toBeInTheDocument();
    expect(screen.getByText(/simulation output for preview only\. not clinically validated and not for clinical decision-making\./i)).toBeInTheDocument();

    await user.click(within(dashboardTabs).getByRole('tab', { name: /audit/i }));

    expect(screen.getByRole('heading', { level: 4, name: /audit learning/i })).toBeInTheDocument();
    expect(screen.getByText(/action trace captured/i)).toBeInTheDocument();
    expect(screen.getByText(/governance export ready/i)).toBeInTheDocument();
  });

  it('lets users inspect the pilot pathway without overlapping principle text', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /escalation pathway/i }));

    expect(screen.getByRole('heading', { level: 4, name: /escalation pathway/i })).toBeInTheDocument();
    expect(screen.getByText(/named route, next review action, and escalation ownership/i)).toBeInTheDocument();
    expect(screen.getByText(/principle: support clinical judgement, do not replace it\./i)).toBeInTheDocument();
    expect(screen.getByText(/safeflow is designed for simulation, governance review, and workflow validation before any live deployment\./i)).toBeInTheDocument();
  });

  it('renders a cep brief with careful claims language', () => {
    render(<App />);

    const cepSection = screen.getByRole('heading', { level: 2, name: /summarise the early-stage product case without overstating readiness/i }).closest('section');
    expect(cepSection).not.toBeNull();
    expect(within(cepSection).getByText(/prepared for governance review, simulation rehearsal, and pilot pathway planning/i)).toBeInTheDocument();
    expect(within(cepSection).getByText(/no nhs approval, endorsement, or current deployment claim/i)).toBeInTheDocument();
    expect(within(cepSection).getByText(/no patient outcome improvement claim until evidence exists/i)).toBeInTheDocument();
  });
});
