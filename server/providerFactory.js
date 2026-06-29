import OpenAI from 'openai';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { createOpenAiDraftProvider } from './draft/openAiDraftProvider.js';

export function createConfiguredDraftProvider(env = process.env) {
  if (!env.OPENAI_API_KEY) {
    return deterministicDraftProvider;
  }

  return createOpenAiDraftProvider({
    client: new OpenAI({ apiKey: env.OPENAI_API_KEY }),
    model: env.OPENAI_MODEL || 'gpt-5.5'
  });
}
