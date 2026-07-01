const DIRECT_IDENTIFIER_FIELD_PATTERN = /\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i;
const SECRET_VALUE_PATTERN = /(postgres:\/\/|\bsk-[A-Za-z0-9_-]{8,})/i;

export async function requestSimulationAuditEvent({
  patientId,
  eventType,
  eventSummary,
  actorRole = 'simulation_user',
  sourceTable,
  metadata = {},
  fetchImpl = globalThis.fetch
} = {}) {
  const payload = {
    patientId,
    eventType,
    eventSummary,
    actorRole,
    ...(sourceTable ? { sourceTable } : {}),
    metadata
  };

  if (!fetchImpl || !isPublicSafe(payload)) return null;

  try {
    const response = await fetchImpl('/api/simulation/audit-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;

    const body = await response.json();
    const event = body?.event;
    if (
      !isPublicSafe(event) ||
      event?.product !== 'SafeFlow' ||
      event.simulationOnly !== true ||
      event.eventType !== eventType ||
      typeof event.syntheticPatientRef !== 'string'
    ) {
      return null;
    }

    return event;
  } catch {
    return null;
  }
}

export async function requestSimulationAuditEvents({ fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl) return null;

  try {
    const response = await fetchImpl('/api/simulation/audit-events', {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;

    const payload = await response.json();
    if (
      !isPublicSafe(payload) ||
      payload?.product !== 'SafeFlow' ||
      payload.simulationOnly !== true ||
      payload.safetyBoundary?.noLivePatientData !== true ||
      payload.safetyBoundary?.directCareIdentifiers !== false ||
      !Array.isArray(payload.events) ||
      !payload.events.every(isSafeSimulationAuditEvent)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isSafeSimulationAuditEvent(event) {
  return (
    isPublicSafe(event) &&
    event?.product === 'SafeFlow' &&
    event.simulationOnly === true &&
    typeof event.syntheticPatientRef === 'string' &&
    typeof event.eventType === 'string' &&
    typeof event.eventSummary === 'string'
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
