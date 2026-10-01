import { describe, expect, it } from 'vitest';
import { scanStrictSafetyLanguage } from './safetyLanguage.js';
import {
  SCORE_COMPARISON_PARAMETERS,
  SCORE_COMPARISON_SNAPSHOTS,
  compareScoringSystems,
  computeMewsStylePoints,
  computeNews2Points
} from './scoreComparison.js';

const earlySubtleChange = SCORE_COMPARISON_SNAPSHOTS.find(({ id }) => id === 'early-subtle-change');
const moderateDeterioration = SCORE_COMPARISON_SNAPSHOTS.find(({ id }) => id === 'moderate-deterioration');

describe('score comparison domain module', () => {
  it('uses the published NEWS2 Scale 1 bands for the early subtle change fixture', () => {
    const result = computeNews2Points(earlySubtleChange.observations);

    expect(result).toMatchObject({
      total: 6,
      perParameter: {
        respRate: 2,
        spo2: 2,
        heartRate: 1,
        systolicBp: 1,
        tempC: 0,
        consciousness: 0
      },
      escalationConvention: expect.stringContaining('aggregate 5+')
    });
  });

  it('uses the published NEWS2 boundary bands for a moderate deterioration fixture', () => {
    const result = computeNews2Points(moderateDeterioration.observations);

    expect(result).toMatchObject({
      total: 14,
      perParameter: {
        respRate: 3,
        spo2: 3,
        heartRate: 2,
        systolicBp: 2,
        tempC: 1,
        consciousness: 3
      }
    });
  });

  it('returns the same result shape for both scoring conventions', () => {
    const news2 = computeNews2Points(earlySubtleChange.observations);
    const mewsStyle = computeMewsStylePoints(earlySubtleChange.observations);

    for (const result of [news2, mewsStyle]) {
      expect(Object.keys(result)).toEqual(['total', 'perParameter', 'escalationConvention']);
      expect(Object.keys(result.perParameter)).toEqual(SCORE_COMPARISON_PARAMETERS.map(({ key }) => key));
      expect(result.total).toEqual(expect.any(Number));
      expect(result.escalationConvention).toEqual(expect.any(String));
    }

    expect(mewsStyle.perParameter.spo2).toBeNull();
    expect(mewsStyle.escalationConvention).toContain('MEWS-style variant');
  });

  it('compares both results with a fixed review-support note', () => {
    const comparison = compareScoringSystems(earlySubtleChange.observations);

    expect(comparison).toMatchObject({
      news2: expect.objectContaining({ total: 6 }),
      mewsStyle: expect.objectContaining({ total: 2 }),
      comparisonNote: expect.stringContaining('local escalation policy always governs')
    });
  });

  it('is deterministic for the same fictional observations', () => {
    const first = compareScoringSystems(moderateDeterioration.observations);
    const second = compareScoringSystems(moderateDeterioration.observations);

    expect(second).toEqual(first);
  });

  it('keeps all rendered comparison strings clear in strict safety-language scans', () => {
    const comparison = compareScoringSystems(earlySubtleChange.observations);
    const renderedStrings = [
      ...SCORE_COMPARISON_SNAPSHOTS.flatMap(({ label, description }) => [label, description]),
      comparison.news2.escalationConvention,
      comparison.mewsStyle.escalationConvention,
      comparison.comparisonNote,
      'Simulation only - fictional observations - human review required'
    ];

    for (const [index, renderedString] of renderedStrings.entries()) {
      expect(scanStrictSafetyLanguage(renderedString, {
        checkedLabel: `score comparison rendered string ${index}`
      })).toMatchObject({
        passed: true,
        violations: []
      });
    }
  });
});
