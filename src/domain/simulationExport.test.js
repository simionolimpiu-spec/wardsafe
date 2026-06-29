import { describe, expect, it } from 'vitest';
import { buildWardReportRows, createSimulationCsv } from './simulationExport.js';
import { createInitialSimulationState } from '../state/simulationWorkspace.js';

describe('simulation report export', () => {
  it('escapes CSV cells without changing fictional values', () => {
    const csv = createSimulationCsv([
      ['Patient', 'Note'],
      ['DCU-031', 'Review, then document "response"']
    ]);

    expect(csv).toBe('"Patient","Note"\n"DCU-031","Review, then document ""response"""');
  });

  it('builds ward rows from fictional identifiers only', () => {
    const rows = buildWardReportRows(createInitialSimulationState().patients);
    const text = rows.flat().join(' ');

    expect(text).toContain('DCU-031');
    expect(text).toContain('Patient 031');
    expect(text).not.toMatch(/NHS number|administer|prescribe|diagnose/i);
  });
});
