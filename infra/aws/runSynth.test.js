import { describe, expect, it } from 'vitest';
import os from 'node:os';
import { resolveEnvironment, resolveOutputRoot } from './runSynth.js';

describe('SafeFlow CDK synth wrapper', () => {
  it('recognizes the pilot environment from cdk-style context args', () => {
    expect(resolveEnvironment(['-c', 'safeflowEnvironment=pilot'])).toBe('pilot');
    expect(resolveEnvironment(['--environment=simulation'])).toBe('simulation');
  });

  it('uses the runner temp root when available', () => {
    expect(resolveOutputRoot({ RUNNER_TEMP: '/runner/temp' })).toBe('/runner/temp');
  });

  it('falls back to the local temp root when runner temp is absent', () => {
    expect(resolveOutputRoot({})).toBe(os.tmpdir());
  });
});
