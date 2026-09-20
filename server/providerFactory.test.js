import { beforeEach, describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { createOpenAiDraftProvider } from './draft/openAiDraftProvider.js';
import { createConfiguredDraftProvider } from './providerFactory.js';

vi.mock('openai', () => ({ default: vi.fn(function () {}) }));
vi.mock('./draft/openAiDraftProvider.js', () => ({ createOpenAiDraftProvider: vi.fn(() => ({ id: 'openai' })) }));

const key = 'fictional-test-key';
const enabledEnv = { SAFEFLOW_EXTERNAL_AI_ENABLED: 'true', SAFEFLOW_SIMULATION_ONLY: 'true', OPENAI_API_KEY: key };

describe('createConfiguredDraftProvider', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([
    ['empty environment', {}, 'EXTERNAL_AI_FLAG_OFF'],
    ['key only', { OPENAI_API_KEY: key }, 'EXTERNAL_AI_FLAG_OFF'],
    ['missing simulation flag', { SAFEFLOW_EXTERNAL_AI_ENABLED: 'true', OPENAI_API_KEY: key }, 'SIMULATION_ONLY_NOT_SET'],
    ['missing key', { ...enabledEnv, OPENAI_API_KEY: undefined }, 'OPENAI_KEY_MISSING'],
    ['empty key', { ...enabledEnv, OPENAI_API_KEY: '' }, 'OPENAI_KEY_MISSING'],
    ['non-string key', { ...enabledEnv, OPENAI_API_KEY: 123 }, 'OPENAI_KEY_MISSING'],
    ...['TRUE', '1', 'yes', ' true', 'true '].map((value) => ['external flag ' + value, { ...enabledEnv, SAFEFLOW_EXTERNAL_AI_ENABLED: value }, 'EXTERNAL_AI_FLAG_OFF']),
    ...['TRUE', '1', 'yes', ' true', 'true '].map((value) => ['simulation flag ' + value, { ...enabledEnv, SAFEFLOW_SIMULATION_ONLY: value }, 'SIMULATION_ONLY_NOT_SET'])
  ])('keeps external AI off: %s', (_label, env, reason) => {
    const log = vi.fn();
    expect(createConfiguredDraftProvider(env, { log })).toEqual({ provider: deterministicDraftProvider, externalAi: { enabled: false, reason } });
    expect(OpenAI).not.toHaveBeenCalled();
    expect(createOpenAiDraftProvider).not.toHaveBeenCalled();
    if (reason === 'EXTERNAL_AI_FLAG_OFF' && env.OPENAI_API_KEY === key) {
      expect(log).toHaveBeenCalledTimes(1);
      expect(log.mock.calls[0][0]).toContain('SAFEFLOW_EXTERNAL_AI_ENABLED');
      expect(log.mock.calls[0][0]).toContain('key is being ignored');
      expect(log.mock.calls[0][0]).not.toContain(key);
    } else expect(log).not.toHaveBeenCalled();
  });
  it.each([undefined, 'custom-model'])('enables only with all three conditions, model %s', (model) => {
    const log = vi.fn();
    expect(createConfiguredDraftProvider({ ...enabledEnv, OPENAI_MODEL: model }, { log })).toEqual({ provider: { id: 'openai' }, externalAi: { enabled: true, reason: 'EXTERNAL_AI_ENABLED' } });
    expect(OpenAI).toHaveBeenCalledExactlyOnceWith({ apiKey: key });
    expect(createOpenAiDraftProvider).toHaveBeenCalledExactlyOnceWith({ client: expect.any(OpenAI), model: model || 'gpt-5.5' });
    expect(log).not.toHaveBeenCalled();
  });
});
