import { describe, expect, it } from 'vitest';
import {
  PROGRESSION_POINTS,
  buildCompetencyPassportSummary,
  buildPlacementGroups,
  buildProactivityScore,
  buildNmcCoverageSummary,
  countVerifiedEntries,
  totalPassportPoints
} from './competencyPassport.js';

describe('competency passport domain', () => {
  const entries = [
    {
      id: 'entry-1',
      studentId: 'STU-001',
      placementId: 'ward-a',
      procedure: 'Peripheral cannula check',
      participationLevel: 'observed',
      date: '2026-06-01',
      verifier: { name: 'Mina Patel', role: 'nurse' },
      verified: true,
      points: 1,
      nmcProficiencies: ['communication']
    },
    {
      id: 'entry-2',
      studentId: 'STU-001',
      placementId: 'ward-a',
      procedure: 'Handover summary',
      participationLevel: 'performed-supervised',
      date: '2026-06-02',
      verifier: { name: 'Ellis Grant', role: 'supervisor' },
      verified: true,
      points: 3,
      nmcProficiencies: ['escalation-and-collaboration']
    },
    {
      id: 'entry-3',
      studentId: 'STU-001',
      placementId: 'ward-b',
      procedure: 'Escalation note',
      participationLevel: 'performed-independent',
      date: '2026-06-03',
      verifier: { name: 'Asha Khan', role: 'student' },
      verified: false,
      points: 4,
      nmcProficiencies: ['escalation-and-collaboration']
    }
  ];

  it('awards points only for verified entries', () => {
    expect(totalPassportPoints(entries)).toBe(PROGRESSION_POINTS.observed + PROGRESSION_POINTS.performed_supervised);
    expect(countVerifiedEntries(entries)).toBe(2);
  });

  it('groups placements and keeps the newest entries first within each placement', () => {
    const grouped = buildPlacementGroups(entries);

    expect(grouped).toEqual([
      expect.objectContaining({
        placementId: 'ward-a',
        verifiedPoints: 4,
        entries: expect.arrayContaining([
          expect.objectContaining({ id: 'entry-1' }),
          expect.objectContaining({ id: 'entry-2' })
        ])
      }),
      expect.objectContaining({
        placementId: 'ward-b',
        verifiedPoints: 0,
        entries: [expect.objectContaining({ id: 'entry-3' })]
      })
    ]);
    expect(grouped[0].entries.map((entry) => entry.id)).toEqual(['entry-2', 'entry-1']);
  });

  it('builds NMC coverage and proactivity summaries from verified entries', () => {
    const coverage = buildNmcCoverageSummary(entries);
    const proactivity = buildProactivityScore(entries);

    expect(coverage.totalTags).toBeGreaterThan(0);
    expect(coverage.achievedTags).toContain('communication');
    expect(coverage.achievedTags).toContain('escalation-and-collaboration');
    expect(coverage.coveredCount).toBe(2);
    expect(coverage.totalCount).toBeGreaterThanOrEqual(3);
    expect(proactivity).toMatchObject({
      verifiedEntryCount: 2,
      breadthCount: 2,
      selfInitiatedCount: 0,
      score: expect.any(Number)
    });
  });

  it('builds a student summary with coverage and points', () => {
    const summary = buildCompetencyPassportSummary(entries);

    expect(summary).toMatchObject({
      totalPoints: 4,
      verifiedEntryCount: 2,
      placementCount: 2
    });
    expect(summary.nmcCoverage.coveredCount).toBe(2);
    expect(summary.proactivity.score).toBeGreaterThan(0);
  });
});
