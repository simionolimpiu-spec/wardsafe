import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TrustNetworkView } from './TrustNetworkView.jsx';

describe('TrustNetworkView', () => {
  it('renders the England trust network, portable journeys and learning copies', () => {
    render(<TrustNetworkView />);

    // multiple trusts named, including the tertiary transfer anchor
    expect(screen.getByText('James Paget University Hospital')).toBeInTheDocument();
    expect(screen.getByText(/Addenbrooke's Hospital/)).toBeInTheDocument();

    const region = screen.getByLabelText('England Trust Network');
    expect(within(region).getAllByText(/simulation-only/i).length).toBeGreaterThan(0);
    expect(within(region).getAllByText(/not a live cross-trust record/i).length).toBeGreaterThan(0);

    // portable journeys + learning copy back to originating trust
    expect(screen.getByText(/Portable patient journeys across trusts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Learning copy →/i).length).toBeGreaterThan(0);

    // journey type + outcome labels present
    expect(screen.getAllByText(/Relocation|Away from home|Specialist transfer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Returns to James Paget|Care continues at new trust|Returns home/i).length).toBeGreaterThan(0);

    // per-journey fictional patient observation timeline renders
    expect(screen.getAllByText(/observations \((stable|drifting)\)/i).length).toBeGreaterThan(0);
    expect(region.textContent).toMatch(/RR \d+/);
    expect(region.textContent).toMatch(/SpO/);

    expect(region.textContent).not.toMatch(/diagnos|prescrib|automated escalation|staff scoring|league table/i);
  });
});
