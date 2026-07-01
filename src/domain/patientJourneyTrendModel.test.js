import { describe, expect, it } from 'vitest';
import modelData from '../data/patientJourneyTrendModel.json';
import { scoreSimulatedTrend } from './patientJourneyTrendModel.js';

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
      modelVersion: 'simulation-risk-ml-v0',
      featureSetVersion: 'signal-features-ml-v0',
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
});
