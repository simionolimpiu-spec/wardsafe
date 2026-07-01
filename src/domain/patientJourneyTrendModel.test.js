import { describe, expect, it } from 'vitest';
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
