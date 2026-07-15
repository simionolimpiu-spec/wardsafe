import { describe, expect, it } from 'vitest';
import { JPUH_WARDS, NNUH_WARDS, CUH_WARDS, TRUSTS, WARDS_BY_TRUST } from './trusts.js';
import {
  trustNetwork,
  buildTrustNetworkExport,
  getWardsForTrust,
  getInterTrustJourneys,
  getPortableJourneys,
  getLearningRecords
} from './index.js';
import { EXPORT_TABLES, renderTrustNetworkArtifacts } from './trustNetworkArtifacts.js';

describe('England trust network (simulation)', () => {
  it('defines the England trust network with James Paget exact', () => {
    expect(TRUSTS.map((t) => t.id)).toEqual(['jpuh', 'nnuh', 'cuh', 'wsh', 'esneft', 'qeh']);
    expect(TRUSTS.find((t) => t.id === 'jpuh').wardSource).toBe('exact');
    expect(TRUSTS.every((t) => t.simulationOnly === true)).toBe(true);
    expect(JPUH_WARDS).toHaveLength(33);
    expect(NNUH_WARDS.length).toBeGreaterThanOrEqual(21);
    expect(CUH_WARDS.length).toBeGreaterThanOrEqual(15);
    expect(getWardsForTrust('jpuh')).toHaveLength(33);
    // real James Paget wards
    const jpuh = new Map(JPUH_WARDS.map((w) => [w.name, w.specialty]));
    expect(jpuh.get('Ward 1')).toBe('Stroke Unit');
    expect(jpuh.get('ICU/HDU')).toBe('Intensive Care / High Dependency');
    // Addenbrooke's neurosciences present (tertiary anchor for transfers)
    expect(CUH_WARDS.some((w) => /neuro/i.test(w.specialty))).toBe(true);
  });

  it('passes referential-integrity checks across all trusts', () => {
    const model = buildTrustNetworkExport();
    expect(model.integrity.ok).toBe(true);
    expect(model.integrity.violations).toEqual([]);
    expect(model.counts.trusts).toBe(6);
    const summed = Object.values(model.counts.perTrustWardCounts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(model.counts.wards);
    expect(model.counts.patients).toBeGreaterThan(0);
  });

  it('models portable cross-trust journeys with a learning copy returned to the originating trust', () => {
    const portable = getPortableJourneys();
    expect(portable.length).toBeGreaterThanOrEqual(3);
    const types = new Set(portable.map((j) => j.journeyType));
    expect(types.has('relocation')).toBe(true);
    expect(types.has('temporary-visitor')).toBe(true);
    expect(types.has('specialist-transfer')).toBe(true);

    for (const j of trustNetwork.journeys) {
      expect(j.humanReviewRequired).toBe(true);
      // learning copy returns to the journey's originating (home) trust
      expect(j.learningRecord.returnedToTrustId).toBe(j.homeTrustId);
      expect(j.learningRecord.teachingPoints.length).toBeGreaterThan(0);
      for (const seg of j.segments) {
        const ward = trustNetwork.wards.find((w) => w.id === seg.wardId);
        expect(ward).toBeTruthy();
        expect(ward.trustId).toBe(seg.trustId);
      }
    }
    // every journey produces a learning record
    expect(getLearningRecords()).toHaveLength(trustNetwork.journeys.length);

    // at least one journey spans 3+ trusts region-to-region OR reaches a tertiary centre
    expect(getInterTrustJourneys().some((j) => j.trustsInvolved.includes('cuh'))).toBe(true);
  });

  it('keeps every patient fictional, non-identifying, and tied to a home trust', () => {
    for (const p of trustNetwork.patients) {
      expect(p.simulationOnly).toBe(true);
      expect(p.displayLabel).toBe('Fictional patient (simulation)');
      expect(p).not.toHaveProperty('name');
      expect(p).not.toHaveProperty('nhsNumber');
      expect(p.id).toMatch(/^[A-Z]+-P-\d{3}$/);
      expect(TRUSTS.some((t) => t.id === p.homeTrustId)).toBe(true);
    }
  });

  it('carries the simulation-only + not-a-live-record boundary and no unsafe clinical wording', () => {
    const serialized = JSON.stringify(buildTrustNetworkExport());
    expect(trustNetwork.boundaryNote.toLowerCase()).toContain('simulation-only');
    expect(trustNetwork.boundaryNote.toLowerCase()).toContain('not a live cross-trust patient record');
    expect(serialized).not.toMatch(/diagnos|prescrib|automated escalation|staff scoring|league table/i);
  });

  it('renders CSV artifacts for every table including learning records', () => {
    const artifacts = renderTrustNetworkArtifacts();
    expect(artifacts.integrity.ok).toBe(true);
    const names = EXPORT_TABLES.map((t) => t.name);
    expect(names).toContain('learning_records');
    for (const table of EXPORT_TABLES) {
      expect(artifacts.csv[table.name]).toContain(table.headers.join(','));
      expect(artifacts.csv[table.name].split('\n').length).toBeGreaterThan(1);
    }
    // WARDS_BY_TRUST covers all trusts
    expect(Object.keys(WARDS_BY_TRUST)).toEqual(['jpuh', 'nnuh', 'cuh', 'wsh', 'esneft', 'qeh']);
  });
});
