import { describe, expect, it } from 'vitest';
import { readDeploymentApproval } from './deploymentApproval.js';

describe('SafeFlow deployment approval guard', () => {
  it('defaults to not approved when SAFEFLOW_DEPLOYMENT_APPROVED is unset', () => {
    const approval = readDeploymentApproval({});

    expect(approval).toMatchObject({
      approved: false
    });
    expect(approval.message).toContain('SAFEFLOW_DEPLOYMENT_APPROVED');
    expect(approval.message).toContain('unset');
    expect(approval.message).toContain('not approved');
  });

  it('only approves the exact string true', () => {
    expect(readDeploymentApproval({ SAFEFLOW_DEPLOYMENT_APPROVED: 'true' })).toMatchObject({
      approved: true
    });
    expect(readDeploymentApproval({ SAFEFLOW_DEPLOYMENT_APPROVED: 'false' })).toMatchObject({
      approved: false
    });
    expect(readDeploymentApproval({ SAFEFLOW_DEPLOYMENT_APPROVED: 'true ' })).toMatchObject({
      approved: false
    });
  });
});
