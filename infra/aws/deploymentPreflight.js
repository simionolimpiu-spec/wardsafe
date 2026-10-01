import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readDeploymentApproval } from './deploymentApproval.js';

const execFileAsync = promisify(execFile);
const MIN_PREVIEW_ACCESS_TOKEN_LENGTH = 24;

export const REQUIRED_DEPLOYMENT_CONFIRMATIONS = Object.freeze([
  'SAFEFLOW_SIMULATION_ONLY',
  'SAFEFLOW_ACCOUNT_MFA_CONFIRMED',
  'SAFEFLOW_BUDGET_CONFIRMED',
  'SAFEFLOW_DEPLOYMENT_APPROVED'
]);

export function createDeploymentPreflight({
  env = process.env,
  stdout = process.stdout,
  stderr = process.stderr,
  getCallerIdentity = () => getAwsCallerIdentity({ env })
} = {}) {
  return async function deploymentPreflight() {
    const errors = validateDeploymentEnvironment(env);

    if (errors.length === 0) {
      try {
        const identity = await getCallerIdentity();
        if (isRootIdentity(identity?.Arn)) {
          errors.push('root AWS credentials are not allowed for SafeFlow CDK diff or deploy. Configure a non-root IAM or IAM Identity Center profile.');
        }
      } catch (error) {
        errors.push(`Unable to verify AWS caller identity: ${error.message}`);
      }
    }

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
  const deploymentApproval = readDeploymentApproval(env);

  if (region !== 'eu-west-2') {
    errors.push('CDK_DEFAULT_REGION must be eu-west-2 for the SafeFlow London-region simulation deployment.');
  }

  if ((env.SAFEFLOW_ENVIRONMENT || 'simulation') !== 'simulation') {
    errors.push('SAFEFLOW_ENVIRONMENT must be simulation for the first AWS deployment.');
  }

  for (const key of REQUIRED_DEPLOYMENT_CONFIRMATIONS) {
    if (key === 'SAFEFLOW_DEPLOYMENT_APPROVED') {
      if (!deploymentApproval.approved) {
        errors.push(deploymentApproval.message);
      }
      continue;
    }

    if (env[key] !== 'true') {
      errors.push(`${key} must be true before AWS deploy-prep or deploy commands run.`);
    }
  }

  if (!env.AWS_PROFILE && !env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_PROFILE or AWS_ACCESS_KEY_ID must be set for local AWS CLI/CDK authentication.');
  }

  const previewAccessToken = typeof env.SAFEFLOW_PREVIEW_ACCESS_TOKEN === 'string'
    ? env.SAFEFLOW_PREVIEW_ACCESS_TOKEN.trim()
    : '';

  if (
    previewAccessToken.length < MIN_PREVIEW_ACCESS_TOKEN_LENGTH ||
    /^(changeme|placeholder|example|test|token|replace(?:-.+)?)$/i.test(previewAccessToken)
  ) {
    errors.push(`SAFEFLOW_PREVIEW_ACCESS_TOKEN must be set to a non-placeholder value at least ${MIN_PREVIEW_ACCESS_TOKEN_LENGTH} characters long before public preview deploy.`);
  }

  const previewOriginError = validatePreviewOrigin(env.SAFEFLOW_ALLOWED_ORIGIN);
  if (previewOriginError) {
    errors.push(previewOriginError);
  }

  return errors;
}

export async function getAwsCallerIdentity({ env = process.env } = {}) {
  const awsExecutable = env.AWS_CLI_PATH || 'aws';
  const args = ['sts', 'get-caller-identity', '--output', 'json'];

  if (env.AWS_PROFILE) {
    args.push('--profile', env.AWS_PROFILE);
  }

  const region = env.CDK_DEFAULT_REGION || env.AWS_REGION;
  if (region) {
    args.push('--region', region);
  }

  const { stdout } = await execFileAsync(awsExecutable, args, {
    env,
    windowsHide: true
  });

  return JSON.parse(stdout);
}

function isRootIdentity(arn) {
  return typeof arn === 'string' && /:root$/.test(arn);
}

function isCliEntryPoint(metaUrl, argvPath) {
  return argvPath ? pathToFileURL(argvPath).href === metaUrl : false;
}

function validatePreviewOrigin(allowedOrigin) {
  const configuredOrigin = typeof allowedOrigin === 'string'
    ? allowedOrigin.trim()
    : '';

  if (!configuredOrigin) {
    return 'SAFEFLOW_ALLOWED_ORIGIN must be set to a hosted preview origin before public preview deploy.';
  }

  try {
    const url = new URL(configuredOrigin);
    const normalizedHost = url.hostname.toLowerCase();

    if (normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
      return 'SAFEFLOW_ALLOWED_ORIGIN must point to a hosted preview origin, not localhost or 127.0.0.1.';
    }
  } catch {
    return 'SAFEFLOW_ALLOWED_ORIGIN must be a valid hosted preview origin URL before public preview deploy.';
  }

  return null;
}

if (isCliEntryPoint(import.meta.url, process.argv[1])) {
  const exitCode = await createDeploymentPreflight()();
  process.exitCode = exitCode;
}
