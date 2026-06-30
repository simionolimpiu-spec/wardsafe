import { pathToFileURL } from 'node:url';
import { PREVIEW_ACCESS_TOKEN_HEADER } from '../../server/corsConfig.js';

const DIRECT_IDENTIFIER_FIELD_PATTERN = /\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i;
const SECRET_VALUE_PATTERN = /(postgres(?:ql)?:\/\/|\bsk-[A-Za-z0-9_-]{8,}|\barn:aws:[^\s"'}]+|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;
const DEFAULT_PREVIEW_GATE_EXPECTATION = true;
const PREVIEW_VALIDATION_STATUS = 'not-clinically-validated';

export async function runPreviewApiSmoke({
  baseUrl = resolvePreviewApiUrl(process.env),
  previewAccessToken = normaliseText(process.env.SAFEFLOW_PREVIEW_ACCESS_TOKEN),
  expectPreviewAccessGate = resolvePreviewGateExpectation(process.env),
  fetchImpl = globalThis.fetch,
  log = console.log
} = {}) {
  const normalizedBaseUrl = normaliseBaseUrl(baseUrl);

  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch implementation is required for hosted preview smoke checks.');
  }

  if (expectPreviewAccessGate && !previewAccessToken) {
    throw new Error('SAFEFLOW_PREVIEW_ACCESS_TOKEN must be set before running the gated hosted preview smoke.');
  }

  if (expectPreviewAccessGate) {
    const unauthorized = await requestJson({
      baseUrl: normalizedBaseUrl,
      path: '/api/health',
      fetchImpl,
      expectedStatuses: [401]
    });

    if (!/preview access token required/i.test(String(unauthorized.payload?.error ?? ''))) {
      throw new Error('/api/health did not reject missing preview token with the expected error.');
    }
    log('/api/health preview gate rejects missing token');
  }

  const previewHeaders = previewAccessToken
    ? { [PREVIEW_ACCESS_TOKEN_HEADER]: previewAccessToken }
    : {};

  const health = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/health',
    headers: previewHeaders,
    fetchImpl
  });
  assertPreviewCors(health, '/api/health');
  assertHostedHealth(health.payload);
  assertSimulationSafe(health.payload, '/api/health');
  log(`/api/health ${health.payload.environment ?? 'simulation'}`);

  const workspace = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/simulation/workspace',
    headers: previewHeaders,
    fetchImpl
  });
  assertSimulationAvailabilityContract(workspace.payload, '/api/simulation/workspace');
  if (!workspace.payload.workspace || typeof workspace.payload.workspace !== 'object') {
    throw new Error('/api/simulation/workspace did not return a workspace object.');
  }
  assertSimulationSafe(workspace.payload, '/api/simulation/workspace');
  log(`/api/simulation/workspace ${workspace.payload.source ?? 'unknown-source'}`);

  const readiness = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/simulation/readiness',
    headers: previewHeaders,
    fetchImpl
  });
  assertReadinessContract(readiness.payload, '/api/simulation/readiness');
  assertReadinessProviderMetadata(readiness.payload);
  if (readiness.payload.migrations?.approved !== true) {
    throw new Error('/api/simulation/readiness did not report approved simulation migrations.');
  }
  if (readiness.payload.database?.guardedBySimulationOnly !== true) {
    throw new Error('/api/simulation/readiness did not confirm simulation-only database guardrails.');
  }
  assertSimulationSafe(readiness.payload, '/api/simulation/readiness');
  log('/api/simulation/readiness approved');

  const signals = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/simulation/signals',
    headers: previewHeaders,
    fetchImpl
  });
  assertSimulationOutputContract(signals.payload, '/api/simulation/signals');
  if (!Array.isArray(signals.payload.signals)) {
    throw new Error('/api/simulation/signals did not return a signal array.');
  }
  assertSimulationSafe(signals.payload, '/api/simulation/signals');
  log(`/api/simulation/signals ${signals.payload.provider} ${signals.payload.signals.length}`);

  const suggestions = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/simulation/risk-suggestions',
    headers: previewHeaders,
    fetchImpl
  });
  assertSimulationOutputContract(suggestions.payload, '/api/simulation/risk-suggestions');
  if (!Array.isArray(suggestions.payload.suggestions)) {
    throw new Error('/api/simulation/risk-suggestions did not return a suggestion array.');
  }
  assertSimulationSafe(suggestions.payload, '/api/simulation/risk-suggestions');
  log(`/api/simulation/risk-suggestions ${suggestions.payload.provider} ${suggestions.payload.suggestions.length}`);

  const auditRead = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/simulation/audit-events',
    headers: previewHeaders,
    fetchImpl
  });
  assertSimulationAvailabilityContract(auditRead.payload, '/api/simulation/audit-events');
  if (!Array.isArray(auditRead.payload.events)) {
    throw new Error('/api/simulation/audit-events did not return an event array.');
  }
  assertSimulationSafe(auditRead.payload, '/api/simulation/audit-events');
  log(`/api/simulation/audit-events read ${auditRead.payload.source ?? 'unknown-source'}`);

  const auditWrite = await requestJson({
    baseUrl: normalizedBaseUrl,
    path: '/api/simulation/audit-events',
    method: 'POST',
    headers: previewHeaders,
    body: {
      patientId: 'DCU-031',
      eventType: 'preview.smoke.completed',
      eventSummary: 'Fictional hosted preview smoke completed',
      actorRole: 'reviewer',
      sourceTable: 'tasks',
      metadata: { smoke: true, surface: 'hosted-preview' }
    },
    fetchImpl,
    expectedStatuses: [201, 202]
  });
  assertAuditWriteContract(auditWrite.payload, auditWrite.statusCode);
  assertSimulationSafe(auditWrite.payload, '/api/simulation/audit-events');
  log(`/api/simulation/audit-events write ${auditWrite.statusCode}`);

  return {
    health: health.payload.status ?? 'ok',
    corsOrigin: health.headers.get('access-control-allow-origin'),
    workspace: workspace.payload.source ?? 'unknown-source',
    readiness: readiness.payload.migrations?.approved ? 'approved' : 'needs-review',
    signals: signals.payload.signals.length,
    signalProvider: signals.payload.provider,
    suggestions: suggestions.payload.suggestions.length,
    suggestionProvider: suggestions.payload.provider,
    auditRead: auditRead.payload.source ?? 'unknown-source',
    auditWrite: auditWrite.statusCode,
    smokeScope: 'availability-and-schema-only'
  };
}

function resolvePreviewApiUrl(env = process.env) {
  return normaliseText(
    env.SAFEFLOW_PREVIEW_API_URL ||
    env.SAFEFLOW_PUBLIC_API_URL ||
    env.VITE_SAFEFLOW_API_BASE_URL
  );
}

function resolvePreviewGateExpectation(env = process.env) {
  return normaliseText(env.SAFEFLOW_EXPECT_PREVIEW_ACCESS_GATE) === 'false'
    ? false
    : DEFAULT_PREVIEW_GATE_EXPECTATION;
}

function normaliseBaseUrl(value) {
  const normalized = normaliseText(value).replace(/\/+$/, '');

  if (!normalized) {
    throw new Error('SAFEFLOW_PREVIEW_API_URL must be set to the deployed PublicApiUrl before hosted preview smoke can run.');
  }

  return normalized;
}

function normaliseText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function requestJson({
  baseUrl,
  path,
  method = 'GET',
  headers = {},
  body,
  fetchImpl,
  expectedStatuses = [200]
}) {
  const response = await fetchImpl(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await readJsonResponse(response, method, path);
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${method} ${path} returned ${response.status}`);
  }

  return {
    statusCode: response.status,
    headers: response.headers,
    payload
  };
}

async function readJsonResponse(response, method, path) {
  const rawBody = await response.text();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error(`${method} ${path} returned non-JSON content.`);
  }
}

function assertPreviewCors(response, path) {
  const corsOrigin = response.headers.get('access-control-allow-origin');

  if (!corsOrigin || corsOrigin === '*') {
    throw new Error(`${path} did not return a preview-safe Access-Control-Allow-Origin value.`);
  }
}

function assertHostedHealth(payload) {
  if (
    payload?.service !== 'SafeFlow API' ||
    payload?.simulationOnly !== true ||
    payload?.noLivePatientData !== true ||
    payload?.publicIngress !== true
  ) {
    throw new Error('/api/health did not return the hosted SafeFlow public preview contract.');
  }
}

function assertSimulationAvailabilityContract(payload, path) {
  if (
    payload?.product !== 'SafeFlow' ||
    payload?.simulationOnly !== true ||
    payload?.safetyBoundary?.noLivePatientData !== true ||
    payload?.safetyBoundary?.humanReviewRequired !== true
  ) {
    throw new Error(`${path} did not return the SafeFlow simulation availability contract.`);
  }
}

function assertReadinessContract(payload, path) {
  if (
    payload?.mode !== 'simulation' ||
    payload?.clinicalUse !== false ||
    payload?.validationStatus !== PREVIEW_VALIDATION_STATUS ||
    !hasPreviewExplanation(payload?.explanation)
  ) {
    throw new Error(`${path} did not return the SafeFlow simulation safety contract.`);
  }

  assertSimulationAvailabilityContract(payload, path);
}

function assertSimulationOutputContract(payload, path) {
  if (
    payload?.mode !== 'simulation' ||
    payload?.clinicalUse !== false ||
    payload?.validationStatus !== PREVIEW_VALIDATION_STATUS ||
    !hasPreviewExplanation(payload?.explanation) ||
    typeof payload?.provider !== 'string' ||
    typeof payload?.source !== 'string'
  ) {
    throw new Error(`${path} did not return the SafeFlow simulation safety contract.`);
  }

  assertSimulationAvailabilityContract(payload, path);
}

function assertReadinessProviderMetadata(payload) {
  if (
    typeof payload?.providerMetadata?.signals?.provider !== 'string' ||
    typeof payload?.providerMetadata?.signals?.providerId !== 'string' ||
    typeof payload?.providerMetadata?.suggestions?.provider !== 'string' ||
    typeof payload?.providerMetadata?.suggestions?.providerId !== 'string'
  ) {
    throw new Error('/api/simulation/readiness did not return signal and suggestion provider metadata.');
  }
}

function assertAuditWriteContract(payload, statusCode) {
  if (statusCode === 201) {
    if (payload?.event?.simulationOnly !== true || typeof payload?.event?.source !== 'string') {
      throw new Error('/api/simulation/audit-events write did not return a stored simulation event.');
    }
    return;
  }

  if (
    payload?.product !== 'SafeFlow' ||
    payload?.simulationOnly !== true ||
    payload?.auditStore?.appendOnly !== true
  ) {
    throw new Error('/api/simulation/audit-events write did not return the placeholder preview write contract.');
  }
}

function assertSimulationSafe(payload, path) {
  const serialized = JSON.stringify(payload);

  if (DIRECT_IDENTIFIER_FIELD_PATTERN.test(serialized)) {
    throw new Error(`${path} exposed a direct patient identifier field.`);
  }
  if (SECRET_VALUE_PATTERN.test(serialized)) {
    throw new Error(`${path} exposed a secret-like value.`);
  }
}

function hasPreviewExplanation(value) {
  return typeof value === 'string' &&
    /preview only/i.test(value) &&
    /not clinically validated/i.test(value) &&
    /not for clinical decision-making/i.test(value);
}

function isCliEntryPoint(metaUrl, argvPath) {
  return argvPath ? pathToFileURL(argvPath).href === metaUrl : false;
}

if (isCliEntryPoint(import.meta.url, process.argv[1])) {
  runPreviewApiSmoke().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
