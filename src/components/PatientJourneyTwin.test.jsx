import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PatientJourneyTwin } from './PatientJourneyTwin.jsx';

describe('PatientJourneyTwin', () => {
  it('renders an accessible long-range day scrubber with keyboard support', async () => {
    const user = userEvent.setup();
    render(<PatientJourneyTwin patient={{ id: 'DCU-031' }} />);

    const slider = screen.getByRole('slider', { name: /journey day scrubber/i });
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '1300');
    expect(slider).toHaveAttribute('aria-valuetext', 'Day 1300 of 1300');
    expect(screen.getByRole('button', { name: /previous journey day/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /next journey day/i })).toBeDisabled();

    slider.focus();
    await user.keyboard('{ArrowLeft}');

    expect(slider).toHaveValue('1299');
    expect(slider).toHaveAttribute('aria-valuetext', 'Day 1299 of 1300');
  });

  it('jumps the scrubber and highlights the current episode chapter', () => {
    render(<PatientJourneyTwin patient={{ id: 'DCU-031' }} />);

    const transferChapter = screen.getAllByRole('button', { name: /transfer/i })[0];
    fireEvent.click(transferChapter);

    const slider = screen.getByRole('slider', { name: /journey day scrubber/i });
    expect(Number(slider.value)).toBeGreaterThan(1);
    expect(screen.getByText(/Current chapter:/i)).toHaveTextContent(/Transfer/i);
    expect(transferChapter).toHaveAttribute('aria-current', 'step');
  });

  it('renders then-vs-now observation rows, locations, phases and readable trends', () => {
    render(<PatientJourneyTwin patient={{ id: 'DCU-031' }} />);

    const comparison = screen.getByRole('table', { name: /then versus now observations/i });
    expect(within(comparison).getAllByRole('row')).toHaveLength(7);
    expect(within(comparison).getByText('Respiratory rate')).toBeInTheDocument();
    expect(within(comparison).getByText('Oxygen saturation')).toBeInTheDocument();
    expect(screen.getByText('Location then')).toBeInTheDocument();
    expect(screen.getByText('Location now')).toBeInTheDocument();
    expect(screen.getByText('Phase then')).toBeInTheDocument();
    expect(screen.getByText('Phase now')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /trend across day 1 to day 1300/i })).toHaveLength(6);
    expect(screen.getAllByText(/Values: Day 1:/i)).toHaveLength(6);
    expect(screen.getAllByText(/human review required/i).length).toBeGreaterThan(0);
  });

  it('keeps a selected day when valid and clamps it when a new patient range is shorter', () => {
    const { rerender } = render(<PatientJourneyTwin patient={{ id: 'DCU-031', latestDay: 10 }} />);
    const slider = screen.getByRole('slider', { name: /journey day scrubber/i });

    fireEvent.change(slider, { target: { value: '5' } });
    expect(slider).toHaveValue('5');

    rerender(<PatientJourneyTwin patient={{ id: 'DCU-028', latestDay: 4 }} />);

    expect(screen.getByRole('slider', { name: /journey day scrubber/i })).toHaveValue('4');
    expect(screen.getByRole('slider', { name: /journey day scrubber/i })).toHaveAttribute('aria-valuetext', 'Day 4 of 4');
  });
});


describe('PatientJourneyTwin night view (SF-298)', () => {
  it('switches both ways without changing any content or hiding boundary and source notes', () => {
    render(<PatientJourneyTwin />);
    const view = screen.getByRole('region', { name: 'Patient Journey Twin', exact: true });
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
    const notes = view.querySelectorAll('.twin-boundary-note, .twin-summary-chip, .twin-simulation-badge, .twin-review-note, .twin-change-note');
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) expect(note).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(view).not.toHaveClass('sf-zone-night');
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view.textContent).toBe(originalContent);
  });

  it('starts in night view when requested and retains the simulation boundaries', () => {
    render(<PatientJourneyTwin defaultTheme="night" />);
    const view = screen.getByRole('region', { name: 'Patient Journey Twin', exact: true });
    expect(view).toHaveClass('sf-zone-night');
    expect(view).toHaveAttribute('data-sf-theme', 'night');
    expect(within(view).getByRole('button', { name: 'Night view' })).toHaveAttribute('aria-pressed', 'true');
    for (const wording of ["Simulation-only","Fictional patient data","Not a live clinical record","Human review required","No live patient data"]) expect(view).toHaveTextContent(wording);
  });

  it('falls back for unknown themes and follows presentation-default changes', () => {
    const { rerender } = render(<PatientJourneyTwin defaultTheme="unknown" />);
    const view = screen.getByRole('region', { name: 'Patient Journey Twin', exact: true });
    const toggle = within(view).getByRole('button', { name: 'Night view' });
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view).not.toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    rerender(<PatientJourneyTwin defaultTheme="night" />);
    expect(view).toHaveAttribute('data-sf-theme', 'night');
    expect(view).toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    rerender(<PatientJourneyTwin defaultTheme="unknown" />);
    expect(view).toHaveAttribute('data-sf-theme', 'standard');
    expect(view).not.toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});
