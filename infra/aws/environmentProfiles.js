function createProfile(profile) {
  const database = Object.freeze({ ...profile.database });
  const requiredApprovals = Object.freeze([...(profile.requiredApprovals ?? [])]);
  const resourcePrefix = `safeflow-${profile.name}`;

  return Object.freeze({
    ...profile,
    resourcePrefix,
    stackId: `SafeFlowFoundation-${profile.name}`,
    stackName: `${resourcePrefix}-foundation`,
    database,
    requiredApprovals
  });
}

export const environmentProfiles = Object.freeze({
  dev: createProfile({
    name: 'dev',
    region: 'eu-west-2',
    simulationOnly: true,
    dataClassification: 'synthetic-only',
    deploymentApproved: false,
    restricted: false,
    database: {
      backupRetentionDays: 1,
      preferredBackupWindow: '01:00-02:00',
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: false
    }
  }),
  simulation: createProfile({
    name: 'simulation',
    region: 'eu-west-2',
    simulationOnly: true,
    dataClassification: 'synthetic-only',
    deploymentApproved: true,
    restricted: false,
    database: {
      backupRetentionDays: 7,
      preferredBackupWindow: '02:00-03:00',
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: false
    }
  }),
  pilot: createProfile({
    name: 'pilot',
    region: 'eu-west-2',
    simulationOnly: true,
    dataClassification: 'synthetic-only',
    deploymentApproved: false,
    restricted: true,
    requiredApprovals: [
      'clinical-safety',
      'information-governance',
      'data-protection',
      'hosting-and-cost'
    ],
    database: {
      backupRetentionDays: 14,
      preferredBackupWindow: '03:00-04:00',
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: true
    }
  })
});

export function resolveEnvironmentProfile(name, {
  operation,
  allowRestricted = false,
  allowDeployment = false
} = {}) {
  const profile = environmentProfiles[name];

  if (!profile) {
    throw new Error(`Unknown SafeFlow environment: ${name}`);
  }

  if (!['synth', 'deploy'].includes(operation)) {
    throw new Error('SafeFlow operation must be synth or deploy.');
  }

  if (profile.restricted && !allowRestricted) {
    throw new Error(`SafeFlow environment ${name} is restricted and not approved for synthesis or deployment.`);
  }

  if (operation === 'deploy' && !profile.deploymentApproved) {
    throw new Error(`SafeFlow environment ${name} is not approved for deployment.`);
  }

  if (operation === 'deploy' && !allowDeployment) {
    throw new Error('SafeFlow deployment gate is not set.');
  }

  return profile;
}
