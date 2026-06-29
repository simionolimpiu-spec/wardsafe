#!/usr/bin/env node
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const environment = resolveEnvironment(process.argv.slice(2));
const outputDir = join(tmpdir(), 'safeflow-cdk', environment ?? 'default');
const cdkCli = join(process.cwd(), 'node_modules', 'aws-cdk', 'bin', 'cdk');

rmSync(outputDir, { recursive: true, force: true });

const args = [
  cdkCli,
  'synth',
  '--quiet',
  '--output',
  outputDir,
  '-c',
  'safeFlowOperation=synth'
];

if (environment) {
  args.push('-c', `safeflowEnvironment=${environment}`);
}

const result = spawnSync(process.execPath, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit'
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);

function resolveEnvironment(argv) {
  const environmentFlag = argv.find((entry) => entry.startsWith('--environment='));

  if (environmentFlag) {
    return environmentFlag.slice('--environment='.length);
  }

  return null;
}
