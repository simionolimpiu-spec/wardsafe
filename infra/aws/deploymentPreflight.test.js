import { describe, expect, it, vi } from 'vitest';
import { createDeploymentPreflight, REQUIRED_DEPLOYMENT_CONFIRMATIONS } from './deploymentPreflight.js';

describe('SafeFlow AWS deployment preflight', () => {
  const approvedEnv = {
    AWS_PROFILE: 'safeflow-free-tier',
    CDK_DEFAULT_REGION: 'eu-west-2',
    SAFEFLOW_ENVIRONMENT: 'simulation',
    SAFEFLOW_SIMULATION_ONLY: 'true',
    SAFEFLOW_ACCOUNT_MFA_CONFIRMED: 'true',
    SAFEFLOW_BUDGET_CONFIRMED: 'true',
    SAFEFLOW_DEPLOYMENT_APPROVED: 'true',
    SAFEFLOW_ALLOWED_ORIGIN: 'https://preview.example.com',
    SAFEFLOW_PREVIEW_ACCESS_TOKEN: 'safe-preview-token-for-review-12345'
  };

  it('passes only when all simulation deployment confirmations are present', async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const preflight = createDeploymentPreflight({
      env: approvedEnv,
      stdout,
      stderr,
      getCallerIdentity: vi.fn().mockResolvedValue({
        Arn: 'arn:aws:iam::123456789012:user/safeflow-deployer'
      })
    });

    await expect(preflight()).resolves.toBe(0);
    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('SafeFlow AWS deployment preflight passed'));
    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('eu-west-2'));
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('fails closed when safety confirmations or London region are missing', async () => {
    const stderr = { write: vi.fn() };
    const preflight = createDeploymentPreflight({
      env: {
        ...approvedEnv,
        CDK_DEFAULT_REGION: 'us-east-1',
        SAFEFLOW_BUDGET_CONFIRMED: 'false'
      },
      stdout: { write: vi.fn() },
      stderr
    });

    await expect(preflight()).resolves.toBe(1);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('CDK_DEFAULT_REGION must be eu-west-2'));
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('SAFEFLOW_BUDGET_CONFIRMED must be true'));
  });

  it('requires a non-placeholder preview access token before public preview deploy', async () => {
    const stderr = { write: vi.fn() };
    const preflight = createDeploymentPreflight({
      env: {
        ...approvedEnv,
        SAFEFLOW_PREVIEW_ACCESS_TOKEN: 'changeme'
      },
      stdout: { write: vi.fn() },
      stderr
    });

    await expect(preflight()).resolves.toBe(1);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('SAFEFLOW_PREVIEW_ACCESS_TOKEN must be set'));
  });

  it('requires a hosted SAFEFLOW_ALLOWED_ORIGIN before public preview deploy', async () => {
    const stderr = { write: vi.fn() };
    const preflight = createDeploymentPreflight({
      env: {
        ...approvedEnv,
        SAFEFLOW_ALLOWED_ORIGIN: ''
      },
      stdout: { write: vi.fn() },
      stderr
    });

    await expect(preflight()).resolves.toBe(1);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('SAFEFLOW_ALLOWED_ORIGIN must be set'));
  });

  it('rejects localhost SAFEFLOW_ALLOWED_ORIGIN values before public preview deploy', async () => {
    const stderr = { write: vi.fn() };
    const preflight = createDeploymentPreflight({
      env: {
        ...approvedEnv,
        SAFEFLOW_ALLOWED_ORIGIN: 'http://127.0.0.1:4173/'
      },
      stdout: { write: vi.fn() },
      stderr
    });

    await expect(preflight()).resolves.toBe(1);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('SAFEFLOW_ALLOWED_ORIGIN must point to a hosted preview origin'));
  });

  it('rejects root AWS credentials before diff or deploy can run', async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const preflight = createDeploymentPreflight({
      env: approvedEnv,
      stdout,
      stderr,
      getCallerIdentity: vi.fn().mockResolvedValue({
        Arn: 'arn:aws:iam::123456789012:root'
      })
    });

    await expect(preflight()).resolves.toBe(1);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('root AWS credentials are not allowed'));
    expect(stdout.write).not.toHaveBeenCalledWith(expect.stringContaining('preflight passed'));
  });

  it('documents the required deployment confirmations', () => {
    expect(REQUIRED_DEPLOYMENT_CONFIRMATIONS).toEqual([
      'SAFEFLOW_SIMULATION_ONLY',
      'SAFEFLOW_ACCOUNT_MFA_CONFIRMED',
      'SAFEFLOW_BUDGET_CONFIRMED',
      'SAFEFLOW_DEPLOYMENT_APPROVED'
    ]);
  });
});
