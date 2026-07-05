import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDemoScenarioById } from '../data/demoScenarios.js';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { buildHeuristicCues } from '../domain/heuristicCueEngine.js';
import { evaluatePotassiumSafetyGap } from '../domain/safetyRules.js';
import { scanBoundaryAwareSafetyLanguage } from '../domain/safetyLanguage.js';
import { getHospitalInsightsSnapshot } from '../services/hospitalInsightsService.js';
import { getWardQualitySafetyReviewSnapshot } from '../services/wardQualitySafetyReviewService.js';
import { HospitalInsightsView } from './HospitalInsightsView.jsx';
import { PatientJourneyTwin } from './PatientJourneyTwin.jsx';
import { WardQualitySafetyReviewDrawer } from './WardQualitySafetyReviewDrawer.jsx';

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the Patient Journey Twin render strictly boundary-safe', () => {
    const { container } = render(<PatientJourneyTwin patient={patient} />);

    expect(screen.getByRole('heading', { name: /patient journey twin/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Patient Journey Twin render'
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
