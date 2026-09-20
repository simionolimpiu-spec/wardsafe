import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('renders a default-day ward trend rollup for every trust-network ward', () => {
    render(<TrustNetworkView />);

    const region = screen.getByLabelText('England Trust Network');
    const wardTrendPanels = within(region).getAllByRole('article', { name: /ward trend \(simulation\) for/i });

    expect(wardTrendPanels.length).toBeGreaterThan(50);
    expect(within(region).getAllByText('Ward trend (simulation)').length).toBe(wardTrendPanels.length);
    expect(region.textContent).toMatch(/Fictional cohort: \d+ patients/);
    expect(region.textContent).toMatch(/Respiratory rate/);
    expect(region.textContent).toMatch(/Review-support flags: \d+ then -> \d+ now/);
    expect(region.textContent).toMatch(/human review required; review-support cue only/i);
  });

  it('keeps the first ward trend open and the rest behind one disclosure per hospital (SF-301)', () => {
    render(<TrustNetworkView />);
    const region = screen.getByLabelText('England Trust Network');
    const cards = region.querySelectorAll('.review-report-summary-card');
    expect(cards.length).toBeGreaterThan(1);
    for (const card of cards) {
      const trends = card.querySelectorAll('article.trust-network-ward-trend');
      const details = card.querySelector('details.trust-network-ward-trend-more');
      expect(trends[0]).toBeVisible();
      expect(trends[0].closest('details')).toBeNull();
      if (trends.length > 1) {
        expect(details).not.toHaveAttribute('open');
        expect(within(details).getByText(`Show ${trends.length - 1} more ward ${trends.length === 2 ? 'trend' : 'trends'}`)).toBeInTheDocument();
        expect(details.querySelectorAll('article.trust-network-ward-trend')).toHaveLength(trends.length - 1);
        expect(trends[1]).not.toBeVisible();
        details.open = true;
        expect(trends[1]).toBeVisible();
      }
    }
  });

  it('recomputes a ward trend when its day preset changes', () => {
    render(<TrustNetworkView />);

    const region = screen.getByLabelText('England Trust Network');
    const panel = within(region).getAllByRole('article', { name: /ward trend \(simulation\) for/i })[0];
    const rangeSelect = within(panel).getByRole('combobox', { name: /compare fictional ward days/i });
    const respiratoryRateRow = within(panel).getByRole('row', { name: /respiratory rate/i });
    const defaultRow = respiratoryRateRow.textContent;

    expect(panel).toHaveTextContent('1 -> 90');
    fireEvent.change(rangeSelect, { target: { value: '1-180' } });

    expect(panel).toHaveTextContent('1 -> 180');
    expect(within(panel).getByRole('row', { name: /respiratory rate/i }).textContent).not.toBe(defaultRow);
  });
});


describe('TrustNetworkView night view (SF-298)', () => {
  it('switches both ways without changing any content or hiding boundary and source notes', () => {
    render(<TrustNetworkView />);
    const view = screen.getByRole('region', { name: 'England Trust Network', exact: true });
    const toggle = within(view).getByRole('button', { name: 'Night view' });
    const originalContent = view.textContent;
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view).not.toHaveClass('sf-zone-night');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(view).toHaveClass('sf-zone-night');
    expect(view).toHaveAttribute('data-sf-theme', 'night');
    expect(view.textContent).toBe(originalContent);
    // SF-301: extra ward trends start collapsed by design. The first trend in
    // every hospital keeps its human-review note visible; expanding the rest
    // must show every note in night view too.
    for (const card of view.querySelectorAll('.review-report-summary-card')) {
      expect(card.querySelector('.trust-network-ward-trend-note')).toBeVisible();
    }
    view.querySelectorAll('details.trust-network-ward-trend-more').forEach((details) => { details.open = true; });
    const notes = view.querySelectorAll('.section-heading p, .trust-network-note, .review-report-summary-card > small, .trust-network-ward-trend-note, .trust-network-timeline > small, .trust-network-learning small');
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) expect(note).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(view).not.toHaveClass('sf-zone-night');
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view.textContent).toBe(originalContent);
  });

  it('starts in night view when requested and retains the simulation boundaries', () => {
    render(<TrustNetworkView defaultTheme="night" />);
    const view = screen.getByRole('region', { name: 'England Trust Network', exact: true });
    expect(view).toHaveClass('sf-zone-night');
    expect(view).toHaveAttribute('data-sf-theme', 'night');
    expect(within(view).getByRole('button', { name: 'Night view' })).toHaveAttribute('aria-pressed', 'true');
    for (const wording of ["Simulation-only","Human review required","Not a live cross-trust record","fictional patients","source:"]) expect(view).toHaveTextContent(wording);
  });

  it('falls back for unknown themes and follows presentation-default changes', () => {
    const { rerender } = render(<TrustNetworkView defaultTheme="unknown" />);
    const view = screen.getByRole('region', { name: 'England Trust Network', exact: true });
    const toggle = within(view).getByRole('button', { name: 'Night view' });
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view).not.toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    rerender(<TrustNetworkView defaultTheme="night" />);
    expect(view).toHaveAttribute('data-sf-theme', 'night');
    expect(view).toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    rerender(<TrustNetworkView defaultTheme="unknown" />);
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view).not.toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});
