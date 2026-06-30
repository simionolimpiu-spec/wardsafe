import { buildApiUrl, createApiHeaders } from './apiBaseUrl.js';

const DIRECT_IDENTIFIER_FIELD_PATTERN = /\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i;
const SECRET_VALUE_PATTERN = /(postgres:\/\/|\bsk-[A-Za-z0-9_-]{8,}|\barn:aws:[^\s"'}]+)/i;
const PREVIEW_VALIDATION_STATUS = 'not-clinically-validated';

export async function requestSignalTimeline({
  patientId,
  includeMetadata = false,
  fetchImpl = globalThis.fetch,
  env = import.meta.env
} = {}) {
  if (!fetchImpl || !patientId) return null;

  try {
    const response = await fetchImpl(
      buildApiUrl(`/api/simulation/signals?patientId=${encodeURIComponent(patientId)}`, { env }),
      {
        headers: createApiHeaders({ Accept: 'application/json' }, { env })
      }
    );
    if (!response.ok) return null;

    const payload = await response.json();
    if (!isSafeSimulationEnvelope(payload, 'signals', isSafeSignal)) {
      return null;
    }

    return includeMetadata ? payload : payload.signals;
  } catch {
    return null;
  }
}

export async function requestRiskSuggestions({
  patientId,
  includeMetadata = false,
  fetchImpl = globalThis.fetch,
  env = import.meta.env
} = {}) {
  if (!fetchImpl || !patientId) return null;

  try {
    const response = await fetchImpl(
      buildApiUrl(`/api/simulation/risk-suggestions?patientId=${encodeURIComponent(patientId)}`, { env }),
      {
        headers: createApiHeaders({ Accept: 'application/json' }, { env })
      }
    );
    if (!response.ok) return null;

    const payload = await response.json();
    if (!isSafeSimulationEnvelope(payload, 'suggestions', isSafeSuggestion)) {
      return null;
    }

    return includeMetadata ? payload : payload.suggestions;
  } catch {
    return null;
  }
}

export async function recordRiskSuggestionAction({
  suggestionId,
  actionType,
  actionReason,
  actorRef = 'fictional-user-laura-bennett',
  fetchImpl = globalThis.fetch,
  env = import.meta.env
} = {}) {
  if (!fetchImpl || !suggestionId || !actionType || !actionReason) return null;

  const payload = { actionType, actionReason, actorRef };
  if (!isPublicSafe(payload)) return null;

  try {
    const response = await fetchImpl(
      buildApiUrl(`/api/simulation/risk-suggestions/${encodeURIComponent(suggestionId)}/actions`, { env }),
      {
        method: 'POST',
        headers: createApiHeaders({ 'Content-Type': 'application/json' }, { env }),
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

function isSafeSimulationEnvelope(payload, itemsKey, itemValidator) {
  return (
    isPublicSafe(payload) &&
    payload?.product === 'SafeFlow' &&
    payload?.mode === 'simulation' &&
    payload?.simulationOnly === true &&
    payload?.clinicalUse === false &&
    payload?.validationStatus === PREVIEW_VALIDATION_STATUS &&
    hasPreviewExplanation(payload?.explanation) &&
    typeof payload?.provider === 'string' &&
    typeof payload?.source === 'string' &&
    Array.isArray(payload?.[itemsKey]) &&
    payload[itemsKey].every(itemValidator)
  );
}

function isPublicSafe(value) {
  const serialized = JSON.stringify(value ?? {});
  return !SECRET_VALUE_PATTERN.test(serialized) && !hasDirectIdentifierField(value);
}

function hasPreviewExplanation(value) {
  return typeof value === 'string' &&
    /preview only/i.test(value) &&
    /not clinically validated/i.test(value) &&
    /not for clinical decision-making/i.test(value);
}

function hasDirectIdentifierField(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => hasDirectIdentifierField(item));

  return Object.entries(value).some(([key, nestedValue]) =>
    DIRECT_IDENTIFIER_FIELD_PATTERN.test(key) || hasDirectIdentifierField(nestedValue)
  );
}
