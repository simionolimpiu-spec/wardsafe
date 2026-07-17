import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

describe('SafeFlow prototype', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ canvas: {} }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('renders a hospital insights button in the main header', () => {
    render(<App />);

    const header = screen.getByRole('heading', { name: 'SafeFlow' }).closest('header');
    expect(header).not.toBeNull();
    expect(within(header ?? document.body).getByRole('button', { name: /hospital insights/i })).toBeInTheDocument();
  });

  it('renders a review report button in the main header', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /review report/i })).toBeInTheDocument();
  });

  it('renders a presentation mode toggle in the main header', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /presentation mode/i })).toBeInTheDocument();
  });

  it('renders a ward context selector in the main header', () => {
    render(<App />);

    const wardSelector = screen.getByRole('combobox', { name: 'Ward' });
    const focusSelector = screen.getByRole('combobox', { name: 'Review focus' });
    expect(wardSelector).toBeInTheDocument();
    expect(focusSelector).toBeInTheDocument();
    expect(wardSelector).toHaveAccessibleDescription(/current day care treatment pathway with documentation and review cues for the same fictional ward\./i);
    expect(focusSelector).toHaveAccessibleDescription(/current day care treatment pathway with documentation and review cues for the same fictional ward\./i);
    expect(within(wardSelector).getByRole('option', { name: 'Day Care' })).toBeInTheDocument();
    expect(within(wardSelector).getByRole('option', { name: 'Surgical' })).toBeInTheDocument();
    expect(within(wardSelector).getByRole('option', { name: 'Paediatrics' })).toBeInTheDocument();
    expect(within(wardSelector).getByRole('option', { name: 'Community Frailty' })).toBeInTheDocument();
    expect(within(focusSelector).getByRole('option', { name: 'Documentation' })).toBeInTheDocument();
    expect(within(focusSelector).getByRole('option', { name: 'Observation trend' })).toBeInTheDocument();
  });

  it('enables and disables presentation mode with simulation-only flow cues', async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByRole('button', { name: /presentation mode/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    const banner = screen.getByRole('region', { name: /presentation mode/i });
    expect(within(banner).getByRole('heading', { name: /simulation-only safeFlow demo/i })).toBeInTheDocument();
    expect(
      within(banner).getByText(
        /^Simulation-only\. Human review required\. Designed for NHS leadership, ward managers, clinical educators, and digital safety leads\.$/i
      )
    ).toBeInTheDocument();
    expect(within(banner).getByText(/selected scenario:/i)).toBeInTheDocument();
    expect(within(banner).getByRole('list', { name: /presentation flow/i })).toBeInTheDocument();
    expect(within(banner).getByText(/^Review cues$/i)).toBeInTheDocument();
    expect(within(banner).getByText(/^Ward Quality & Safety Review export$/i)).toBeInTheDocument();
    expect(within(banner).getByText(/^Competency Passport$/i)).toBeInTheDocument();
    expect(within(banner).getByText(/^Hospital Insights$/)).toBeInTheDocument();
    expect(
      within(banner).getByText(
        /^Guided path: review cues → Ward Quality & Safety Review export → Competency Passport → Hospital Insights\.$/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /simulation safety boundary/i })).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(within(banner).getByRole('button', { name: /exit presentation mode/i })).toBeInTheDocument();

    await user.click(within(banner).getByRole('button', { name: /exit presentation mode/i }));

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('region', { name: /presentation mode/i })).not.toBeInTheDocument();
  });

  it('advances and retreats through the guided presentation views', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /presentation mode/i }));
    const next = () => within(screen.getByRole('region', { name: /presentation mode/i })).getByRole('button', { name: /next/i });
    const previous = () => within(screen.getByRole('region', { name: /presentation mode/i })).getByRole('button', { name: /previous/i });

    expect(screen.getByRole('region', { name: /ward safety board/i })).toBeInTheDocument();
    await user.click(next());
    expect(screen.getByRole('dialog', { name: /ward quality & safety review/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /reports/i })).toBeInTheDocument();

    await user.click(next());
    expect(screen.getByRole('heading', { name: /portable competency passport/i })).toBeInTheDocument();
    await user.click(next());
    expect(screen.getByRole('heading', { name: /hospital insights/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /simulation safety boundary/i })).toBeInTheDocument();
    expect(next()).toBeDisabled();

    await user.click(previous());
    expect(screen.getByRole('heading', { name: /portable competency passport/i })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /presentation mode/i })).getByText(/^Step 3 of 4$/i)).toBeInTheDocument();
  });

  it('opens and closes the hospital insights drawer with comparison cues', async () => {
    const user = userEvent.setup();
    render(<App />);

    const header = screen.getByRole('heading', { name: 'SafeFlow' }).closest('header');
    expect(header).not.toBeNull();
    await user.click(within(header ?? document.body).getByRole('button', { name: /hospital insights/i }));

    const drawer = screen.getByRole('dialog', { name: /hospital insights/i });
    expect(within(drawer).getByText(/^Simulation insight$/i)).toBeInTheDocument();
    expect(
      within(drawer).getByText(
        /^Simulation comparison cues for ward-level review\. This prototype uses mock data only and is not connected to live NHS systems\.$/i
      )
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText(/^Patient view -> review cues -> ward comparison -> hospital insights -> future NHS\/AWS integration$/i)
    ).toBeInTheDocument();
    expect(within(drawer).getByText(/Hospital benchmark: Cityview Community Hospital/i)).toBeInTheDocument();
    expect(within(drawer).getByRole('note', { name: /simulation data source status/i })).toHaveTextContent(/Simulation source/i);
    expect(within(drawer).getByRole('note', { name: /simulation data source status/i })).toHaveTextContent(/Static prototype data/i);
    expect(within(drawer).getByRole('note', { name: /simulation data source status/i })).toHaveTextContent(/Live systems: not connected/i);
    expect(within(drawer).getByRole('note', { name: /simulation data source status/i })).toHaveTextContent(/Patient data: not present/i);
    expect(within(drawer).getByRole('img', { name: /ward versus hospital comparison chart/i })).toBeInTheDocument();
    expect(within(drawer).getByRole('table', { name: /ward comparison/i })).toBeInTheDocument();
    expect(within(drawer).getByText(/Documentation completeness/i, { selector: 'th span' })).toBeInTheDocument();
    expect(
      within(drawer).getByText(/^Simulation only\. Fictional ward benchmark data\. Human review required\.$/i)
    ).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: /close insights/i }));

    expect(screen.queryByRole('dialog', { name: /hospital insights/i })).not.toBeInTheDocument();
  });

  it('opens and closes the simulation review report with patient and ward comparison cues', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /review report/i }));

    const report = screen.getByRole('dialog', { name: /safeFlow simulation review report/i });
    expect(within(report).getByText(/^SafeFlow Simulation Review Report$/i)).toBeInTheDocument();
    expect(
      within(report).getByText(
        /^Simulation data only\. This report is not connected to live NHS systems and must not be used for patient care\.$/i
      )
    ).toBeInTheDocument();
    expect(
      within(report).getByText(
        /^No real NHS data is used\. No live NHS systems are connected\. No patient-identifiable information is used\.$/i
      )
    ).toBeInTheDocument();
    expect(
      within(report).getByText(
        /^Patient view -> review cues -> ward comparison -> hospital insights -> learning summary$/i
      )
    ).toBeInTheDocument();
    expect(within(report).getByText(/Patient review snapshot/i)).toBeInTheDocument();
    expect(within(report).getByRole('heading', { name: /Active review cues/i })).toBeInTheDocument();
    expect(within(report).getByRole('heading', { name: /Ward comparison snapshot/i })).toBeInTheDocument();
    expect(within(report).getAllByText(/human review required/i).length).toBeGreaterThan(0);
    expect(
      within(report).getByText(/^Comparison summary for education, quality improvement, and human-led review\.$/i)
    ).toBeInTheDocument();
    expect(within(report).getByRole('button', { name: /copy report/i })).toBeInTheDocument();
    expect(within(report).getByRole('button', { name: /print report/i })).toBeInTheDocument();
    expect(report.textContent).not.toMatch(/automated escalation|diagnos|treatment advice|risk prediction/i);

    await user.click(within(report).getByRole('button', { name: /close report/i }));

    expect(screen.queryByRole('dialog', { name: /safeFlow simulation review report/i })).not.toBeInTheDocument();
  });

  it('traps focus inside the simulation review report and restores it on Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole('button', { name: /review report/i });
    await user.click(trigger);

    const report = screen.getByRole('dialog', { name: /safeFlow simulation review report/i });
    const closeButton = within(report).getByRole('button', { name: /close report/i });
    const copyButton = within(report).getByRole('button', { name: /copy report/i });
    const printButton = within(report).getByRole('button', { name: /print report/i });

    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(copyButton).toHaveFocus();

    await user.tab();
    expect(printButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: /safeFlow simulation review report/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('copies and prints the simulation review report export', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<App />);

    await user.click(screen.getByRole('button', { name: /review report/i }));

    const report = screen.getByRole('dialog', { name: /safeFlow simulation review report/i });
    await user.click(within(report).getByRole('button', { name: /copy report/i }));
    await user.click(within(report).getByRole('button', { name: /print report/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('SafeFlow Simulation Review Report');
    expect(writeText.mock.calls[0][0]).toContain('Simulation data only. Not connected to live NHS systems. Not for patient care.');
    expect(writeText.mock.calls[0][0]).toContain('Day Care treatment pathway review');
    expect(writeText.mock.calls[0][0]).toContain('All review cues and comparison signals require human review.');
    expect(writeText.mock.calls[0][0]).toContain('Ward comparison / Hospital Insights summary');
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('opens and closes the ward quality and safety review from the main header', async () => {
    const user = userEvent.setup();
    render(<App />);

    const header = screen.getByRole('heading', { name: 'SafeFlow' }).closest('header');
    expect(header).not.toBeNull();
    await user.click(within(header ?? document.body).getByRole('button', { name: /ward quality & safety review/i }));

    const report = screen.getByRole('dialog', { name: /ward quality & safety review/i });
    expect(within(report).getByText(/^Ward Quality & Safety Review$/i)).toBeInTheDocument();
    expect(within(report).getByRole('heading', { name: /Heuristic cue engine flags/i })).toBeInTheDocument();
    expect(within(report).getByRole('heading', { name: /Competency Passport verified-learning evidence/i })).toBeInTheDocument();

    await user.click(within(report).getByRole('button', { name: /close report/i }));

    expect(screen.queryByRole('dialog', { name: /ward quality & safety review/i })).not.toBeInTheDocument();
  });

  it('opens the ward quality and safety review from the Reports surface', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });
    await user.click(within(nav).getByRole('button', { name: 'Reports' }));

    const reportsView = screen.getByRole('region', { name: /reports/i });
    expect(within(reportsView).getByRole('button', { name: /ward quality & safety review/i })).toBeInTheDocument();

    await user.click(within(reportsView).getByRole('button', { name: /ward quality & safety review/i }));

    const report = screen.getByRole('dialog', { name: /ward quality & safety review/i });
    expect(within(report).getByText(/^Ward Quality & Safety Review$/i)).toBeInTheDocument();

    await user.click(within(report).getByRole('button', { name: /close report/i }));
  });

  it('switches demo scenarios and updates the selected patient and report context', async () => {
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
            suggestions: []
          })
        });
      }

      if (typeof input === 'string' && input.startsWith('/api/simulation/signals?patientId=DCU-044')) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            product: 'SafeFlow',
            simulationOnly: true,
            signals: [
              {
                signalId: 'signal-dcu-044-discharge-1130',
                syntheticPatientRef: 'DCU-044',
                simulationOnly: true
              }
            ]
          })
        });
      }

      if (typeof input === 'string' && input.startsWith('/api/simulation/risk-suggestions?patientId=DCU-044')) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            product: 'SafeFlow',
            simulationOnly: true,
            suggestions: []
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

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ward' }), 'ward-acute-medical-alpha');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Review focus' }), 'legacy-amu-discharge-readiness-review');

    expect(await screen.findByRole('heading', { name: 'DCU-044' })).toBeInTheDocument();
    expect(screen.getAllByText(/Acute Medical Unit/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /review report/i }));

    const report = screen.getByRole('dialog', { name: /safeFlow simulation review report/i });
    expect(within(report).getByText(/DCU-044/i)).toBeInTheDocument();
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

  it('shows the electrolyte risk flag only for the correlated fictional patient', async () => {
    const user = userEvent.setup();
    render(<App />);

    const wardList = screen.getByRole('table', { name: /ward patient list/i });
    const patient031Row = within(wardList).getByRole('button', { name: /open Patient 031 \(DCU-031\)/i }).closest('tr');
    const patient028Row = within(wardList).getByRole('button', { name: /open Patient 028 \(DCU-028\)/i }).closest('tr');

    expect(patient031Row).not.toBeNull();
    expect(patient028Row).not.toBeNull();
    expect(within(patient031Row ?? wardList).getByText(/^Electrolyte \/ AKI safety gap$/i)).toBeInTheDocument();
    expect(within(patient028Row ?? wardList).queryByText(/^Electrolyte \/ AKI safety gap$/i)).not.toBeInTheDocument();

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    const overview = within(panel).getByRole('tabpanel', { name: /safety overview/i });
    expect(within(overview).getByText(/^Electrolyte \/ AKI safety gap$/i)).toHaveClass('risk');
    expect(within(overview).getByRole('region', { name: /potassium electrolyte safety gap/i })).toBeInTheDocument();

    await user.click(within(wardList).getByRole('button', { name: /open Patient 028 \(DCU-028\)/i }));

    const updatedPanel = screen.getByRole('complementary', { name: /patient safety panel/i });
    expect(within(updatedPanel).queryByText(/^Electrolyte \/ AKI safety gap$/i)).not.toBeInTheDocument();
    expect(within(updatedPanel).queryByRole('region', { name: /potassium electrolyte safety gap/i })).not.toBeInTheDocument();
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

    await user.click(within(screen.getByRole('navigation', { name: /SafeFlow workspace/i })).getByRole('button', { name: 'Handover', exact: true }));

    const handoverReadinessRegion = screen.getByRole('region', { name: /handover and discharge readiness/i });

    expect(handoverReadinessRegion).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/Handover 50% complete/i)).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/^Medical plan unclear$/i)).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/Simulation risk support/i)).toBeInTheDocument();
    expect(within(handoverReadinessRegion).getByText(/not clinically validated and not for clinical decision-making/i)).toBeInTheDocument();
    const riskSupportSignals = within(handoverReadinessRegion).getByRole('list', { name: /risk-support signals/i });
    expect(riskSupportSignals).toBeInTheDocument();
    expect(within(riskSupportSignals).getByText(/Discharge readiness blockers/i)).toBeInTheDocument();
  });

  it('explains the potassium safety gap and records edited SBAR draft activity', async () => {
    const user = userEvent.setup();
    render(<App />);

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });

    expect(within(panel).getByRole('region', { name: /potassium electrolyte safety gap/i })).toBeInTheDocument();
    expect(within(panel).getByText(/Potassium has fallen from 3.8 to 3.2 mmol\/L/i, { selector: 'li' })).toBeInTheDocument();
    expect(within(panel).getByText(/Magnesium result not visible/i, { selector: 'li' })).toBeInTheDocument();
    expect(within(panel).getByText(/does not prescribe/i)).toBeInTheDocument();

    const draft = within(panel).getByLabelText(/editable SBAR draft/i);
    fireEvent.change(draft, { target: { value: 'Edited safe escalation note.' } });
    await user.click(within(panel).getByRole('button', { name: /save SBAR draft/i }));

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

    const panel = screen.getByRole('complementary', { name: /patient safety panel/i });
    await user.click(within(panel).getByRole('button', { name: /generate draft/i }));

    expect(within(panel).getByLabelText(/editable SBAR draft/i).value).toContain('RECOMMENDATION: API recommendation');
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
            source: 'private-lambda-signals-placeholder',
            provider: 'placeholder',
            mode: 'simulation',
            simulationOnly: true,
            clinicalUse: false,
            validationStatus: 'not-clinically-validated',
            explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.',
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
            source: 'private-lambda-risk-suggestions-placeholder',
            provider: 'placeholder',
            mode: 'simulation',
            simulationOnly: true,
            clinicalUse: false,
            validationStatus: 'not-clinically-validated',
            explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.',
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
    expect(reviewCues.textContent).toMatch(/Signals: private-lambda-signals-placeholder/i);
    expect(reviewCues.textContent).toMatch(/Risk suggestions: private-lambda-risk-suggestions-placeholder/i);
    expect(reviewCues.textContent).toMatch(/not clinically validated and not for clinical decision-making/i);
    expect(reviewCues.textContent).toMatch(/human review required/i);
    expect(reviewCues.textContent).not.toMatch(/replace potassium|potassium replacement|diagnos|prescrib|administer|AI decided|autonomous decision/i);
  });

  it('shows a discovery scenario library with initial hazard controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    const productNav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });
    await user.click(within(productNav).getByRole('button', { name: /scenarios/i }));

    const scenarioRegion = screen.getByRole('region', { name: /discovery scenario library/i });
    expect(scenarioRegion).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Electrolyte \/ AKI documentation gap/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Sepsis escalation handover/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Discharge readiness blocker/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Surgical post-op deterioration review/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Paediatric sepsis-screen review/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Community frailty falls-risk review/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Community medication-timing review/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/Initial hazard controls/i)).toBeInTheDocument();
    expect(within(scenarioRegion).getByText(/No live patient data/i)).toBeInTheDocument();

    const scenarioText = scenarioRegion.textContent;
    expect(scenarioText).not.toMatch(/administer potassium|give potassium|replace potassium|prescribe potassium|diagnose this patient/i);
    expect(screen.queryByText(/^NHS$/)).not.toBeInTheDocument();
  });

  it('keeps the sidebar as the sole primary workspace navigation', () => {
    render(<App />);

    const workspace = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    expect(within(workspace).getByRole('button', { name: /ward safety board/i })).toBeInTheDocument();
    expect(within(workspace).getByRole('button', { name: /^handover/i })).toBeInTheDocument();
    expect(within(workspace).getByRole('button', { name: /patient journey twin/i })).toBeInTheDocument();
    expect(within(workspace).getByRole('button', { name: /audit trail/i })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /prototype journey/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /ward board/i })).not.toBeInTheDocument();
  });

  it('shows audit and learning timeline from simulated workflow events', async () => {
    const user = userEvent.setup();
    render(<App />);

    const workspace = screen.getByRole('navigation', { name: /SafeFlow workspace/i });
    await user.click(within(workspace).getByRole('button', { name: /audit trail/i }));

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
    expect(screen.getByText(/^Task marked Done$/i)).toBeInTheDocument();
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

    expect(screen.getByText(/Task marked Done/i)).toBeInTheDocument();
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
    expect(await screen.findByRole('dialog', { name: 'Reset simulation' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Simulation reset/i);
  });

  it('restores focus when the reset dialog is dismissed with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /SafeFlow workspace/i });

    await user.click(within(nav).getByRole('button', { name: 'Settings' }));
    const resetButton = screen.getByRole('button', { name: 'Reset simulation' });
    await user.click(resetButton);

    const dialog = await screen.findByRole('dialog', { name: 'Reset simulation' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Reset simulation' })).not.toBeInTheDocument();
    expect(resetButton).toHaveFocus();
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
        mode: 'simulation',
        simulationOnly: true,
        clinicalUse: false,
        validationStatus: 'not-clinically-validated',
        explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.',
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        providers: {
          draft: 'deterministic',
          workspace: 'local-fictional-fixture',
          audit: 'local-audit-fixture',
          signals: 'private-lambda-signals-placeholder',
          suggestions: 'private-lambda-risk-suggestions-placeholder'
        },
        providerMetadata: {
          signals: { providerId: 'private-lambda-signals-placeholder', provider: 'placeholder' },
          suggestions: { providerId: 'private-lambda-risk-suggestions-placeholder', provider: 'placeholder' }
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
    expect(screen.getByText(/private-lambda-signals-placeholder \(placeholder preview provider\)/i)).toBeInTheDocument();
    expect(screen.getByText(/private-lambda-risk-suggestions-placeholder \(placeholder preview provider\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/not clinically validated and not for clinical decision-making/i).length).toBeGreaterThan(0);
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
    ['Scenarios', 'Discovery Scenario Library'],
    ['Competency Passport', 'Portable Competency Passport'],
    ['Learning Hub', 'Learning Hub'],
    ['Hospital insights', 'Hospital insights'],
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
    expect(await screen.findByRole('dialog', { name: /Record simulated team contact/i })).toBeInTheDocument();
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
