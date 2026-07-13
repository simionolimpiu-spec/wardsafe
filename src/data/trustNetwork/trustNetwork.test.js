import { describe, expect, it } from 'vitest';
import { JPUH_WARDS, NNUH_WARDS, TRUSTS } from './trusts.js';
import {
  trustNetwork,
  buildTrustNetworkExport,
  getWardsForTrust,
  getInterTrustJourneys
} from './index.js';
import { EXPORT_TABLES, renderTrustNetworkArtifacts } from './trustNetworkArtifacts.js';

describe('two-trust simulation network', () => {
  it('defines exactly the two trusts (James Paget + Norfolk & Norwich)', () => {
    expect(TRUSTS.map((t) => t.id)).toEqual(['jpuh', 'nnuh']);
    expect(TRUSTS.every((t) => t.simulationOnly === true)).toBe(true);
  });

  it('holds the exact James Paget ward directory and the sourced NNUH set', () => {
    expect(JPUH_WARDS).toHaveLength(33);
    expect(NNUH_WARDS).toHaveLength(18);
    const jpuh = new Map(JPUH_WARDS.map((w) => [w.name, w.specialty]));
    expect(jpuh.get('Ward 1')).toBe('Stroke Unit');
    expect(jpuh.get('Ward 12')).toBe("Older People's Medicine");
    expect(jpuh.get('ICU/HDU')).toBe('Intensive Care / High Dependency');
    expect(jpuh.get('EADU')).toBe('Emergency Assessment & Discharge Unit');
    expect(jpuh.get('Sandra Chapman Centre')).toBe('Haematology & Oncology Day Treatment');
    const nnuhNames = NNUH_WARDS.map((w) => w.name);
    for (const name of ['Loddon Ward', 'Easton Ward', 'Critical Care Complex (ITU/HDU)', 'Weybourne Day Unit', 'Neonatal Intensive Care Unit']) {
      expect(nnuhNames).toContain(name);
    }
    expect(getWardsForTrust('jpuh')).toHaveLength(33);
    expect(getWardsForTrust('nnuh')).toHaveLength(18);
  });

  it('passes referential-integrity (FK) checks with zero violations', () => {
    const model = buildTrustNetworkExport();
    expect(model.integrity.ok).toBe(true);
    expect(model.integrity.violations).toEqual([]);
    expect(model.counts.trusts).toBe(2);
    expect(model.counts.wards).toBe(51);
    expect(model.counts.patients).toBeGreaterThan(0);
  });

  it('models inter-trust handover journeys and health-plan continuation', () => {
    const inter = getInterTrustJourneys();
    expect(inter.length).toBeGreaterThanOrEqual(3);
    for (const j of inter) {
      expect(j.trustsInvolved.length).toBeGreaterThan(1);
      expect(j.trustsInvolved).toContain('jpuh');
      expect(j.trustsInvolved).toContain('nnuh');
      expect(j.segments.length).toBeGreaterThanOrEqual(2);
      expect(j.humanReviewRequired).toBe(true);
      // every segment references a real ward in the trust it claims
      for (const seg of j.segments) {
        const ward = trustNetwork.wards.find((w) => w.id === seg.wardId);
        expect(ward).toBeTruthy();
        expect(ward.trustId).toBe(seg.trustId);
      }
    }
    const outcomes = new Set(trustNetwork.journeys.map((j) => j.outcome));
    expect(outcomes.has('returned-to-james-paget')).toBe(true);
    expect(outcomes.has('discharge-with-package-of-care')).toBe(true);
  });

  it('keeps every patient fictional and non-identifying', () => {
    for (const p of trustNetwork.patients) {
      expect(p.simulationOnly).toBe(true);
      expect(p.displayLabel).toBe('Fictional patient (simulation)');
      expect(p).not.toHaveProperty('name');
      expect(p).not.toHaveProperty('nhsNumber');
      expect(p).not.toHaveProperty('dateOfBirth');
      expect(p.id).toMatch(/^(JPUH|NNUH)-P-\d{3}$/);
    }
  });

  it('carries the simulation-only boundary and no unsafe clinical wording', () => {
    const serialized = JSON.stringify(buildTrustNetworkExport());
    expect(trustNetwork.boundaryNote.toLowerCase()).toContain('simulation-only');
    expect(trustNetwork.boundaryNote.toLowerCase()).toContain('not a live inter-trust');
    expect(serialized).not.toMatch(/diagnos|prescrib|automated escalation|staff scoring|league table/i);
  });

  it('renders CSV artifacts for every table', () => {
    const artifacts = renderTrustNetworkArtifacts();
    expect(artifacts.integrity.ok).toBe(true);
    for (const table of EXPORT_TABLES) {
      expect(artifacts.csv[table.name]).toContain(table.headers.join(','));
      expect(artifacts.csv[table.name].split('\n').length).toBeGreaterThan(1);
    }
    expect(artifacts.csv.journey_segments).toMatch(/jpuh/);
    expect(artifacts.csv.journey_segments).toMatch(/nnuh/);
  });
});
