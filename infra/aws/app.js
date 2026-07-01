#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveEnvironmentProfile } from './environmentProfiles.js';
import { SafeFlowFoundationStack } from './safeflowFoundationStack.js';

const app = new App();
const profileName = app.node.tryGetContext('safeflowEnvironment')
  ?? process.env.SAFEFLOW_ENVIRONMENT
  ?? 'simulation';
const operation = app.node.tryGetContext('safeFlowOperation');
const safeFlowProfile = resolveEnvironmentProfile(profileName, {
  operation,
  allowRestricted: process.env.SAFEFLOW_RESTRICTED_ENVIRONMENT_APPROVED === 'true',
  allowDeployment: process.env.SAFEFLOW_DEPLOYMENT_APPROVED === 'true'
});

new SafeFlowFoundationStack(app, safeFlowProfile.stackId, {
  stackName: safeFlowProfile.stackName,
  safeFlowProfile,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? safeFlowProfile.region
  }
});
