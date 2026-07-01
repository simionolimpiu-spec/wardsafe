import { createSbarDraft } from '../domain/draftProvider.js';

export async function requestSbarDraft({ patient, flag, fetchImpl = globalThis.fetch }) {
  const fallbackDraft = createSbarDraft({ patient, flag });
  if (!fetchImpl) {
    return fallbackDraft;
  }

  try {
    const response = await fetchImpl('/api/drafts/sbar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
