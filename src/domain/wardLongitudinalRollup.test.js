import { describe, expect, it } from 'vitest';
import { getPatientsForWard } from '../data/trustNetwork/index.js';
import { scanStrictSafetyLanguage } from './safetyLanguage.js';
import { buildWardLongitudinalRollup, compareWardDays } from './wardLongitudinalRollup.js';

const wardId = 'jpuh-ward-1';
const observationKeys = ['respRate', 'spo2', 'heartRate', 'systolicBp', 'tempC'];

describe('ward longitudinal rollup (simulation)', () => {
  it('is deterministic for the same ward and day, including day 1300', () => {
    expect(buildWardLongitudinalRollup(wardId, 1)).toEqual(buildWardLongitudinalRollup(wardId, 1));
    expect(buildWardLongitudinalRollup(wardId, 1300)).toEqual(buildWardLongitudinalRollup(wardId, 1300));
  });

  it('computes averages and review-support cue counts for a known small ward', () => {
    const rollup = buildWardLongitudinalRollup(wardId, 1);

    expect(getPatientsForWard(wardId)).toHaveLength(3);
    expect(rollup).toMatchObject({
      wardId,
      dayNumber: 1,
      patientCount: 3,
      reviewFlagCount: 3
    });
    expect(rollup.averages.respRate).toBeCloseTo(16.3333, 4);
    expect(rollup.averages.spo2).toBeCloseTo(98.3333, 4);
    expect(rollup.averages.heartRate).toBeCloseTo(75.3333, 4);
    expect(rollup.averages.systolicBp).toBeCloseTo(125.6667, 4);
    expect(rollup.averages.tempC).toBeCloseTo(37.2667, 4);
  });

  it('returns a symmetric then-versus-now comparison with per-observation average deltas', () => {
    const forward = compareWardDays(wardId, 1, 90);
    const backward = compareWardDays(wardId, 90, 1);

    expect(forward).toMatchObject({
      wardId,
      dayA: 1,
      dayB: 90,
      reviewFlagCount: { then: 3, now: 3 },
      trendNote: expect.stringMatching(/human review required.*review-support cue only/i)
    });
    expect(forward.averageDelta).toEqual(expect.objectContaining({
      respRate: expect.closeTo(1.6667, 4),
      spo2: expect.closeTo(-0.6667, 4),
      heartRate: expect.closeTo(3.6667, 4),
      systolicBp: expect.closeTo(-2, 4),
      tempC: expect.closeTo(-0.0667, 4)
    }));

    for (const key of observationKeys) {
      expect(backward.averages[key].then).toBe(forward.averages[key].now);
      expect(backward.averages[key].now).toBe(forward.averages[key].then);
      expect(backward.averages[key].delta).toBeCloseTo(-forward.averages[key].delta, 10);
    }
    expect(backward.reviewFlagCount).toEqual({ then: forward.reviewFlagCount.now, now: forward.reviewFlagCount.then });
    expect(backward.trendNote).toBe(forward.trendNote);
  });

  it('does not include patient identifiers in generated rollups', () => {
    const output = JSON.stringify({
      rollup: buildWardLongitudinalRollup(wardId, 1),
      comparison: compareWardDays(wardId, 1, 90)
    });

    expect(output).not.toMatch(/\b(name|dob|nhsNumber)\b/i);
  });

  it('keeps every generated trend note clear of banned wording', () => {
    const notes = [
      compareWardDays(wardId, 1, 90).trendNote,
      compareWardDays(wardId, 90, 1).trendNote,
      compareWardDays(wardId, 1, 1).trendNote
    ];

    for (const trendNote of notes) {
      expect(scanStrictSafetyLanguage(trendNote, { checkedLabel: 'ward trend note' })).toMatchObject({
        passed: true,
        violations: []
      });
    }
  });
});
