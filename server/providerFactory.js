import OpenAI from 'openai';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { createOpenAiDraftProvider } from './draft/openAiDraftProvider.js';

export function createConfiguredDraftProvider(env = process.env, { log = console.warn } = {}) {
  const hasKey = typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.length > 0;
  let reason;
  if (env.SAFEFLOW_EXTERNAL_AI_ENABLED !== 'true') {
    reason = 'EXTERNAL_AI_FLAG_OFF';
    if (hasKey) log('SAFEFLOW_EXTERNAL_AI_ENABLED is not exactly true; the OpenAI key is being ignored.');
  } else if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    reason = 'SIMULATION_ONLY_NOT_SET';
  } else if (!hasKey) {
    reason = 'OPENAI_KEY_MISSING';
  }
  if (reason) {
    return { provider: deterministicDraftProvider, externalAi: { enabled: false, reason } };
  }

  return {
    provider: createOpenAiDraftProvider({
      client: new OpenAI({ apiKey: env.OPENAI_API_KEY }),
      model: env.OPENAI_MODEL || 'gpt-5.5'
    }),
    externalAi: { enabled: true, reason: 'EXTERNAL_AI_ENABLED' }
  };
}
