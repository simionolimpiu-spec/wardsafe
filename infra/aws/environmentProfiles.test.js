import { describe, expect, it } from 'vitest';
import { environmentProfiles, resolveEnvironmentProfile } from './environmentProfiles.js';

describe('SafeFlow AWS environment profiles', () => {
  it('defines dev, simulation and restricted future pilot profiles', () => {
    expect(Object.keys(environmentProfiles)).toEqual(['dev', 'simulation', 'pilot']);
    expect(environmentProfiles.dev).toMatchObject({
      name: 'dev',
      stackName: 'safeflow-dev-foundation',
      resourcePrefix: 'safeflow-dev',
      simulationOnly: true,
      dataClassification: 'synthetic-only'
    });
    expect(environmentProfiles.simulation).toMatchObject({
      name: 'simulation',
      stackName: 'safeflow-simulation-foundation',
      simulationOnly: true,
      deploymentApproved: true
    });
    expect(environmentProfiles.pilot).toMatchObject({
      name: 'pilot',
      restricted: true,
      deploymentApproved: false
    });
  });

  it('rejects unknown environment names', () => {
    expect(() => resolveEnvironmentProfile('production', { operation: 'synth' })).toThrow(/Unknown SafeFlow environment/);
  });

  it('blocks the pilot profile unless restricted-environment approval is explicit', () => {
    expect(() => resolveEnvironmentProfile('pilot', { operation: 'synth' })).toThrow(/restricted and not approved/);
    expect(resolveEnvironmentProfile('pilot', {
      operation: 'synth',
      allowRestricted: true
    })).toEqual(environmentProfiles.pilot);
  });

  it('requires an explicit synth or deploy operation', () => {
    expect(() => resolveEnvironmentProfile('simulation')).toThrow(/SafeFlow operation must be synth or deploy/);
  });

  it('blocks unapproved environments from deploy operation', () => {
    expect(() => resolveEnvironmentProfile('dev', {
      operation: 'deploy',
      allowDeployment: true
    })).toThrow(/dev is not approved for deployment/);
    expect(() => resolveEnvironmentProfile('pilot', {
      operation: 'deploy',
      allowRestricted: true,
      allowDeployment: true
    })).toThrow(/pilot is not approved for deployment/);
  });

  it('requires a second explicit gate for the deployment-approved simulation profile', () => {
    expect(() => resolveEnvironmentProfile('simulation', {
      operation: 'deploy'
    })).toThrow(/deployment gate is not set/);
    expect(resolveEnvironmentProfile('simulation', {
      operation: 'deploy',
      allowDeployment: true
    })).toEqual(environmentProfiles.simulation);
  });

  it('returns an immutable profile to prevent runtime mutation', () => {
    const profile = resolveEnvironmentProfile('simulation', { operation: 'synth' });

    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.database)).toBe(true);
  });
});
