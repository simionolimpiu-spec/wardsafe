import { describe, expect, it } from 'vitest';
import { buildPatientTimeline } from './patientTimelines.js';
import { trustNetwork, getPatientTimeline, buildTrustNetworkExport } from './index.js';
import { renderTrustNetworkArtifacts, EXPORT_TABLES } from './trustNetworkArtifacts.js';

describe('trust-network patient timelines (simulation)', () => {
  it('builds a deterministic, non-identifying observation timeline per patient', () => {
    const patient = trustNetwork.patients[0];
    const a = buildPatientTimeline(patient);
    const b = buildPatientTimeline(patient);
    expect(a).toEqual(b); // deterministic
    expect(a.points).toHaveLength(4);
    expect(a.simulationOnly).toBe(true);
    expect(a).not.toHaveProperty('name');
    expect(a.trendNote).toMatch(/human review required/i);
    for (const pt of a.points) {
      expect(pt.respRate).toBeGreaterThan(0);
      expect(pt.spo2).toBeGreaterThanOrEqual(80);
      expect(pt.simulationOnly).toBe(true);
    }
  });

  it('drifts only for trend/escalation review themes and stays stable otherwise', () => {
    const drift = trustNetwork.patients.find((p) => /observation trend|escalation readiness/i.test(p.reviewTheme));
    const stable = trustNetwork.patients.find((p) => !/observation trend|escalation readiness/i.test(p.reviewTheme));
    if (drift) {
      const t = buildPatientTimeline(drift);
      expect(t.trend).toBe('drifting');
      expect(t.points.at(-1).respRate).toBeGreaterThan(t.points[0].respRate);
    }
    if (stable) {
      const t = buildPatientTimeline(stable);
      expect(t.trend).toBe('stable');
      expect(t.points.at(-1).respRate).toBe(t.points[0].respRate);
    }
  });

  it('exposes timelines via getPatientTimeline and includes observations in the export + CSV', () => {
    const patient = trustNetwork.patients[3];
    expect(getPatientTimeline(patient.id).patientId).toBe(patient.id);
    expect(getPatientTimeline('NOT-A-PATIENT')).toBeNull();

    const model = buildTrustNetworkExport();
    expect(model.counts.observations).toBeGreaterThan(0);
    expect(model.counts.patientTimelines).toBe(model.patients.length);
    expect(model.observations.length).toBe(model.counts.observations);

    const artifacts = renderTrustNetworkArtifacts(model);
    expect(EXPORT_TABLES.map((t) => t.name)).toContain('observations');
    expect(artifacts.csv.observations).toContain('respRate');
    expect(artifacts.csv.observations.split('\n').length).toBeGreaterThan(1);
  });
});
