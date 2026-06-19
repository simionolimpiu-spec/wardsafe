import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '.github/workflows/safeflow-ci.yml');
const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, 'utf8') : '';

describe('SafeFlow GitHub CI workflow', () => {
  it('runs on pull requests and protected branch pushes with read-only repository access', () => {
    expect(workflow).toMatch(/pull_request:/);
    expect(workflow).toMatch(/push:/);
    expect(workflow).toMatch(/permissions:\s*\n\s*contents: read/);
    expect(workflow).toMatch(/concurrency:/);
    expect(workflow).toMatch(/cancel-in-progress: true/);
  });

  it('runs application tests, build, browser journey and moderate audit checks', () => {
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('playwright install --with-deps chromium');
    expect(workflow).toContain('npm run e2e');
    expect(workflow).toContain('npm audit --audit-level=moderate');
  });

  it('validates migration approval and synthesizes dev and simulation environments', () => {
    expect(workflow).toContain("SAFEFLOW_SIMULATION_ONLY: 'true'");
    expect(workflow).toContain('npm run db:manifest');
    expect(workflow).toContain('npm run db:migrate:plan');
    expect(workflow).toContain('npm run infra:synth:dev');
    expect(workflow).toContain('npm run infra:synth:simulation');
  });

  it('proves pilot remains blocked and never configures AWS credentials or deploys', () => {
    expect(workflow).toContain('safeflowEnvironment=pilot');
    expect(workflow).toMatch(/Pilot synthesis unexpectedly succeeded/);
    expect(workflow).toContain('restricted and not approved for synthesis or deployment');
    expect(workflow).not.toMatch(/configure-aws-credentials/i);
    expect(workflow).not.toMatch(/cdk deploy/i);
    expect(workflow).not.toMatch(/aws_secret_access_key|secrets\./i);
  });

  it('pins Node 22 and bounds each job runtime', () => {
    expect(workflow).toMatch(/node-version: ['"]22['"]/);
    expect(workflow.match(/timeout-minutes:/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
