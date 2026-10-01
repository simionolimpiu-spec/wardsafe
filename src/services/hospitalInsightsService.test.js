import { describe, expect, it } from 'vitest';
import {
  getHospitalInsightsSnapshot,
  getHospitalInsightsSourceStatus,
  getWardBenchmarkSnapshot
} from './hospitalInsightsService.js';

describe('hospital insights service', () => {
  it('returns deterministic simulation-only benchmark data', () => {
    const sourceStatus = getHospitalInsightsSourceStatus();
    const benchmarkSnapshot = getWardBenchmarkSnapshot();
    const snapshot = getHospitalInsightsSnapshot();

    expect(sourceStatus).toEqual({
      sourceType: 'simulation',
      connectedToLiveSystems: false,
      containsPatientData: false,
      lastUpdatedLabel: 'Static prototype data'
    });
    expect(benchmarkSnapshot.sourceStatus).toEqual(sourceStatus);
    expect(benchmarkSnapshot.sourceStatus.connectedToLiveSystems).toBe(false);
    expect(benchmarkSnapshot.sourceStatus.containsPatientData).toBe(false);
    expect(benchmarkSnapshot.currentWardName).toBe('Day Care Unit');
    expect(benchmarkSnapshot.comparisonRows).toHaveLength(6);
    expect(snapshot.sourceStatus).toEqual(sourceStatus);
    expect(snapshot.summaryCards).toHaveLength(5);
    expect(snapshot.comparisonRows).toHaveLength(6);
    expect(snapshot.boundaryNote).toMatch(/human review required/i);
    expect(snapshot.insightCues).toContain('This is a comparison cue only and requires human review.');
    expect(getHospitalInsightsSnapshot()).toEqual(snapshot);
  });
});
