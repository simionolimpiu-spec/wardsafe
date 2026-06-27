const DIRECT_IDENTIFIER_FIELD_PATTERN = /\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i;
const SECRET_VALUE_PATTERN = /(postgres:\/\/|\bsk-[A-Za-z0-9_-]{8,}|\barn:aws:[^\s"'}]+)/i;

export async function requestSignalTimeline({ patientId, fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl || !patientId) return null;

  try {
    const response = await fetchImpl(`/api/simulation/signals?patientId=${encodeURIComponent(patientId)}`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;

    const payload = await response.json();
    if (
      !isPublicSafe(payload) ||
      payload?.product !== 'SafeFlow' ||
      payload.simulationOnly !== true ||
      !Array.isArray(payload.signals) ||
      !payload.signals.every(isSafeSignal)
    ) {
      return null;
    }

    return payload.signals;
  } catch {
    return null;
  }
}

export async function requestRiskSuggestions({ patientId, fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl || !patientId) return null;

  try {
    const response = await fetchImpl(`/api/simulation/risk-suggestions?patientId=${encodeURIComponent(patientId)}`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;

    const payload = await response.json();
    if (
      !isPublicSafe(payload) ||
      payload?.product !== 'SafeFlow' ||
      payload.simulationOnly !== true ||
      !Array.isArray(payload.suggestions) ||
      !payload.suggestions.every(isSafeSuggestion)
    ) {
      return null;
    }

    return payload.suggestions;
  } catch {
    return null;
  }
}

export async function recordRiskSuggestionAction({
  suggestionId,
  actionType,
  actionReason,
  actorRef = 'fictional-user-laura-bennett',
  fetchImpl = globalThis.fetch
} = {}) {
  if (!fetchImpl || !suggestionId || !actionType || !actionReason) return null;

  const payload = { actionType, actionReason, actorRef };
  if (!isPublicSafe(payload)) return null;

  try {
    const response = await fetchImpl(
      `/api/simulation/risk-suggestions/${encodeURIComponent(suggestionId)}/actions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    if (!response.ok) return null;

    const body = await response.json();
    const action = body?.action;
    if (!isPublicSafe(action) || action?.suggestionId !== suggestionId || typeof action.status !== 'string') {
      return null;
    }

    return action;
  } catch {
    return null;
  }
}

function isSafeSignal(signal) {
  return (
    isPublicSafe(signal) &&
    signal?.simulationOnly === true &&
    typeof signal.signalId === 'string' &&
    typeof signal.syntheticPatientRef === 'string'
  );
}

function isSafeSuggestion(suggestion) {
  return (
    isPublicSafe(suggestion) &&
    suggestion?.simulationOnly === true &&
    suggestion.requiresHumanReview === true &&
    typeof suggestion.suggestionId === 'string' &&
    typeof suggestion.syntheticPatientRef === 'string'
  );
}

function isPublicSafe(value) {
  const serialized = JSON.stringify(value ?? {});
  return !SECRET_VALUE_PATTERN.test(serialized) && !hasDirectIdentifierField(value);
}

function hasDirectIdentifierField(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => hasDirectIdentifierField(item));

  return Object.entries(value).some(([key, nestedValue]) =>
    DIRECT_IDENTIFIER_FIELD_PATTERN.test(key) || hasDirectIdentifierField(nestedValue)
  );
}
