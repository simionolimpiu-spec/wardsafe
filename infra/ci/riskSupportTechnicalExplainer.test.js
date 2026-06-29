import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('SafeFlow risk-support technical explainer', () => {
  it('ships a public explainer with bounded simulation-only language', () => {
    const explainerPath = resolve(process.cwd(), 'docs/risk-support-technical-explainer.md');
    const explainer = readRepoFile('docs/risk-support-technical-explainer.md');

    expect(existsSync(explainerPath)).toBe(true);
    expect(explainer).toContain('# SafeFlow simulation risk-support layer');
    expect(explainer).toContain('## Purpose');
    expect(explainer).toContain('## What it is not');
    expect(explainer).toContain('## Why deterministic rules first');
    expect(explainer).toContain('## Data boundary');
    expect(explainer).toContain('## Output contract');
    expect(explainer).toContain('## Evaluation harness');
    expect(explainer).toContain('## Read-only report boundary');
    expect(explainer).toContain('## Governance position');
    expect(explainer).toContain('documentation gaps');
    expect(explainer).toContain('handover completeness issues');
    expect(explainer).toContain('escalation readiness cues');
    expect(explainer).toContain('discharge-readiness blockers');
    expect(explainer).toContain('simulation-only prototype');
    expect(explainer).toContain('not clinically validated');
    expect(explainer).toContain('not for live clinical deployment');
    expect(explainer).toContain('no external LLM or model call is made by this layer');
    expect(explainer).toContain('accuracy');
    expect(explainer).toContain('AUROC');
    expect(explainer).toContain('clinical judgement');
    expect(explainer).not.toMatch(/\bpatient needs potassium\b/i);
    expect(explainer).not.toMatch(/\bgive potassium\b/i);
    expect(explainer).not.toMatch(/\bpotassium recommendation\b/i);
  });

  it('is linked from the main README and the public demo pack index', () => {
    const readme = readRepoFile('README.md');
    const publicDemoPackReadme = readRepoFile('docs/public-demo-pack/README.md');

    expect(readme).toContain('docs/risk-support-technical-explainer.md');
    expect(publicDemoPackReadme).toContain('../risk-support-technical-explainer.md');
  });
});
