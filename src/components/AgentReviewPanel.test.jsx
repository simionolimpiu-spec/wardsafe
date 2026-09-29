import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AgentReviewPanel } from './AgentReviewPanel.jsx';
import { PatientSafetyPanel } from './PatientSafetyPanel.jsx';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { createReviewRun, createMockAIModelProvider } from '../agent/index.js';

const patient = simulatedPatients[0];
const now = () => '2026-06-17T14:00:00.000Z';
function factory(options = {}, deps = {}) {
  let id = 0;
  return vi.fn(() => createReviewRun({ patientId: patient.id, workspaceId: 'test', ...options },
    { now, createId: () => `ui-${++id}`, ...deps }));
}
const panel = () => screen.getByRole('region', { name: 'Simulated agent review' });

describe('AgentReviewPanel', () => {
  it('waits for explicit start, shows trust tiers and evidence, and records acceptance', async () => {
    const createRun = factory();
    const user = userEvent.setup();
    render(<AgentReviewPanel patient={patient} createRun={createRun} />);
    expect(createRun).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    const view = within(panel());
    expect(await view.findByText('Human review required.')).toBeVisible();
    expect(view.getByRole('heading', { name: 'Source facts' })).toBeVisible();
    expect(view.getByText(/Potassium 3.8 mmol\/L at/)).toBeVisible();
    expect(view.getByText(/Potassium 3.2 mmol\/L at/)).toBeVisible();
    expect(view.getByText(/Recorded potassium change: -0.6/)).toBeVisible();
    expect(view.getByRole('heading', { name: 'AI interpretation · Untrusted draft' })).toBeVisible();
    await user.click(view.getByText('Why this review cue appeared'));
    expect(view.getByText('DCU-031:labs.potassium.0', { exact: true })).toBeVisible();
    await user.click(view.getByRole('button', { name: 'Accept review' }));
    expect(view.getByText('Human review recorded: accepted.')).toBeVisible();
    expect(view.getByText('The original AI interpretation remains untrusted.')).toBeVisible();
    expect(view.queryByRole('button', { name: 'Accept review' })).not.toBeInTheDocument();
    await user.click(view.getByText(/Review session audit/));
    expect(view.getByText(/HUMAN REVIEW COMPLETED/)).toBeVisible();
  });
  it('keeps the original interpretation alongside a human-authored edit', async () => {
    const user = userEvent.setup();
    render(<AgentReviewPanel patient={patient} createRun={factory()} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    await user.click(await screen.findByRole('button', { name: 'Edit review' }));
    await user.clear(screen.getByLabelText('Your edited review'));
    await user.type(screen.getByLabelText('Your edited review'), 'Checked the fictional lab timestamps.');
    await user.click(screen.getByRole('button', { name: 'Save edited review' }));
    expect(screen.getByText('Human review recorded: edited.')).toBeVisible();
    expect(screen.getByText('Human-authored edit: Checked the fictional lab timestamps.')).toBeVisible();
    expect(screen.getByText('Potassium has decreased across the simulated period (3.8 to 3.2 mmol/L).')).toBeVisible();
  });
  it('records rejection without accepting the cue', async () => {
    const user = userEvent.setup();
    render(<AgentReviewPanel patient={patient} createRun={factory()} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    await user.click(await screen.findByRole('button', { name: 'Reject review' }));
    expect(screen.getByText('Human review recorded: rejected.')).toBeVisible();
  });
  it('cancels a pending run and makes retry available', async () => {
    const user = userEvent.setup();
    const createRun = factory({}, { provider: createMockAIModelProvider({ responses: [{ hang: true }] }) });
    render(<AgentReviewPanel patient={patient} createRun={createRun} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    expect(screen.getByRole('button', { name: 'Run simulated review' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel review' }));
    expect(await screen.findByText('Review cancelled. No review cue was created.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry simulated review' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Accept review' })).not.toBeInTheDocument();
  });
  it('shows a safe error state and audits the failure', async () => {
    const user = userEvent.setup();
    render(<AgentReviewPanel patient={patient} createRun={factory({ maxIterations: 1 })} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    expect(await screen.findByText(/Review stopped. No review cue was created/)).toBeVisible();
    await user.click(screen.getByText(/Review session audit/));
    expect(screen.getByText('Stop reason: ITERATION_LIMIT')).toBeVisible();
  });
  describe('keyboard focus follows the review', () => {
    it('moves focus to the source facts when a run finishes and to the decision after a review is recorded', async () => {
      const user = userEvent.setup();
      render(<AgentReviewPanel patient={patient} createRun={factory()} />);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      const view = within(panel());
      expect(await view.findByRole('heading', { name: 'Source facts' })).toHaveFocus();
      await user.click(view.getByRole('button', { name: 'Accept review' }));
      expect(view.getByRole('heading', { name: 'Human decision' })).toHaveFocus();
    });
    it('keeps focus in the panel after rejecting a review', async () => {
      const user = userEvent.setup();
      render(<AgentReviewPanel patient={patient} createRun={factory()} />);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      await user.click(await screen.findByRole('button', { name: 'Reject review' }));
      expect(screen.getByRole('heading', { name: 'Human decision' })).toHaveFocus();
    });
    it('moves focus to the decision after an edited review is saved', async () => {
      const user = userEvent.setup();
      render(<AgentReviewPanel patient={patient} createRun={factory()} />);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      await user.click(await screen.findByRole('button', { name: 'Edit review' }));
      await user.clear(screen.getByLabelText('Your edited review'));
      await user.type(screen.getByLabelText('Your edited review'), 'Checked the fictional lab timestamps.');
      await user.click(screen.getByRole('button', { name: 'Save edited review' }));
      expect(screen.getByRole('heading', { name: 'Human decision' })).toHaveFocus();
    });
    it('leaves focus on Save when an empty edit is refused', async () => {
      const user = userEvent.setup();
      render(<AgentReviewPanel patient={patient} createRun={factory()} />);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      await user.click(await screen.findByRole('button', { name: 'Edit review' }));
      await user.clear(screen.getByLabelText('Your edited review'));
      const save = screen.getByRole('button', { name: 'Save edited review' });
      await user.click(save);
      expect(screen.queryByText('Human review recorded: edited.')).not.toBeInTheDocument();
      expect(save).toHaveFocus();
    });
    it('returns focus to Edit review when the edit is cancelled', async () => {
      const user = userEvent.setup();
      render(<AgentReviewPanel patient={patient} createRun={factory()} />);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      await user.click(await screen.findByRole('button', { name: 'Edit review' }));
      await user.click(screen.getByRole('button', { name: 'Cancel edit' }));
      expect(screen.getByRole('button', { name: 'Edit review' })).toHaveFocus();
    });
    it('moves focus to Retry when a run is cancelled', async () => {
      const user = userEvent.setup();
      const createRun = factory({}, { provider: createMockAIModelProvider({ responses: [{ hang: true }] }) });
      render(<AgentReviewPanel patient={patient} createRun={createRun} />);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      await user.click(screen.getByRole('button', { name: 'Cancel review' }));
      expect(await screen.findByRole('button', { name: 'Retry simulated review' })).toHaveFocus();
    });
    it('does not take focus from somewhere else the reviewer has moved to', async () => {
      let resolve;
      const createRun = () => ({ cancel: vi.fn(), run: () => new Promise((done) => { resolve = done; }) });
      const user = userEvent.setup();
      render(<><button type="button">Elsewhere</button><AgentReviewPanel patient={patient} createRun={createRun} /></>);
      await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
      screen.getByRole('button', { name: 'Elsewhere' }).focus();
      await act(async () => { resolve({ status: 'cancelled', events: [] }); });
      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    });
  });
  it('cancels on unmount and ignores a late result', async () => {
    let resolve;
    const cancel = vi.fn();
    const createRun = () => ({ cancel, run: () => new Promise((done) => { resolve = done; }) });
    const user = userEvent.setup();
    const view = render(<AgentReviewPanel patient={patient} createRun={createRun} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    view.unmount();
    expect(cancel).toHaveBeenCalledOnce();
    await act(async () => { resolve({ status: 'cancelled', events: [] }); });
    expect(screen.queryByRole('region', { name: 'Simulated agent review' })).not.toBeInTheDocument();
  });
  it('keeps the review across detail tabs and clears it on patient switch', async () => {
    const user = userEvent.setup();
    const flag = { level: 'none' };
    const view = render(<PatientSafetyPanel patient={patient} flag={flag} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    expect(await screen.findByText('Human review required.')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'SBAR', exact: true }));
    expect(screen.queryByRole('region', { name: 'Simulated agent review' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Safety Overview' }));
    expect(screen.getByText('Human review required.')).toBeVisible();
    view.rerender(<PatientSafetyPanel patient={simulatedPatients[1]} flag={flag} />);
    expect(screen.queryByRole('region', { name: 'Simulated agent review' })).not.toBeInTheDocument();
    view.rerender(<PatientSafetyPanel patient={patient} flag={flag} />);
    expect(screen.getByRole('button', { name: 'Run simulated review' })).toBeVisible();
  });
  it('clears an existing review when the same patient context is replaced', async () => {
    const user = userEvent.setup();
    const createRun = factory();
    const view = render(<AgentReviewPanel patient={patient} createRun={createRun} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    expect(await screen.findByText('Human review required.')).toBeVisible();
    view.rerender(<AgentReviewPanel patient={{ ...patient }} createRun={createRun} />);
    expect(screen.getByRole('button', { name: 'Run simulated review' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Accept review' })).not.toBeInTheDocument();
  });
  it('cancels and ignores an old in-flight run after a same-patient context reset', async () => {
    let resolve;
    const cancel = vi.fn();
    const createRun = () => ({ cancel, run: () => new Promise((done) => { resolve = done; }) });
    const user = userEvent.setup();
    const view = render(<AgentReviewPanel patient={patient} createRun={createRun} />);
    await user.click(screen.getByRole('button', { name: 'Run simulated review' }));
    view.rerender(<AgentReviewPanel patient={{ ...patient }} createRun={createRun} />);
    expect(cancel).toHaveBeenCalledOnce();
    await act(async () => { resolve({ status: 'cancelled', events: [] }); });
    expect(screen.getByRole('button', { name: 'Run simulated review' })).toBeEnabled();
    expect(screen.queryByText('Review cancelled. No review cue was created.')).not.toBeInTheDocument();
  });
});
