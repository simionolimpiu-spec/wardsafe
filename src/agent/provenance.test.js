import { describe, expect, it } from 'vitest';
import { createProvenance, ProvenanceError } from './index.js';

const input = { source: 'simulation', sourceRecordId: 'record-1', observedAt: '2026-06-17T07:00:00Z', importedAt: '2026-06-17T14:00:00Z', observedAtLabel: '07:00' };

describe('provenance', () => {
  it.each(['source', 'sourceRecordId'])('rejects missing and empty %s', (field) => {
    for (const value of [undefined, null, '', '  ']) {
      expect(() => createProvenance({ ...input, [field]: value })).toThrow(ProvenanceError);
    }
  });
  it.each(['observedAt', 'importedAt'])('rejects invalid %s', (field) => {
    for (const value of [undefined, '', 'yesterday', '2026-02-30T07:00:00Z', '2026-06-17T25:00:00Z', '2026-06-17T07:00:00', 1781683200000]) {
      expect(() => createProvenance({ ...input, [field]: value })).toThrow(ProvenanceError);
    }
  });
  it('preserves timestamp offsets and labels in frozen simulation provenance', () => {
    const provenance = createProvenance({ ...input, observedAt: '2024-02-29T08:00:00+01:00' });
    expect(provenance).toEqual({ ...input, observedAt: '2024-02-29T08:00:00+01:00', simulationOnly: true });
    expect(Object.isFrozen(provenance)).toBe(true);
    expect(() => { provenance.source = 'changed'; }).toThrow();
  });
});
