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
