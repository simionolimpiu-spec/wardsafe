#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveEnvironmentProfile } from './environmentProfiles.js';
import { SafeFlowFoundationStack } from './safeflowFoundationStack.js';

const app = new App();
const profileName = app.node.tryGetContext('safeflowEnvironment')
  ?? process.env.SAFEFLOW_ENVIRONMENT
  ?? 'simulation';
const operation = app.node.tryGetContext('safeFlowOperation');
const previewAccessToken = process.env.SAFEFLOW_PREVIEW_ACCESS_TOKEN;

if (operation === 'deploy' && !isUsablePreviewAccessToken(previewAccessToken)) {
  throw new Error('SAFEFLOW_PREVIEW_ACCESS_TOKEN must be set to a non-placeholder value at least 24 characters long before public preview deploy or diff.');
}

const safeFlowProfile = resolveEnvironmentProfile(profileName, {
  operation,
  allowRestricted: process.env.SAFEFLOW_RESTRICTED_ENVIRONMENT_APPROVED === 'true',
  allowDeployment: process.env.SAFEFLOW_DEPLOYMENT_APPROVED === 'true'
});

new SafeFlowFoundationStack(app, safeFlowProfile.stackId, {
  stackName: safeFlowProfile.stackName,
  safeFlowProfile,
  publicPreviewOrigin: process.env.SAFEFLOW_ALLOWED_ORIGIN,
  previewAccessToken,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? safeFlowProfile.region
  }
});

function isUsablePreviewAccessToken(value) {
  const token = typeof value === 'string' ? value.trim() : '';

  return token.length >= 24 && !/^(changeme|placeholder|example|test|token|replace(?:-.+)?)$/i.test(token);
}
