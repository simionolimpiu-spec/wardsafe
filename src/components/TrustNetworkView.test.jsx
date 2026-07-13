import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TrustNetworkView } from './TrustNetworkView.jsx';

describe('TrustNetworkView', () => {
  it('renders both trusts, inter-trust journeys and the simulation-only boundary', () => {
    render(<TrustNetworkView />);

    // both trusts named
    expect(screen.getByText('James Paget University Hospital')).toBeInTheDocument();
    expect(screen.getByText('Norfolk and Norwich University Hospital')).toBeInTheDocument();

    // simulation-only boundary present, not positioned as a live inter-trust system
    const region = screen.getByLabelText('Two-Trust Network');
    expect(within(region).getAllByText(/simulation-only/i).length).toBeGreaterThan(0);
    expect(within(region).getAllByText(/not a live inter-trust/i).length).toBeGreaterThan(0);

    // at least one inter-trust journey with handover segments and both trust chips
    expect(screen.getByText(/Inter-trust handover journeys/i)).toBeInTheDocument();
    const jamesPagetChips = screen.getAllByText('James Paget');
    const nnuhChips = screen.getAllByText('Norfolk & Norwich');
    expect(jamesPagetChips.length).toBeGreaterThan(0);
    expect(nnuhChips.length).toBeGreaterThan(0);

    // an outcome that returns to James Paget and one that discharges with a package of care
    expect(screen.getAllByText(/Returns to James Paget/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Discharge with package of care/i).length).toBeGreaterThan(0);

    // no unsafe clinical wording in the rendered surface
    expect(region.textContent).not.toMatch(/diagnos|prescrib|automated escalation|staff scoring|league table/i);
  });
});
