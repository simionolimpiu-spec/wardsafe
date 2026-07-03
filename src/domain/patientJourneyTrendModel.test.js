import { describe, expect, it } from 'vitest';
import modelData from '../data/patientJourneyTrendModel.json';
import {
  buildSimulatedTrendFeatureSnapshot,
  scoreSimulatedTrend
} from './patientJourneyTrendModel.js';
import {
  FEATURE_ORDER,
  FEATURE_SET_VERSION,
  MODEL_VERSION,
  generateSyntheticDataset
} from '../../ml/generateSyntheticDataset.js';

const lowRiskFeatures = {
  syntheticPatientRef: 'DCU-LOW-001',
  news2Normalized: 0,
  potassiumFallingFlag: 0,
  documentationQualityNorm: 1,
  handoverCompleteNorm: 1,
  openTaskLoadNorm: 0,
  escalationStateNorm: 0,
  dischargeBlockerNorm: 0
};

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

const expectedKeys = [
  'actions',
  'createdAt',
  'evidence',
  'featureSetVersion',
  'missingData',
  'modelVersion',
  'requiresHumanReview',
  'riskScore',
  'riskTier',
  'riskType',
  'simulationOnly',
  'status',
  'suggestedFlag',
  'suggestedTask',
  'suggestionId',
  'syntheticPatientRef',
  'title',
  'updatedAt'
].sort();

function news2NormalizedForRiskScore(targetRiskScore) {
  const intercept = Number(modelData.intercept);
  const weight = Number(modelData.weights[0]);
  const logit = Math.log(targetRiskScore / (1 - targetRiskScore));

  return (logit - intercept) / weight;
}

describe('scoreSimulatedTrend', () => {
  it('returns the expected simulated trend suggestion contract shape', () => {
    const result = scoreSimulatedTrend(lowRiskFeatures);

    expect(Object.keys(result).sort()).toEqual(expectedKeys);
    expect(result).toMatchObject({
      suggestionId: 'simulated-trend-dcu-low-001',
      syntheticPatientRef: 'DCU-LOW-001',
      riskType: 'simulated_trend',
      riskTier: expect.stringMatching(/^(watch|review|urgent)$/),
      status: 'suggested',
      title: expect.stringMatching(/simulated/i),
      suggestedFlag: expect.stringMatching(/simulated/i),
      modelVersion: 'simulation-risk-ml-v0-2-sim',
      featureSetVersion: 'signal-features-ml-v0-2-sim',
      requiresHumanReview: true,
      simulationOnly: true,
      actions: []
    });
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(result.evidence.every((item) => typeof item.label === 'string' && item.label.trim().length > 0)).toBe(true);
    expect(Array.isArray(result.missingData)).toBe(true);
    expect(typeof result.createdAt).toBe('string');
    expect(typeof result.updatedAt).toBe('string');
    expect(result.title.toLowerCase()).toContain('simulated');
    expect(result.suggestedFlag.toLowerCase()).toContain('simulated');
  });

  it('keeps simulation invariants and records missing data when features are omitted', () => {
    const result = scoreSimulatedTrend({
      syntheticPatientRef: '',
      news2Normalized: undefined,
      potassiumFallingFlag: undefined,
      documentationQualityNorm: undefined,
      handoverCompleteNorm: undefined,
      openTaskLoadNorm: undefined,
      escalationStateNorm: undefined,
      dischargeBlockerNorm: undefined
    });

    expect(result).toMatchObject({
      syntheticPatientRef: 'unknown',
      riskType: 'simulated_trend',
      status: 'suggested',
      requiresHumanReview: true,
      simulationOnly: true
    });
    expect(result.riskTier).toMatch(/^(watch|review|urgent)$/);
    expect(result.missingData).toEqual(expect.arrayContaining([
      'news2Normalized missing or invalid; defaulted to 0.',
      'potassiumFallingFlag missing or invalid; defaulted to 0.',
      'documentationQualityNorm missing or invalid; defaulted to 0.',
      'handoverCompleteNorm missing or invalid; defaulted to 0.',
      'openTaskLoadNorm missing or invalid; defaulted to 0.',
      'escalationStateNorm missing or invalid; defaulted to 0.',
      'dischargeBlockerNorm missing or invalid; defaulted to 0.'
    ]));
  });

  it('classifies the watch, review and urgent bands at the model thresholds', () => {
    const watchBand = scoreSimulatedTrend({
      syntheticPatientRef: 'EDGE-WATCH',
      news2Normalized: news2NormalizedForRiskScore(0.399),
      potassiumFallingFlag: 0,
      documentationQualityNorm: 0,
      handoverCompleteNorm: 0,
      openTaskLoadNorm: 0,
      escalationStateNorm: 0,
      dischargeBlockerNorm: 0
    });
    const reviewBand = scoreSimulatedTrend({
      syntheticPatientRef: 'EDGE-REVIEW',
      news2Normalized: news2NormalizedForRiskScore(0.4),
      potassiumFallingFlag: 0,
      documentationQualityNorm: 0,
      handoverCompleteNorm: 0,
      openTaskLoadNorm: 0,
      escalationStateNorm: 0,
      dischargeBlockerNorm: 0
    });
    const urgentBand = scoreSimulatedTrend({
      syntheticPatientRef: 'EDGE-URGENT',
      news2Normalized: news2NormalizedForRiskScore(0.701),
      potassiumFallingFlag: 0,
      documentationQualityNorm: 0,
      handoverCompleteNorm: 0,
      openTaskLoadNorm: 0,
      escalationStateNorm: 0,
      dischargeBlockerNorm: 0
    });

    expect(watchBand.riskTier).toBe('watch');
    expect(watchBand.riskScore).toBeLessThan(0.4);
    expect(reviewBand.riskTier).toBe('review');
    expect(reviewBand.riskScore).toBeCloseTo(0.4, 3);
    expect(urgentBand.riskTier).toBe('urgent');
    expect(urgentBand.riskScore).toBeGreaterThan(0.7);
    expect([watchBand.riskTier, reviewBand.riskTier, urgentBand.riskTier]).toEqual([
      'watch',
      'review',
      'urgent'
    ]);
  });

  it('keeps scores bounded and separates low-risk and high-risk synthetic inputs', () => {
    const low = scoreSimulatedTrend(lowRiskFeatures);
    const high = scoreSimulatedTrend(highRiskFeatures);

    expect(low.riskScore).toBeGreaterThanOrEqual(0);
    expect(low.riskScore).toBeLessThanOrEqual(1);
    expect(high.riskScore).toBeGreaterThanOrEqual(0);
    expect(high.riskScore).toBeLessThanOrEqual(1);
    expect(low.riskTier).toMatch(/^(watch|review|urgent)$/);
    expect(high.riskTier).toMatch(/^(watch|review|urgent)$/);
    expect(low.riskScore).toBeLessThan(high.riskScore);
    expect(low.riskTier).not.toBe(high.riskTier);
  });

  it('derives richer simulation-only feature snapshots from flags, heuristic cues and observation deltas', () => {
    const featureSnapshot = buildSimulatedTrendFeatureSnapshot({
      patient: {
        id: 'DCU-RICH-001',
        news2: 7,
        riskFlags: ['Sepsis screen due', 'Falls assessment overdue'],
        plan: '',
        sbar: { recommendation: '' },
        currentState: ['Deteriorating observations cue visible'],
        auditTrail: ['Deteriorating observation review opened.'],
        responseHistory: [],
        handoverComplete: 40,
        escalation: 'Active',
        dischargeBlockers: ['Transport not booked'],
        tasks: [{ id: 'task-1', status: 'Due' }],
        observations: [{ news2: 3 }, { news2: 7 }],
        labs: {
          potassium: [{ value: 4.1 }, { value: 3.3 }]
        }
      },
      safetyFlag: { level: 'medium' },
      heuristicCues: [
        { ruleId: 'escalation-readiness-cue', severity: 'blocker' },
        { ruleId: 'handover-completeness-issue', severity: 'review' },
        { ruleId: 'documentation-gap', severity: 'review' }
      ],
      reviewSignals: [
        { category: 'deteriorating-obs', priority: 'blocker' },
        { category: 'discharge', priority: 'blocker' },
        { category: 'documentation', priority: 'review' }
      ]
    });

    expect(featureSnapshot).toMatchObject({
      syntheticPatientRef: 'DCU-RICH-001',
      news2Normalized: 0.7,
      potassiumFallingFlag: 1,
      handoverCompleteNorm: 0.4,
      news2TrendDeltaNorm: 0.4,
      safetyFlagLevelNorm: 0.6,
      simulationFlagCountNorm: 0.5,
      heuristicCueCountNorm: 0.6,
      blockerCueCountNorm: 0.6,
      documentationCuePresentFlag: 1,
      handoverCuePresentFlag: 1,
      escalationCuePresentFlag: 1,
      dischargeCuePresentFlag: 1,
      deterioratingObsCuePresentFlag: 1
    });
  });

  it('accepts an array of feature snapshots and scores the latest snapshot with observation-trend context', () => {
    const neutralFeatures = {
      syntheticPatientRef: 'TREND-ARRAY',
      potassiumFallingFlag: 0,
      documentationQualityNorm: 0.5,
      handoverCompleteNorm: 0.5,
      openTaskLoadNorm: 0.35,
      escalationStateNorm: 0.35,
      dischargeBlockerNorm: 0.35
    };
    const steady = scoreSimulatedTrend([
      { ...neutralFeatures, news2Normalized: 0.4 },
      { ...neutralFeatures, news2Normalized: 0.4 }
    ]);
    const rising = scoreSimulatedTrend([
      { ...neutralFeatures, news2Normalized: 0.1 },
      { ...neutralFeatures, news2Normalized: 0.4 }
    ]);

    expect(rising.syntheticPatientRef).toBe('TREND-ARRAY');
    expect(rising.modelVersion).toBe('simulation-risk-ml-v0-2-sim');
    expect(rising.featureSetVersion).toBe('signal-features-ml-v0-2-sim');
    expect(rising.riskScore).toBeGreaterThan(steady.riskScore);
    expect(rising.evidence.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        'NEWS2 increased across the simulated observation snapshots.'
      ])
    );
  });
});

describe('simulated trend synthetic dataset', () => {
  it('generates deterministic richer synthetic rows with the v0.2 simulation feature set', () => {
    const first = generateSyntheticDataset({ seed: 20260703 });
    const second = generateSyntheticDataset({ seed: 20260703 });

    expect(first).toEqual(second);
    expect(MODEL_VERSION).toBe('simulation-risk-ml-v0-2-sim');
    expect(FEATURE_SET_VERSION).toBe('signal-features-ml-v0-2-sim');
    expect(first.datasetSize).toBeGreaterThan(1000);
    expect(first.modelVersion).toBe(MODEL_VERSION);
    expect(first.featureSetVersion).toBe(FEATURE_SET_VERSION);
    expect(FEATURE_ORDER).toEqual(expect.arrayContaining([
      'news2TrendDeltaNorm',
      'safetyFlagLevelNorm',
      'simulationFlagCountNorm',
      'heuristicCueCountNorm',
      'blockerCueCountNorm',
      'documentationCuePresentFlag',
      'handoverCuePresentFlag',
      'escalationCuePresentFlag',
      'dischargeCuePresentFlag',
      'deterioratingObsCuePresentFlag'
    ]));
    expect(first.trainRows[0].features).toEqual(
      expect.objectContaining(
        Object.fromEntries(FEATURE_ORDER.map((featureName) => [featureName, expect.any(Number)]))
      )
    );
  });
});
