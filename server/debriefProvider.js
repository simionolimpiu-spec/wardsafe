import { buildDebriefPrompt, draftDeterministicDebrief, getDebriefContext, validateDebriefLines } from '../src/domain/aiDebrief.js';

// No external adapter is shipped or invoked. Tests can inject a bounded provider.
export function debriefProviderStatus({ env = {}, liveProvider } = {}) {
  const reasons = [];
  if (env.SAFEFLOW_LIVE_AI !== 'true') reasons.push('SAFEFLOW_LIVE_AI is not enabled');
  if (typeof env.OPENAI_API_KEY !== 'string' || !env.OPENAI_API_KEY.trim()) reasons.push('no server API key is configured');
  if (typeof liveProvider?.draft !== 'function') reasons.push('no live debrief adapter is installed');
  return { liveEnabled: reasons.length === 0, mode: reasons.length ? 'rule-based' : 'live',
    reason: reasons.length ? `Live AI is off: ${reasons.join('; ')}. Rule-based drafting is available.` : 'A server debrief provider is configured. Human review is required.', simulationOnly: true };
}

export async function createServerDebrief(input, { env = {}, liveProvider, timeoutMs = 10000 } = {}) {
  const context = getDebriefContext(input);
  const status = debriefProviderStatus({ env, liveProvider });
  if (!status.liveEnabled) return { ...draftDeterministicDebrief(input), providerStatus: status };
  const abort = new AbortController();
  let timer;
  try {
    const response = await Promise.race([
      Promise.resolve().then(() => liveProvider.draft({ prompt: buildDebriefPrompt(input), signal: abort.signal })),
      new Promise((_, reject) => { timer = setTimeout(() => { abort.abort(); reject(new Error('Provider timeout')); }, timeoutMs); })
    ]);
    if (!response || typeof response !== 'object' || Array.isArray(response)
      || Object.keys(response).length !== 1 || !Object.hasOwn(response, 'lines')) throw new Error('Invalid provider envelope');
    // Reconstruct the envelope with server-owned sources; reject the whole draft on any failed line.
    return { ...context, provider: 'server-provider', lines: validateDebriefLines(response.lines, context), simulationOnly: true, providerStatus: status };
  } catch {
    throw new Error('Debrief provider response rejected or unavailable. No live draft was shown.');
  } finally { clearTimeout(timer); }
}
