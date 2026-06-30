#!/usr/bin/env node
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

if (isCliEntryPoint(import.meta.url, process.argv[1])) {
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
}

export function resolveEnvironment(argv) {
  const environmentFlag = argv.find((entry) => entry.startsWith('--environment='));

  if (environmentFlag) {
    return environmentFlag.slice('--environment='.length);
  }

  const contextEnvironment = argv.find((entry) => entry.startsWith('safeflowEnvironment='));

  if (contextEnvironment) {
    return contextEnvironment.slice('safeflowEnvironment='.length);
  }

  return null;
}

export function isCliEntryPoint(metaUrl, argvPath) {
  if (!argvPath) return false;

  return pathToFileURL(argvPath).href === metaUrl;
}
