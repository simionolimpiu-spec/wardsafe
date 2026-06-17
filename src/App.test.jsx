import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('shows the fuller clinical workspace shell without official branding', () => {
    render(<App />);

    const productNav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });
    expect(within(productNav).getByRole('button', { name: /ward safety board/i })).toBeInTheDocument();
    expect(within(productNav).getByText(/Tasks/)).toBeInTheDocument();
    expect(within(productNav).getByText('6')).toBeInTheDocument();
    expect(screen.getByText(/FHIR-ready integrations/i)).toBeInTheDocument();
    expect(screen.getByText(/Simplified cloud architecture/i)).toBeInTheDocument();
    expect(screen.queryByText(/^NHS$/)).not.toBeInTheDocument();
  });

  it('shows richer fictional ward rows and circular handover progress', () => {
    render(<App />);

    const wardList = screen.getByRole('table', { name: /ward patient list/i });
    expect(within(wardList).getByText('DCU-052')).toBeInTheDocument();
    expect(within(wardList).getByText(/Anticoagulant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/handover progress 100 percent for Patient 052/i)).toBeInTheDocument();
  });

  it('keeps the ward table inside a scrollable board region', () => {
    render(<App />);

    const wardList = screen.getByRole('table', { name: /ward patient list/i });
    expect(wardList.parentElement).toHaveClass('table-scroll');
  });

  it('selects a patient and shows the safety panel', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /open Patient 031/i }));

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    expect(within(panel).getByText('DCU-031')).toBeInTheDocument();
    expect(within(panel).getByText(/SBAR summary/i)).toBeInTheDocument();
  });

  it('switches patient panel tabs for tasks and audit trail', async () => {
    const user = userEvent.setup();
    render(<App />);

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    await user.click(within(panel).getByRole('tab', { name: /tasks/i }));
    expect(within(panel).getByText(/Medical review/i)).toBeInTheDocument();

    await user.click(within(panel).getByRole('tab', { name: /audit trail/i }));
    expect(within(panel).getByText(/Escalation created/i)).toBeInTheDocument();
  });

  it('shows handover and discharge readiness for the selected patient', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /handover/i }));

    expect(screen.getByRole('region', { name: /handover and discharge readiness/i })).toBeInTheDocument();
    expect(screen.getByText(/Handover 50% complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical plan unclear/i)).toBeInTheDocument();
  });

  it('explains the potassium safety gap and records edited SBAR draft activity', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /potassium flag/i }));

    expect(screen.getByRole('region', { name: /potassium electrolyte safety gap/i })).toBeInTheDocument();
    expect(screen.getByText(/Potassium has fallen from 3.8 to 3.2 mmol\/L/i, { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText(/Magnesium result not visible/i, { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText(/does not prescribe/i)).toBeInTheDocument();

    const draft = screen.getByLabelText(/editable SBAR draft/i);
    fireEvent.change(draft, { target: { value: 'Edited safe escalation note.' } });
    await user.click(screen.getByRole('button', { name: /save SBAR draft/i }));

    expect(screen.getByText(/SBAR draft edited and saved/i)).toBeInTheDocument();
  });

  it('shows audit and learning timeline from simulated workflow events', async () => {
    const user = userEvent.setup();
    render(<App />);

    const journey = screen.getByRole('navigation', { name: /prototype journey/i });
    await user.click(within(journey).getByRole('tab', { name: 'Audit' }));

    expect(screen.getByRole('region', { name: /audit and learning/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Imported from fictional scenario timeline/i)).toHaveLength(3);
    expect(screen.getByText(/Documentation focus/i)).toBeInTheDocument();
  });
});
