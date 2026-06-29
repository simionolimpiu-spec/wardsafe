import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

describe('SafeFlow prototype', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens on the ward safety board with simulation boundaries visible', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'SafeFlow' })).toBeInTheDocument();
    expect(screen.getByText(/simulation only/i)).toBeInTheDocument();
    expect(screen.getByText(/fictional patient data only/i)).toBeInTheDocument();
    expect(screen.getByText(/not clinical advice/i)).toBeInTheDocument();
    expect(screen.getAllByText(/human review required/i).length).toBeGreaterThan(0);
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
    expect(within(productNav).getByText('5')).toBeInTheDocument();
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

  it('keeps the public preview boundary explicit and avoids unsafe clinical wording', () => {
    render(<App />);

    const boundary = screen.getByRole('region', { name: /simulation safety boundary/i });
    const boundaryText = boundary.textContent;

    expect(boundaryText).toMatch(/fictional patient data only/i);
    expect(boundaryText).toMatch(/not clinical advice/i);
    expect(boundaryText).toMatch(/not diagnosis/i);
    expect(boundaryText).toMatch(/not prescribing/i);
    expect(boundaryText).toMatch(/not live nhs deployment/i);
    expect(boundaryText).toMatch(/human review required/i);
    expect(boundaryText).not.toMatch(/diagnose this patient|prescribe potassium|administer potassium|give potassium|replace potassium/i);
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

    const handoverReadinessRegion = screen.getByRole('region', { name: /handover and discharge readiness/i });

    expect(handoverReadinessRegion).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/Handover 50% complete/i)).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/^Medical plan unclear$/i)).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/Simulation risk support/i)).toBeInTheDocument();
    const riskSupportSignals = within(handoverReadinessRegion).getByRole('list', { name: /risk-support signals/i });
    expect(riskSupportSignals).toBeInTheDocument();
    expect(within(riskSupportSignals).getByText(/Discharge readiness blockers/i)).toBeInTheDocument();
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

  it('can request a server-side provider SBAR draft without exposing an API key', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        draft: {
          provider: 'openai',
          model: 'gpt-5.5',
          isEditable: true,
          evidenceLinks: ['labs.potassium'],
          sections: {
            situation: 'API situation',
            background: 'API background',
            assessment: 'API assessment',
            recommendation: 'API recommendation'
          },
          boundary: 'Simulation boundary'
        }
      })
    }));
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /potassium flag/i }));
    await user.click(screen.getByRole('button', { name: /generate draft/i }));

    expect(screen.getByLabelText(/editable SBAR draft/i).value).toContain('RECOMMENDATION: API recommendation');
    expect(screen.getByText(/OpenAI provider draft ready/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/drafts/sbar', expect.objectContaining({
      body: JSON.stringify({ patientId: 'DCU-031' })
    }));
  });

  it('sanitizes unsafe replacement wording before simulation review cues reach the patient panel', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn((input) => {
      if (typeof input === 'string' && input.startsWith('/api/simulation/signals?patientId=DCU-031')) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            product: 'SafeFlow',
            simulationOnly: true,
            signals: [
              {
                signalId: 'signal-dcu-031-potassium-0910',
                syntheticPatientRef: 'DCU-031',
                sourceSystem: 'simulation-ice',
                sourceType: 'lab',
                signalCode: 'potassium',
                displayName: 'Potassium',
                value: '3.1',
                unit: 'mmol/L',
                status: 'final',
                effectiveAt: '2026-06-10T09:10:00.000Z',
                sourceFreshness: 'current',
                simulationOnly: true
              }
            ]
          })
        });
      }

      if (typeof input === 'string' && input.startsWith('/api/simulation/risk-suggestions?patientId=DCU-031')) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            product: 'SafeFlow',
            simulationOnly: true,
            suggestions: [
              {
                suggestionId: 'suggestion-dcu-031-replacement-risk',
                syntheticPatientRef: 'DCU-031',
                riskType: 'missed_action',
                riskTier: 'urgent',
                title: 'Replace potassium immediately',
                suggestedFlag: 'Potassium replacement pathway',
                suggestedBlocker: 'Autonomous clinical decision',
                suggestedTask: 'Replace potassium now',
                evidence: [{ label: 'Potassium replacement pathway' }],
                missingData: ['Need diagnosis'],
                requiresHumanReview: true,
                simulationOnly: true,
                createdAt: '2026-06-10T09:12:00.000Z'
              }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: false,
        json: vi.fn().mockResolvedValue({})
      });
    });
    vi.stubGlobal('fetch', fetch);

    render(<App />);

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const reviewCues = within(panel).getByRole('region', { name: /simulation review cues/i });

    await user.click(screen.getByRole('button', { name: /open Patient 031/i }));

    await within(reviewCues).findByText(/^Electrolyte review$/i);
    expect(reviewCues.textContent).toMatch(/human review required/i);
    expect(reviewCues.textContent).not.toMatch(/replace potassium|potassium replacement|diagnos|prescrib|administer|AI decided|autonomous decision/i);
  });

  it('shows a discovery scenario library with initial hazard controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /scenarios/i }));

    const scenarioRegion = screen.getByRole('region', { name: /discovery scenario library/i });
    expect(scenarioRegion).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Electrolyte \/ AKI documentation gap/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Sepsis escalation handover/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Discharge readiness blocker/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Initial hazard controls/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/No live patient data/i)).toBeInTheDocument();

    const scenarioText = scenarioRegion.textContent;
    expect(scenarioText).not.toMatch(/administer potassium|give potassium|replace potassium|prescribe potassium|diagnose this patient/i);
    expect(screen.queryByText(/^NHS$/)).not.toBeInTheDocument();
  });

  it('shows audit and learning timeline from simulated workflow events', async () => {
    const user = userEvent.setup();
    render(<App />);

    const journey = screen.getByRole('navigation', { name: /prototype journey/i });
    await user.click(within(journey).getByRole('tab', { name: 'Audit' }));

    expect(screen.getByRole('region', { name: /audit and learning/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Imported from fictional scenario timeline/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Documentation focus/i)).toBeInTheDocument();
  });

  it('refreshes backend audit events from the simulation API', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        source: 'local-audit-fixture',
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        events: [
          {
            product: 'SafeFlow',
            simulationOnly: true,
            source: 'local-audit-fixture',
            syntheticPatientRef: 'DCU-031',
            eventType: 'task.completed',
            eventSummary: 'Fictional task completed',
            occurredAt: '2026-06-10T09:15:00.000Z',
            metadata: { actorRole: 'charge_nurse', screen: 'tasks' }
          }
        ]
      })
    });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: 'Audit Trail' }));
    await user.click(screen.getByRole('button', { name: /refresh backend audit/i }));

    expect(await screen.findByText(/Backend audit source: local-audit-fixture/i)).toBeInTheDocument();
    expect(screen.getByText('DCU-031 - task.completed')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/simulation/audit-events', {
      headers: { Accept: 'application/json' }
    });
  });

  it('opens distinct patients and observations screens', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: 'My Patients' }));
    expect(screen.getByRole('heading', { name: 'My Patients' })).toBeInTheDocument();
    expect(screen.getByText(/assigned to Leanne Mitchell/i)).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: 'Observations' }));
    expect(screen.getByRole('heading', { name: 'Observations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record simulated observation/i })).toBeInTheDocument();
  });

  it('records a validated fictional observation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Observations' }));
    const news2 = screen.getByLabelText('NEWS2');
    await user.clear(news2);
    await user.type(news2, '5');
    await user.click(screen.getByRole('button', { name: /record simulated observation/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/observation recorded/i);
    const history = screen.getByRole('list', { name: /recorded observations/i });
    expect(within(history).getByText(/NEWS2 5/i)).toBeInTheDocument();
  });

  it('creates and completes tasks from the task register', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: /tasks/i }));
    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    await user.type(screen.getByLabelText('Task description'), 'Confirm fictional transport');
    await user.type(screen.getByLabelText('Owner'), 'Leanne Mitchell');
    await user.type(screen.getByLabelText('Due time'), '14:00');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(screen.getByText('Confirm fictional transport')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark Confirm fictional transport Done' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Task marked Done/i);
  });

  it('mirrors completed tasks to the server-side simulation audit boundary', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        event: {
          product: 'SafeFlow',
          simulationOnly: true,
          source: 'local-audit-fixture',
          syntheticPatientRef: 'DCU-031',
          eventType: 'task.completed'
        }
      })
    });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: /tasks/i }));
    await user.click(screen.getByRole('button', { name: 'Mark Medical review Done' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Task marked Done/i);
    expect(await screen.findByText(/Server audit mirrored to local-audit-fixture/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/simulation/audit-events', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"eventType":"task.completed"')
    }));
    expect(fetch).toHaveBeenCalledWith('/api/simulation/audit-events', expect.objectContaining({
      body: expect.not.stringMatching(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i)
    }));
  });

  it('creates and closes a simulated escalation', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: /escalations/i }));
    expect(screen.getByRole('heading', { name: 'Escalations' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New escalation' }));
    await user.type(screen.getByLabelText('Escalation reason'), 'Fictional NEWS2 review needed');
    await user.click(screen.getByRole('button', { name: 'Create simulated escalation' }));

    expect(screen.getByText('Fictional NEWS2 review needed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close Fictional NEWS2 review needed' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Escalation Closed/i);
  });

  it('saves handover progress and clears discharge blockers', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Handover' }));
    const completion = screen.getByLabelText('Handover completion');
    await user.clear(completion);
    await user.type(completion, '100');
    await user.click(screen.getByRole('button', { name: 'Save handover' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Handover saved/i);

    await user.click(screen.getByRole('button', { name: 'Discharges' }));
    await user.click(screen.getByRole('checkbox', { name: 'Medical plan unclear' }));
    await user.click(screen.getByRole('checkbox', { name: 'Electrolyte review outstanding' }));
    await user.click(screen.getByRole('button', { name: 'Save discharge readiness' }));
    expect(screen.getByText(/Ready for simulated discharge/i)).toBeInTheDocument();
  });

  it('opens report, audit and settings workspaces and resets safely', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: 'Reports' }));
    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByText(/fictional identifiers only/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export ward board CSV' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: 'Audit Trail' }));
    expect(screen.getByRole('searchbox', { name: /search audit/i })).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset simulation' }));
    expect(screen.getByRole('dialog', { name: 'Reset simulation' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Simulation reset/i);
  });

  it('checks the backend workspace source from settings', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        source: 'postgresql-simulation-read-model',
        simulationOnly: true,
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        workspace: {
          summary: {
            patientCount: 5,
            openTaskCount: 4,
            activeEscalationCount: 2
          }
        }
      })
    }));
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Check backend workspace' }));

    expect(await screen.findByText(/postgresql-simulation-read-model/i)).toBeInTheDocument();
    expect(screen.getByText(/5 fictional patients/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Backend workspace check complete/i);
  });

  it('checks simulation build readiness from settings', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        providers: {
          draft: 'deterministic',
          workspace: 'local-fictional-fixture',
          audit: 'local-audit-fixture'
        },
        database: {
          configured: false,
          guardedBySimulationOnly: true
        },
        migrations: {
          approved: true,
          count: 2,
          simulationOnly: true
        }
      })
    }));
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Check build readiness' }));

    expect(await screen.findByText(/Migration approval current/i)).toBeInTheDocument();
    expect(screen.getByText('deterministic', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('local-audit-fixture', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Build readiness check complete/i);
  });

  it.each([
    ['Ward Safety Board', 'Ward Safety Board'],
    ['My Patients', 'My Patients'],
    ['Observations', 'Observations'],
    [/Tasks/, 'Tasks'],
    [/Escalations/, 'Escalations'],
    ['Handover', 'Handover and Discharge Readiness'],
    ['Discharges', 'Discharges'],
    ['Reports', 'Reports'],
    ['Audit Trail', 'Audit and Learning'],
    ['Settings', 'Settings']
  ])('opens %s as a distinct workspace', async (buttonName, heading) => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: buttonName }));

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('records simulated team contact without creating a telephone link', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Call team' }));
    expect(screen.getByRole('dialog', { name: /Record simulated team contact/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /call/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Record contact' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Simulated team contact recorded/i);
  });

  it('adds a task from the patient safety panel', async () => {
    const user = userEvent.setup();
    render(<App />);
    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });

    await user.click(within(panel).getByRole('tab', { name: /tasks/i }));
    await user.click(within(panel).getByRole('button', { name: 'Add task' }));
    await user.type(within(panel).getByLabelText('Patient task description'), 'Document fictional response');
    await user.type(within(panel).getByLabelText('Patient task due time'), '15:00');
    await user.click(within(panel).getByRole('button', { name: 'Save patient task' }));

    expect(within(panel).getByText('Document fictional response')).toBeInTheDocument();
  });
});
