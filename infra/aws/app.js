#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { SafeFlowFoundationStack } from './safeflowFoundationStack.js';

const app = new App();

new SafeFlowFoundationStack(app, 'SafeFlowFoundationStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-2'
  }
});
