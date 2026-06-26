import { pathToFileURL } from 'node:url';

export const REQUIRED_DEPLOYMENT_CONFIRMATIONS = Object.freeze([
  'SAFEFLOW_SIMULATION_ONLY',
  'SAFEFLOW_ACCOUNT_MFA_CONFIRMED',
  'SAFEFLOW_BUDGET_CONFIRMED',
  'SAFEFLOW_DEPLOYMENT_APPROVED'
]);

export function createDeploymentPreflight({
  env = process.env,
  stdout = process.stdout,
  stderr = process.stderr
} = {}) {
  return async function deploymentPreflight() {
    const errors = validateDeploymentEnvironment(env);

    if (errors.length > 0) {
      for (const error of errors) {
        stderr.write(`${error}\n`);
      }
      return 1;
    }

    stdout.write('SafeFlow AWS deployment preflight passed.\n');
    stdout.write(`Environment: ${env.SAFEFLOW_ENVIRONMENT || 'simulation'}\n`);
    stdout.write(`Region: ${env.CDK_DEFAULT_REGION || env.AWS_REGION}\n`);
    stdout.write('Mode: simulation-only synthetic data.\n');
    return 0;
  };
}

export function validateDeploymentEnvironment(env = process.env) {
  const errors = [];
  const region = env.CDK_DEFAULT_REGION || env.AWS_REGION;

  if (region !== 'eu-west-2') {
    errors.push('CDK_DEFAULT_REGION must be eu-west-2 for the SafeFlow London-region simulation deployment.');
  }

  if ((env.SAFEFLOW_ENVIRONMENT || 'simulation') !== 'simulation') {
    errors.push('SAFEFLOW_ENVIRONMENT must be simulation for the first AWS deployment.');
  }

  for (const key of REQUIRED_DEPLOYMENT_CONFIRMATIONS) {
    if (env[key] !== 'true') {
      errors.push(`${key} must be true before AWS deploy-prep or deploy commands run.`);
    }
  }

  if (!env.AWS_PROFILE && !env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_PROFILE or AWS_ACCESS_KEY_ID must be set for local AWS CLI/CDK authentication.');
  }

  return errors;
}

function isCliEntryPoint(metaUrl, argvPath) {
  return argvPath ? pathToFileURL(argvPath).href === metaUrl : false;
}

if (isCliEntryPoint(import.meta.url, process.argv[1])) {
  const exitCode = await createDeploymentPreflight()();
  process.exitCode = exitCode;
}
