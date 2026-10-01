import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { SIMULATION_PATHWAY_KEY, SIMULATION_SESSION_KEY, SimulationAccessGate } from './SimulationAccessGate.jsx';

describe('SimulationAccessGate', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('requires accessible prototype credentials before revealing the workspace', async () => {
    const user = userEvent.setup();
    render(
      <SimulationAccessGate>
        {() => <h1>Workspace ready</h1>}
      </SimulationAccessGate>
    );

    expect(screen.getByText(/fictional patient data only/i)).toBeInTheDocument();
    expect(screen.getByText(/clinical judgement remains central/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enter simulation workspace' }));

    expect(screen.getByRole('alert')).toHaveTextContent('There is a problem');
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText('Work email'), 'reviewer@safeflow.demo');
    await user.type(screen.getByLabelText('Password'), 'simulation');
    await user.click(screen.getByRole('button', { name: 'Enter simulation workspace' }));

    expect(await screen.findByRole('heading', { name: 'Workspace ready' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(SIMULATION_SESSION_KEY)).toBe('active');
  });

  it('allows password managers and paste-friendly authentication fields', () => {
    render(<SimulationAccessGate>{() => <h1>Workspace ready</h1>}</SimulationAccessGate>);

    expect(screen.getByLabelText('Work email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('opens the selected primary-care simulation pathway', async () => {
    const user = userEvent.setup();
    render(
      <SimulationAccessGate>
        {({ pathway }) => <h1>{pathway === 'primary-care' ? 'Primary care ready' : 'Ward ready'}</h1>}
      </SimulationAccessGate>
    );

    await user.click(screen.getByRole('radio', { name: /Primary care/i }));
    await user.type(screen.getByLabelText('Work email'), 'reviewer@safeflow.demo');
    await user.type(screen.getByLabelText('Password'), 'simulation');
    await user.click(screen.getByRole('button', { name: 'Enter simulation workspace' }));

    expect(await screen.findByRole('heading', { name: 'Primary care ready' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(SIMULATION_PATHWAY_KEY)).toBe('primary-care');
  });

  it('removes the browser-local session when the user signs out', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(SIMULATION_SESSION_KEY, 'active');
    render(
      <SimulationAccessGate>
        {({ signOut }) => <button onClick={signOut}>Sign out test session</button>}
      </SimulationAccessGate>
    );

    await user.click(screen.getByRole('button', { name: 'Sign out test session' }));

    expect(await screen.findByRole('heading', { name: 'Sign in to SafeFlow' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(SIMULATION_SESSION_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(SIMULATION_PATHWAY_KEY)).toBeNull();
  });
});
