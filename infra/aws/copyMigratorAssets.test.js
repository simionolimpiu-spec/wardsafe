import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('copyMigratorAssets', () => {
  it('bundles signal intelligence query contracts', () => {
    const script = readFileSync('infra/aws/copyMigratorAssets.mjs', 'utf8');

    expect(script).toContain('simulationSignalTimeline.sql');
    expect(script).toContain('simulationRiskSuggestions.sql');
    expect(script).toContain('recordSimulationSuggestionAction.sql');
  });
});
