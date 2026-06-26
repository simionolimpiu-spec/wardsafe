import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readPublicDoc(path) {
  return readFileSync(resolve(process.cwd(), 'docs/public-demo-pack', path), 'utf8');
}

describe('SafeFlow public demo pack', () => {
  it('includes a reusable discovery feedback and backlog template', () => {
    const readme = readPublicDoc('README.md');
    const workshop = readPublicDoc('discovery-workshop-pack.md');
    const templatePath = 'templates/discovery-feedback-backlog-template.md';
    const templateFile = resolve(process.cwd(), 'docs/public-demo-pack', templatePath);

    expect(existsSync(templateFile)).toBe(true);
    expect(readme).toContain(templatePath);
    expect(workshop).toContain(templatePath);

    const template = readFileSync(templateFile, 'utf8');

    expect(template).toContain('Scenario Prioritisation');
    expect(template).toContain('Backlog Decision');
    expect(template).toContain('Hazard Or Safety Concern');
    expect(template).toContain('No live patient data');
    expect(template).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
    expect(template).not.toMatch(/NHS logo|official NHS/i);
  });

  it('includes AWS free-tier setup guidance and a committed env template', () => {
    const setupPath = resolve(process.cwd(), 'docs/public-demo-pack/build-readiness/aws-free-tier-setup.md');
    const envTemplatePath = resolve(process.cwd(), '.env.aws.example');
    const gitignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf8');

    expect(existsSync(setupPath)).toBe(true);
    expect(existsSync(envTemplatePath)).toBe(true);
    expect(gitignore).toContain('!.env.aws.example');

    const setup = readFileSync(setupPath, 'utf8');
    const envTemplate = readFileSync(envTemplatePath, 'utf8');

    expect(setup).toContain('eu-west-2');
    expect(setup).toContain('AWS Free Tier');
    expect(setup).toContain('MFA');
    expect(setup).toContain('AWS Budget');
    expect(setup).toContain('No live patient data');
    expect(envTemplate).toContain('CDK_DEFAULT_REGION=eu-west-2');
    expect(envTemplate).toContain('SAFEFLOW_SIMULATION_ONLY=true');
    expect(envTemplate).toContain('SAFEFLOW_ACCOUNT_MFA_CONFIRMED=true');
    expect(envTemplate).toContain('SAFEFLOW_BUDGET_CONFIRMED=true');
    expect(envTemplate).toContain('SAFEFLOW_DEPLOYMENT_APPROVED=false');
    expect(envTemplate).not.toMatch(/AKIA|aws_secret_access_key|sk-[A-Za-z0-9_-]{8,}/i);
  });
});
