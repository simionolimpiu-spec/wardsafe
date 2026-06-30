import { createSbarDraft } from '../domain/draftProvider.js';
import { buildApiUrl, createApiHeaders } from './apiBaseUrl.js';

export async function requestSbarDraft({
  patient,
  flag,
  fetchImpl = globalThis.fetch,
  env = import.meta.env
}) {
  const fallbackDraft = createSbarDraft({ patient, flag });
  if (!fetchImpl) {
    return fallbackDraft;
  }

  try {
    const response = await fetchImpl(buildApiUrl('/api/drafts/sbar', { env }), {
      method: 'POST',
      headers: createApiHeaders({ 'Content-Type': 'application/json' }, { env }),
      body: JSON.stringify({ patientId: patient.id })
    });
    if (!response.ok) {
      return fallbackDraft;
    }
    const payload = await response.json();
    return payload?.draft ?? fallbackDraft;
  } catch {
    return fallbackDraft;
  }
}
