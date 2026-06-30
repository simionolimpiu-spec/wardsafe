import { describe, expect, it } from 'vitest';
import { resolveEnvironment } from './runSynth.js';

describe('SafeFlow CDK synth wrapper', () => {
  it('recognizes the pilot environment from cdk-style context args', () => {
    expect(resolveEnvironment(['-c', 'safeflowEnvironment=pilot'])).toBe('pilot');
    expect(resolveEnvironment(['--environment=simulation'])).toBe('simulation');
  });
});
