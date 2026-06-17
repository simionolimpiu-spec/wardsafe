import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('SafeFlow prototype', () => {
  it('opens on the ward safety board with simulation boundaries visible', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'SafeFlow' })).toBeInTheDocument();
    expect(screen.getByText(/simulation only/i)).toBeInTheDocument();
    expect(screen.queryByText(/^NHS$/)).not.toBeInTheDocument();
    const wardList = screen.getByRole('table', { name: /ward patient list/i });
    expect(wardList).toBeInTheDocument();
    expect(within(wardList).getByText('DCU-031')).toBeInTheDocument();
  });

  it('selects a patient and shows the safety panel', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /open Patient 031/i }));

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    expect(within(panel).getByText('DCU-031')).toBeInTheDocument();
    expect(within(panel).getByText(/SBAR summary/i)).toBeInTheDocument();
  });

  it('shows handover and discharge readiness for the selected patient', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /handover/i }));

    expect(screen.getByRole('region', { name: /handover and discharge readiness/i })).toBeInTheDocument();
    expect(screen.getByText(/Handover 50% complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical plan unclear/i)).toBeInTheDocument();
  });
});
