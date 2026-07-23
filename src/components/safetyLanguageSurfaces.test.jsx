import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDemoScenarioById } from '../data/demoScenarios.js';
import { simulatedPatients, wardSummary } from '../data/simulatedPatients.js';
import { buildHeuristicCues } from '../domain/heuristicCueEngine.js';
import { evaluatePotassiumSafetyGap } from '../domain/safetyRules.js';
import { scanBoundaryAwareSafetyLanguage, scanStrictSafetyLanguage } from '../domain/safetyLanguage.js';
import { getHospitalInsightsSnapshot } from '../services/hospitalInsightsService.js';
import { getWardQualitySafetyReviewSnapshot } from '../services/wardQualitySafetyReviewService.js';
import { HospitalInsightsView } from './HospitalInsightsView.jsx';
import { TrustNetworkView } from './TrustNetworkView.jsx';
import { PatientJourneyTwin } from './PatientJourneyTwin.jsx';
import { ReportsView } from './ReportsView.jsx';
import { WardSafetyBoard } from './WardSafetyBoard.jsx';
import { WardQualitySafetyReviewDrawer } from './WardQualitySafetyReviewDrawer.jsx';
import { AppShell } from './AppShell.jsx';
import { ScenarioLibraryView } from './ScenarioLibraryView.jsx';
import { getDemoScenarioOptions } from '../data/demoScenarios.js';

const chartMocks = vi.hoisted(() => {
  const instances = [];
  const Chart = vi.fn().mockImplementation(function ChartMock(context, config) {
    this.context = context;
    this.config = config;
    this.destroy = vi.fn();
    instances.push(this);
  });

  return { Chart, instances };
});

vi.mock('chart.js/auto', () => ({
  default: chartMocks.Chart
}));

describe('safety language surface scans', () => {
  const patient = simulatedPatients.find((entry) => entry.id === 'DCU-031');

  beforeEach(() => {
    chartMocks.instances.length = 0;
    chartMocks.Chart.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ canvas: {} }));
  });

  it('keeps the redesigned application shell boundary-safe on the board view', () => {
    const { container } = render(
      <AppShell
        currentWardName="Day Care Unit"
        dateLabel="Wednesday 17 June 2026"
        onScenarioChange={() => {}}
        scenarioOptions={getDemoScenarioOptions()}
        selectedScenarioId="day-care-treatment-pathway"
      >
        <section aria-label="Shell content"><h2>Ward Safety Board</h2></section>
      </AppShell>
    );

    expect(screen.getByRole('heading', { name: 'SafeFlow' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /simulation safety boundary/i })).toBeInTheDocument();
    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'AppShell render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Scenario Library staffing context panel boundary-safe', () => {
    const { container } = render(<ScenarioLibraryView />);
    const panel = screen.getByRole('complementary', { name: /staffing and skill-mix context/i });

    expect(within(panel).getByRole('heading', { name: /staffing & skill-mix context/i })).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(4);
    expect(within(panel).getByText(/Aiken et al\. 2016/i)).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library staffing context render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Scenario Library bias-awareness panel boundary-safe', () => {
    const { container } = render(<ScenarioLibraryView />);
    const panel = screen.getByRole('complementary', { name: /notice your thinking/i });

    expect(within(panel).getByRole('heading', { name: /notice your thinking/i })).toBeInTheDocument();
    expect(within(panel).getByText(/optional reflective teaching prompt/i)).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(5);
    expect(within(panel).getByText(/Croskerry/i)).toBeInTheDocument();
    expect(within(panel).getByText(/does not score the scenario/i)).toBeInTheDocument();

    const strictResult = scanStrictSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library bias-awareness render'
    });

    expect(strictResult).toMatchObject({
      passed: true,
      violations: []
    });

    const result = scanBoundaryAwareSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library bias-awareness render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Scenario Library PEARLS debrief panel strictly boundary-safe', () => {
    render(<ScenarioLibraryView />);
    const panel = screen.getByRole('complementary', { name: /structured debrief \(pearls\)/i });

    expect(within(panel).getByRole('heading', { name: /structured debrief \(pearls\)/i })).toBeInTheDocument();
    expect(within(panel).getByText(/facilitated simulation debrief/i)).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(4);
    expect(within(panel).getByText(/Rudolph/i)).toBeInTheDocument();
    expect(within(panel).getByText(/not a data-capture form, scoring mechanism, or clinical tool/i)).toBeInTheDocument();

    const strictResult = scanStrictSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library PEARLS debrief render'
    });

    expect(strictResult).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Scenario Library PACE ladder panel strictly boundary-safe', () => {
    render(<ScenarioLibraryView />);
    const panel = screen.getByRole('complementary', { name: /speaking up: the pace ladder/i });

    expect(within(panel).getByRole('heading', { name: /speaking up: the pace ladder/i })).toBeInTheDocument();
    expect(within(panel).getByText(/optional communication reference/i)).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(4);
    expect(within(panel).getByText(/Bromiley/i)).toBeInTheDocument();
    expect(within(panel).getByText(/not a clinical checklist, scoring mechanism, or instruction to act/i)).toBeInTheDocument();

    const strictResult = scanStrictSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library PACE ladder render'
    });

    expect(strictResult).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Scenario Library Safety-II reflection panel strictly boundary-safe', () => {
    render(<ScenarioLibraryView />);
    const panel = screen.getByRole('complementary', { name: /what went well \(safety-ii\)/i });

    expect(within(panel).getByRole('heading', { name: /what went well \(safety-ii\)/i })).toBeInTheDocument();
    expect(within(panel).getByText(/optional reflective teaching prompt/i)).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(4);
    expect(within(panel).getByText(/Hollnagel/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Learning from Excellence/i)).toBeInTheDocument();
    expect(within(panel).getByText(/does not replace attention to hazards/i)).toBeInTheDocument();
    expect(within(panel).getByText(/not a data-capture form, scoring mechanism, or clinical tool/i)).toBeInTheDocument();

    const strictResult = scanStrictSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library Safety-II reflection render'
    });

    expect(strictResult).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the scoring systems comparison panel boundary-safe', () => {
    const { container } = render(<ScenarioLibraryView />);
    const panel = screen.getByRole('region', { name: /scoring systems comparison \(simulation\)/i });

    expect(within(panel).getByRole('combobox', { name: /fictional observation snapshot/i })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: /scoring systems comparison/i })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: /NEWS2 - England convention/i })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: /MEWS-style variant/i })).toBeInTheDocument();
    expect(within(panel).getByText(/Simulation only - fictional observations - human review required/i)).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(panel.textContent ?? '', {
      checkedLabel: 'Scenario Library scoring systems comparison render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the Patient Journey Twin render strictly boundary-safe', () => {
    const { container } = render(<PatientJourneyTwin patient={patient} />);

    expect(screen.getByRole('heading', { name: /patient journey twin/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /journey day scrubber/i })).toHaveAttribute(
      'aria-valuetext',
      'Day 1300 of 1300'
    );
    expect(screen.getByRole('table', { name: /then versus now observations/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /trend across day 1 to day 1300/i })).toHaveLength(6);

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Patient Journey Twin render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Two-Trust Network view render strictly boundary-safe', () => {
    const { container } = render(<TrustNetworkView />);

    expect(screen.getByRole('heading', { name: /england trust network/i })).toBeInTheDocument();
    expect(screen.getAllByText('Ward trend (simulation)').length).toBeGreaterThan(50);
    expect(screen.getAllByText(/human review required; review-support cue only/i).length).toBeGreaterThan(50);

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Two-Trust Network render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Hospital Insights view render strictly boundary-safe', () => {
    const { container } = render(
      <HospitalInsightsView
        currentWardName="Day Care Unit"
        hospitalName="Cityview Community Hospital"
        patient={patient}
      />
    );

    const view = screen.getByRole('region', { name: /hospital insights/i });

    expect(within(view).getByRole('img', { name: /patient journey twin simulated trend line chart/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Hospital Insights view render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
    expect(chartMocks.Chart).toHaveBeenCalledTimes(2);
  });

  it('keeps the Ward Quality & Safety Review render strictly boundary-safe', () => {
    const { container } = render(<WardQualitySafetyReviewDrawer isOpen onClose={() => {}} snapshot={buildSnapshot()} />);

    expect(screen.getByRole('dialog', { name: /ward quality & safety review/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Ward Quality & Safety Review render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the ReportsView render strictly boundary-safe', () => {
    const { container } = render(
      <ReportsView
        auditEvents={[]}
        onExportWard={() => {}}
        onOpenWardQualitySafetyReview={() => {}}
        patients={simulatedPatients}
      />
    );

    const view = screen.getByRole('region', { name: /reports/i });

    expect(within(view).getByRole('button', { name: /export ward board csv/i })).toBeInTheDocument();
    expect(within(view).getByRole('button', { name: /ward quality & safety review/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'ReportsView render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Ward Safety Board render strictly boundary-safe', () => {
    const { container } = render(
      <WardSafetyBoard
        onExport={() => {}}
        onSelectPatient={() => {}}
        patients={simulatedPatients}
        selectedPatientId={simulatedPatients[0].id}
        summary={wardSummary}
      />
    );

    const view = screen.getByRole('region', { name: /ward safety board/i });

    expect(within(view).getByRole('table', { name: /ward patient list/i })).toBeInTheDocument();
    expect(within(view).getByRole('columnheader', { name: 'Fictional label' })).toBeInTheDocument();
    expect(within(view).getByRole('columnheader', { name: 'Escalation status' })).toBeInTheDocument();
    expect(within(view).getByRole('button', { name: /export ward board csv/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'WardSafetyBoard render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });
});

function buildSnapshot() {
  const scenario = getDemoScenarioById('day-care-treatment-pathway');
  const patient = scenario.patients.find((entry) => entry.id === scenario.selectedPatientId);
  const safetyFlag = evaluatePotassiumSafetyGap(patient);
  const reviewSignals = buildReviewSignals();
  const heuristicCues = buildHeuristicCues({ signals: reviewSignals, flag: safetyFlag });
  const hospitalInsights = getHospitalInsightsSnapshot({
    currentWardName: scenario.currentWardName,
    hospitalName: scenario.hospitalName
  });

  return getWardQualitySafetyReviewSnapshot({
    patient,
    reviewSignals,
    heuristicCues,
    safetyFlag,
    hospitalInsights,
    selectedScenario: scenario
  });
}

function buildReviewSignals() {
  return [
    {
      id: 'signal-documentation-1',
      category: 'documentation',
      priority: 'review',
      title: 'Documentation gap',
      explanation: 'Documentation gap visible in the simulation record.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-documentation-2',
      category: 'documentation',
      priority: 'review',
      title: 'Documentation gap follow-up',
      explanation: 'A second documentation gap remains visible.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-handover-1',
      category: 'handover',
      priority: 'watch',
      title: 'Handover completeness issue',
      explanation: 'Handover completeness issue remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-escalation-1',
      category: 'escalation',
      priority: 'blocker',
      title: 'Escalation readiness cue',
      explanation: 'Escalation readiness cue remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-discharge-1',
      category: 'discharge',
      priority: 'blocker',
      title: 'Discharge-readiness blocker',
      explanation: 'Discharge-readiness blocker remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-deteriorating-obs-1',
      category: 'deteriorating-obs',
      priority: 'blocker',
      title: 'Deteriorating observations cue',
      explanation: 'Deteriorating observations cue remains visible.',
      simulationOnly: true,
      humanReviewRequired: true
    }
  ];
}
