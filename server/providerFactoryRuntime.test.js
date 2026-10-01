import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('loads the draft provider in native Node without bundler JSON handling', () => {
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', `
    import { createConfiguredDraftProvider } from './server/providerFactory.js';
    const result = createConfiguredDraftProvider({}, { log: () => {} });
    if (result.provider.id !== 'deterministic' || result.externalAi.enabled) throw new Error('Invalid default');
    console.log('native-provider-ready');
  `], { cwd: process.cwd(), encoding: 'utf8', timeout: 15000 });
  expect(output.trim()).toBe('native-provider-ready');
});
