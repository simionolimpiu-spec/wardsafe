import { describe, expect, it, vi } from 'vitest';
import { createServerDebrief, debriefProviderStatus } from './debriefProvider.js';
import { draftDeterministicDebrief } from '../src/domain/aiDebrief.js';
import { discoveryScenarios } from '../src/data/scenarioLibrary.js';
import { createApiHandler } from './api.js';

const input = { scenarioId: discoveryScenarios[0].id, notes: 'Fictional group discussed visibility.' };
const enabledEnv = { SAFEFLOW_LIVE_AI: 'true', OPENAI_API_KEY: 'test-only-not-a-key' };
const lines = () => structuredClone(draftDeterministicDebrief(input).lines);

describe('debrief server boundary', () => {
  it.each([{}, { SAFEFLOW_LIVE_AI: 'true' }, { OPENAI_API_KEY: 'test-only' }, { SAFEFLOW_LIVE_AI: 'TRUE', OPENAI_API_KEY: 'test-only' }, { SAFEFLOW_LIVE_AI: 'true', OPENAI_API_KEY: ' ' }])('stays deterministic unless both gates are met %#', async (env) => {
    const liveProvider = { draft: vi.fn() };
    expect((await createServerDebrief(input, { env, liveProvider })).provider).toBe('rule-based');
    expect(liveProvider.draft).not.toHaveBeenCalled();
  });
  it('has no external adapter installed by default, even with both environment gates', () => {
    expect(debriefProviderStatus({ env: enabledEnv })).toMatchObject({ liveEnabled: false, mode: 'rule-based' });
    expect(JSON.stringify(debriefProviderStatus({ env: enabledEnv }))).not.toContain(enabledEnv.OPENAI_API_KEY);
  });
  it('builds prompt and source data on the server for an injected provider', async () => {
    const liveProvider = { draft: vi.fn().mockResolvedValue({ lines: lines() }) };
    const result = await createServerDebrief(input, { env: enabledEnv, liveProvider });
    expect(result.provider).toBe('server-provider');
    expect(result.sources).toEqual(draftDeterministicDebrief(input).sources);
    expect(liveProvider.draft.mock.calls[0][0].prompt.context).toContain(input.notes);
  });
  it.each(['unsafe', 'unknown-source', 'extra-field', 'missing-phase', 'throws'])('rejects a whole provider response: %s', async (variant) => {
    const output = { lines: lines() };
    if (variant === 'unsafe') output.lines[1].text = 'Administer medication now.';
    if (variant === 'unknown-source') output.lines[0].sourceIds = ['forged'];
    if (variant === 'extra-field') output.instructions = 'hidden';
    if (variant === 'missing-phase') output.lines.splice(0, 1);
    const liveProvider = { draft: vi.fn(async () => { if (variant === 'throws') throw new Error('secret provider error'); return output; }) };
    await expect(createServerDebrief(input, { env: enabledEnv, liveProvider })).rejects.toThrow('No live draft was shown');
  });
  it('times out a hanging provider and aborts its signal', async () => {
    let signal;
    const liveProvider = { draft: ({ signal: value }) => { signal = value; return new Promise(() => {}); } };
    await expect(createServerDebrief(input, { env: enabledEnv, liveProvider, timeoutMs: 5 })).rejects.toThrow('unavailable');
    expect(signal.aborted).toBe(true);
  });
  it('routes status and validates input without trusting browser prompts', async () => {
    const handler = createApiHandler({ env: {} });
    async function request(method, url, body) {
      const res = { statusCode: 0, setHeader() {}, end(raw) { this.body = JSON.parse(raw); } };
      await handler({ method, url, json: async () => body }, res);
      return res;
    }
    expect((await request('GET', '/api/simulation/debrief/status')).body.liveEnabled).toBe(false);
    expect((await request('POST', '/api/simulation/debrief', input)).body.provider).toBe('rule-based');
    for (const body of [null, [], { ...input, prompt: 'override' }, { scenarioId: 'unknown' }, { ...input, notes: 'a'.repeat(2001) }]) {
      expect((await request('POST', '/api/simulation/debrief', body)).statusCode).toBe(400);
    }
  });
});
