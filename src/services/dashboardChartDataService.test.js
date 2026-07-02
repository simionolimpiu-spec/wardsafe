import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { scoreSimulatedTrend } from '../domain/patientJourneyTrendModel.js';
import { buildSimulationSignals } from '../domain/signalEngine.js';
import { getHospitalInsightsSnapshot } from './hospitalInsightsService.js';
import {
  buildOpenReviewCueBreakdown,
  buildSimulatedRiskTrendChartData,
  buildWardComparisonChartData
} from './dashboardChartDataService.js';

const patient = simulatedPatients.find((item) => item.id === 'DCU-031');

const timelineSignals = [
  {
    signalId: 'signal-dcu-031-plan-gap-0920',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-workflow',
    sourceType: 'workflow',
    signalCode: 'electrolyte_plan_gap',
    displayName: 'Electrolyte monitoring plan',
    value: 'unclear',
    status: 'final',
    effectiveAt: '2026-06-10T09:20:00.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-news2-0915',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-observations',
    sourceType: 'observation',
    signalCode: 'NEWS2',
    displayName: 'NEWS2',
    value: '7',
    status: 'final',
    effectiveAt: '2026-06-10T09:15:00.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-magnesium-missing-0910',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'magnesium',
    displayName: 'Magnesium',
    value: null,
    status: 'missing',
    effectiveAt: '2026-06-10T09:10:30.000Z',
    sourceFreshness: 'current',
    simulationOnly: true
  },
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
];

const suggestions = [
  {
    suggestionId: 'suggestion-dcu-031-electrolyte-review',
    syntheticPatientRef: 'DCU-031',
    riskType: 'missed_action',
    riskTier: 'urgent',
    title: 'Electrolyte result review may be needed',
    suggestedFlag: 'Electrolyte result review may be needed',
    suggestedBlocker: 'Unresolved abnormal blood result',
    suggestedTask: 'Review blood trend and document action',
    evidence: [
      { signalCode: 'potassium', label: 'Potassium 3.1 mmol/L final at 09:10' },
      { signalCode: 'magnesium', label: 'Magnesium result not visible' },
      { signalCode: 'NEWS2', label: 'NEWS2 7 at 09:15' }
    ],
    missingData: ['Magnesium result not visible'],
    requiresHumanReview: true,
    simulationOnly: true,
    createdAt: '2026-06-10T09:12:00.000Z',
    updatedAt: '2026-06-10T09:12:00.000Z'
  }
];

const highRiskFeatures = {
  syntheticPatientRef: 'DCU-HIGH-001',
  news2Normalized: 1,
  potassiumFallingFlag: 1,
  documentationQualityNorm: 0,
  handoverCompleteNorm: 0,
  openTaskLoadNorm: 1,
  escalationStateNorm: 1,
  dischargeBlockerNorm: 1
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-10T10:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

describe('dashboard chart data service', () => {
  it('builds grouped ward comparison series from the hospital insights snapshot', () => {
    const insights = getHospitalInsightsSnapshot();
    const original = clone(insights);

    const chartData = buildWardComparisonChartData(insights);

    expect(insights).toEqual(original);
    expect(chartData.title).toBe('Ward versus hospital average');
    expect(chartData.metricRows).toHaveLength(insights.comparisonRows.length);
    expect(chartData.seriesRows).toHaveLength(insights.comparisonRows.length * 2);
    expect(chartData.seriesRows[0]).toMatchObject({
      metricKey: 'documentationCompleteness',
      metricLabel: 'Documentation completeness',
      seriesKey: 'currentWard',
      seriesLabel: 'Current ward',
      value: insights.comparisonRows[0].currentValue,
      displayValue: insights.comparisonRows[0].currentLabel
    });
    expect(chartData.seriesRows[1]).toMatchObject({
      metricKey: 'documentationCompleteness',
      seriesKey: 'hospitalAverage',
      seriesLabel: 'Hospital average',
      value: insights.comparisonRows[0].hospitalAverage,
      displayValue: insights.comparisonRows[0].hospitalAverageLabel
    });
    expect(chartData.seriesLabels).toEqual([
      { key: 'currentWard', label: 'Current ward' },
      { key: 'hospitalAverage', label: 'Hospital average' }
    ]);
  });

  it('turns a scoreSimulatedTrend snapshot into a deterministic risk timeline', () => {
    const trendSuggestion = scoreSimulatedTrend(highRiskFeatures);

    const first = buildSimulatedRiskTrendChartData(trendSuggestion);
    const second = buildSimulatedRiskTrendChartData(trendSuggestion);

    expect(first).toEqual(second);
    expect(first.title).toContain('Simulated trend signal');
    expect(first.seriesLabel).toBe('Simulated risk score');
    expect(first.anchor).toMatchObject({
      suggestionId: trendSuggestion.suggestionId,
      timestamp: '2026-06-10T10:00:00.000Z',
      riskScore: trendSuggestion.riskScore,
      riskTier: trendSuggestion.riskTier,
      evidenceCount: trendSuggestion.evidence.length,
      missingDataCount: trendSuggestion.missingData.length
    });
    expect(first.points).toHaveLength(5);
    expect(first.points[4]).toMatchObject({
      timestamp: '2026-06-10T10:00:00.000Z',
      riskScore: trendSuggestion.riskScore,
      pointLabel: 'Current'
    });
    expect(first.points.map((point) => Date.parse(point.timestamp))).toEqual([
      Date.parse('2026-06-10T09:00:00.000Z'),
      Date.parse('2026-06-10T09:15:00.000Z'),
      Date.parse('2026-06-10T09:30:00.000Z'),
      Date.parse('2026-06-10T09:45:00.000Z'),
      Date.parse('2026-06-10T10:00:00.000Z')
    ]);
    expect(first.points.every((point) => point.riskScore >= 0 && point.riskScore <= 1)).toBe(true);
    expect(first.points[first.points.length - 1].riskTier).toBe(trendSuggestion.riskTier);
    expect(first.points[first.points.length - 1].riskScore).toBe(trendSuggestion.riskScore);
  });

  it('counts open review cues by category and tier while ignoring closed or non-simulation inputs', () => {
    const reviewSignals = buildSimulationSignals({
      patient: clone(patient),
      signals: clone(timelineSignals),
      suggestions: clone(suggestions)
    });
    const trendSuggestion = scoreSimulatedTrend(highRiskFeatures);

    const breakdown = buildOpenReviewCueBreakdown({
      signals: [
        ...reviewSignals,
        {
          id: 'signal-closed',
          category: 'documentation',
          priority: 'review',
          title: 'Closed signal',
          status: 'closed',
          humanReviewRequired: true,
          simulationOnly: true
        },
        {
          id: 'signal-live',
          category: 'documentation',
          priority: 'review',
          title: 'Live signal',
          status: 'open',
          humanReviewRequired: true,
          simulationOnly: false
        }
      ],
      suggestions: [
        trendSuggestion,
        {
          suggestionId: 'suggestion-closed',
          riskType: 'missed_action',
          riskTier: 'urgent',
          title: 'Closed suggestion',
          requiresHumanReview: true,
          simulationOnly: true,
          status: 'closed'
        },
        {
          suggestionId: 'suggestion-live',
          riskType: 'missed_action',
          riskTier: 'urgent',
          title: 'Live suggestion',
          requiresHumanReview: true,
          simulationOnly: false,
          status: 'suggested'
        }
      ]
    });

    expect(breakdown.totalOpenCues).toBe(reviewSignals.length + 1);
    expect(breakdown.sourceBreakdown).toEqual([
      { key: 'signal', label: 'Signal', count: reviewSignals.length, signalCount: reviewSignals.length, suggestionCount: 0 },
      { key: 'suggestion', label: 'Suggestion', count: 1, signalCount: 0, suggestionCount: 1 }
    ]);
    expect(breakdown.categoryBreakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'documentation', label: 'Documentation', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'electrolyte-review', label: 'Electrolyte review', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'infection-review', label: 'Infection review', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'escalation', label: 'Escalation', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'handover', label: 'Handover', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'discharge', label: 'Discharge', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'learning', label: 'Learning', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'simulated_trend', label: 'Simulated Trend', count: 1, signalCount: 0, suggestionCount: 1 })
    ]));
    expect(breakdown.tierBreakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'blocker', label: 'Blocker', count: 1, signalCount: 1, suggestionCount: 0 }),
      expect.objectContaining({ key: 'urgent', label: 'Urgent', count: 1, signalCount: 0, suggestionCount: 1 }),
      expect.objectContaining({ key: 'review', label: 'Review', count: 3, signalCount: 3, suggestionCount: 0 }),
      expect.objectContaining({ key: 'watch', label: 'Watch', count: 2, signalCount: 2, suggestionCount: 0 }),
      expect.objectContaining({ key: 'learning', label: 'Learning', count: 1, signalCount: 1, suggestionCount: 0 })
    ]));
  });
});
