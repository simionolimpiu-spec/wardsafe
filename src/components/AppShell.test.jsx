import { render, screen, within } from '@testing-library/react';
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
    expect(screen.getByRole('combobox', { name: 'Ward' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /simulation date/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /simulation safety boundary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SafeFlow' })).toBeInTheDocument();
  });
});
