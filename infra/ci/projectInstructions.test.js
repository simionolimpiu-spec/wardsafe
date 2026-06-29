import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('SafeFlow project instructions', () => {
  it('ships repo-level agent guardrails for simulation-only work', () => {
    const agentsPath = resolve(process.cwd(), 'AGENTS.md');
    const agents = readRepoFile('AGENTS.md');

    expect(existsSync(agentsPath)).toBe(true);
    expect(agents).toContain('simulation-first clinical documentation and workflow-intelligence prototype');
    expect(agents).toContain('Fictional patient data only.');
    expect(agents).toContain('No real patient data.');
    expect(agents).toContain('No NHS logo.');
    expect(agents).toContain('No diagnosis.');
    expect(agents).toContain('No prescribing.');
    expect(agents).toContain('No treatment recommendation.');
    expect(agents).toContain('No autonomous clinical decision-making.');
    expect(agents).toContain('No live clinical deployment claim.');
    expect(agents).toContain('No potassium recommendation wording.');
    expect(agents).toContain('risk-support signal');
    expect(agents).toContain('structured review support');
    expect(agents).toContain('pnpm test');
    expect(agents).toContain('SAFEFLOW_SIMULATION_ONLY=true pnpm run db:migrate:plan');
  });

  it('ships a PR checklist and README cross-reference for guardrail review', () => {
    const templatePath = resolve(process.cwd(), '.github/pull_request_template.md');
    const template = readRepoFile('.github/pull_request_template.md');
    const readme = readRepoFile('README.md');

    expect(existsSync(templatePath)).toBe(true);
    expect(template).toContain('Branch purpose is narrow and specific to this PR.');
    expect(template).toContain('Fictional data only');
    expect(template).toContain('No real patient data');
    expect(template).toContain('No NHS logo or implied endorsement');
    expect(template).toContain('No diagnosis, prescribing, treatment recommendation, or autonomous decision wording');
    expect(template).toContain('No live deployment claim');
    expect(template).toContain('No unsafe potassium wording');
    expect(template).toContain('Safety-language regression checked where relevant');
    expect(template).toContain('Deterministic outputs preserved where relevant');
    expect(template).toContain('No API keys');
    expect(template).toContain('No external datasets');
    expect(template).toContain('No ML libraries or model training unless explicitly approved');
    expect(readme).toContain('AGENTS.md');
    expect(readme).toContain('.github/pull_request_template.md');
  });
});
