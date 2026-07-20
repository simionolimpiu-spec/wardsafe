import { simulatedPatients } from '../src/data/simulatedPatients.js';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { buildEpisodes, compareDays, getPatientDay } from '../src/domain/longitudinalJourney.js';
import { evaluatePotassiumSafetyGap } from '../src/domain/safetyRules.js';
import { buildWardLongitudinalRollup, compareWardDays } from '../src/domain/wardLongitudinalRollup.js';
import {
  assertSimulationAuditPayloadIsSafe,
  createConfiguredAuditEventProvider
} from './auditEventProvider.js';
import { createCorsHeaders } from './corsConfig.js';
import { createSimulationReadinessReport } from './readinessReport.js';
import { createSimulationRiskSupportReadOnlyReport } from './simulationRiskSupportReport.js';
import { buildSimulationOutputEnvelope } from './simulationOutputMetadata.js';
import { createConfiguredSignalProvider } from './signalProvider.js';
import { createConfiguredSuggestionProvider } from './suggestionProvider.js';
import { createConfiguredWorkspaceProvider } from './workspaceProvider.js';

export function createApiHandler({
  provider = deterministicDraftProvider,
  env = process.env,
  workspaceProvider = createConfiguredWorkspaceProvider({ env }),
  auditEventProvider = createConfiguredAuditEventProvider({ env }),
  signalProvider = createConfiguredSignalProvider({ env }),
  suggestionProvider = createConfiguredSuggestionProvider({ env })
} = {}) {
  return async function apiHandler(req, res) {
    const { pathname, searchParams } = new URL(req.url ?? '/', 'http://localhost');
    const suggestionActionMatch = pathname.match(/^\/api\/simulation\/risk-suggestions\/([^/]+)\/actions$/);
    const longitudinalDayMatch = pathname.match(/^\/api\/simulation\/longitudinal\/patients\/([^/]+)\/days\/(-?\d+)$/);
    const longitudinalEpisodesMatch = pathname.match(/^\/api\/simulation\/longitudinal\/patients\/([^/]+)\/episodes$/);
    const longitudinalCompareMatch = pathname.match(/^\/api\/simulation\/longitudinal\/patients\/([^/]+)\/compare$/);
    const wardLongitudinalRollupMatch = pathname.match(/^\/api\/simulation\/longitudinal\/wards\/([^/]+)\/rollup$/);
    const wardLongitudinalCompareMatch = pathname.match(/^\/api\/simulation\/longitudinal\/wards\/([^/]+)\/compare$/);
    setCorsHeaders(res, env);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      writeJson(res, 200, { status: 'ok' });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/simulation/workspace') {
      writeJson(res, 200, await workspaceProvider.getSnapshot());
      return;
    }

    if (req.method === 'GET' && pathname === '/api/simulation/readiness') {
      writeJson(res, 200, createSimulationReadinessReport({
        draftProvider: provider,
        workspaceProvider,
        auditEventProvider,
        signalProvider,
        suggestionProvider,
        env
      }));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/simulation/risk-support-report') {
      await handleSimulationRiskSupportReport(res, searchParams);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/simulation/signals') {
      await handleSimulationSignals(res, signalProvider, searchParams);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/simulation/risk-suggestions') {
      await handleSimulationRiskSuggestions(res, suggestionProvider, searchParams);
      return;
    }

    if (req.method === 'POST' && suggestionActionMatch) {
      await handleSimulationSuggestionAction(req, res, suggestionProvider, decodeURIComponent(suggestionActionMatch[1]));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/simulation/audit-events') {
      await handleSimulationAuditEvents(req, res, auditEventProvider, searchParams);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/simulation/audit-events') {
      await handleSimulationAuditEvent(req, res, auditEventProvider);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/drafts/sbar') {
      await handleSbarDraft(req, res, provider);
      return;
    }

    if (req.method === 'GET' && longitudinalDayMatch) {
      handleLongitudinalDay(res, decodeURIComponent(longitudinalDayMatch[1]), longitudinalDayMatch[2]);
      return;
    }

    if (req.method === 'GET' && longitudinalEpisodesMatch) {
      handleLongitudinalEpisodes(res, decodeURIComponent(longitudinalEpisodesMatch[1]), searchParams);
      return;
    }

    if (req.method === 'GET' && longitudinalCompareMatch) {
      handleLongitudinalCompare(res, decodeURIComponent(longitudinalCompareMatch[1]), searchParams);
      return;
    }

    if (req.method === 'GET' && wardLongitudinalRollupMatch) {
      handleWardLongitudinalRollup(res, decodeURIComponent(wardLongitudinalRollupMatch[1]), searchParams);
      return;
    }

    if (req.method === 'GET' && wardLongitudinalCompareMatch) {
      handleWardLongitudinalCompare(res, decodeURIComponent(wardLongitudinalCompareMatch[1]), searchParams);
      return;
    }

    writeJson(res, 404, { error: 'Not found' });
  };
}

function simulationSafetyBoundary() {
  return {
    noLivePatientData: true,
    directCareIdentifiers: false,
    humanReviewRequired: true
  };
}

async function handleSimulationSignals(res, signalProvider, searchParams) {
  try {
    const signals = await signalProvider.listPatientSignals({ patientId: searchParams.get('patientId') || null });
    writeJson(res, 200, buildSimulationOutputEnvelope({
      source: signalProvider.id ?? 'simulation-signals',
      payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      signals
      }
    }));
  } catch {
    writeJson(res, 503, { error: 'Simulation signals unavailable' });
  }
}

async function handleSimulationRiskSupportReport(res, searchParams) {
  if (searchParams.toString() !== '') {
    writeJson(res, 400, { error: 'Simulation risk-support report accepts no input' });
    return;
  }

  writeJson(res, 200, createSimulationRiskSupportReadOnlyReport());
}

async function handleSimulationRiskSuggestions(res, suggestionProvider, searchParams) {
  try {
    const suggestions = await suggestionProvider.listRiskSuggestions({ patientId: searchParams.get('patientId') || null });
    writeJson(res, 200, buildSimulationOutputEnvelope({
      source: suggestionProvider.id ?? 'simulation-risk-suggestions',
      payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      suggestions
      }
    }));
  } catch {
    writeJson(res, 503, { error: 'Simulation risk suggestions unavailable' });
  }
}

async function handleSimulationSuggestionAction(req, res, suggestionProvider, suggestionId) {
  const body = await readJson(req);

  try {
    const action = await suggestionProvider.recordSuggestionAction({
      suggestionId,
      actionType: body.actionType,
      actionReason: body.actionReason,
      actorRef: body.actorRef
    });
    writeJson(res, 201, { action });
  } catch (error) {
    if (/requires|not allowed|known fictional/i.test(error.message ?? '')) {
      writeJson(res, 400, { error: 'Simulation suggestion action rejected' });
      return;
    }

    writeJson(res, 503, { error: 'Simulation suggestion action store unavailable' });
  }
}

async function handleSimulationAuditEvents(_req, res, auditEventProvider, searchParams) {
  try {
    const limit = normaliseAuditLimit(searchParams.get('limit'));
    const events = await auditEventProvider.listEvents({ limit });
    writeJson(res, 200, {
      product: 'SafeFlow',
      simulationOnly: true,
      source: auditEventProvider.id ?? 'simulation-audit-events',
      safetyBoundary: simulationSafetyBoundary(),
      events
    });
  } catch {
    writeJson(res, 503, { error: 'Simulation audit events unavailable' });
  }
}

async function handleSimulationAuditEvent(req, res, auditEventProvider) {
  const body = await readJson(req);

  try {
    assertSimulationAuditPayloadIsSafe(body);
    const event = await auditEventProvider.recordEvent(body);
    writeJson(res, 201, { event });
  } catch (error) {
    if (error.statusCode === 400) {
      writeJson(res, 400, { error: 'Simulation audit event rejected' });
      return;
    }

    writeJson(res, 503, { error: 'Simulation audit event store unavailable' });
  }
}

async function handleSbarDraft(req, res, provider) {
  const body = await readJson(req);
  const patient = simulatedPatients.find((item) => item.id === body.patientId);
  if (!patient) {
    writeJson(res, 404, { error: 'Unknown fictional patient' });
    return;
  }

  const flag = evaluatePotassiumSafetyGap(patient);
  try {
    const draft = await provider.createSbarDraft({ patient, flag });
    writeJson(res, 200, { draft, fallbackUsed: draft.provider === 'deterministic' });
  } catch (error) {
    const draft = deterministicDraftProvider.createSbarDraft({ patient, flag });
    writeJson(res, 200, {
      draft,
      fallbackUsed: true,
      providerError: error.name ?? 'DraftProviderError'
    });
  }
}

function handleLongitudinalDay(res, patientId, rawDay) {
  const day = Number(rawDay);
  if (!Number.isInteger(day) || day < 1) {
    writeJson(res, 400, { error: 'Day must be a positive integer' });
    return;
  }

  writeJson(res, 200, buildSimulationOutputEnvelope({
    source: 'longitudinal-journey-engine',
    payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      day: getPatientDay(patientId, day)
    }
  }));
}

function handleLongitudinalEpisodes(res, patientId, searchParams) {
  const throughDay = normaliseThroughDay(searchParams.get('throughDay'));
  if (throughDay === null) {
    writeJson(res, 400, { error: 'throughDay must be a positive integer' });
    return;
  }

  writeJson(res, 200, buildSimulationOutputEnvelope({
    source: 'longitudinal-journey-engine',
    payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      throughDay,
      episodes: buildEpisodes(patientId, throughDay)
    }
  }));
}

function handleLongitudinalCompare(res, patientId, searchParams) {
  const dayA = Number(searchParams.get('from'));
  const dayB = Number(searchParams.get('to'));
  if (!Number.isInteger(dayA) || dayA < 1 || !Number.isInteger(dayB) || dayB < 1) {
    writeJson(res, 400, { error: 'from and to must be positive integers' });
    return;
  }

  writeJson(res, 200, buildSimulationOutputEnvelope({
    source: 'longitudinal-journey-engine',
    payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      comparison: compareDays(patientId, dayA, dayB)
    }
  }));
}

function handleWardLongitudinalRollup(res, wardId, searchParams) {
  writeJson(res, 200, buildSimulationOutputEnvelope({
    source: 'ward-longitudinal-rollup-engine',
    payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      rollup: buildWardLongitudinalRollup(wardId, searchParams.get('day'))
    }
  }));
}

function handleWardLongitudinalCompare(res, wardId, searchParams) {
  writeJson(res, 200, buildSimulationOutputEnvelope({
    source: 'ward-longitudinal-rollup-engine',
    payload: {
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: simulationSafetyBoundary(),
      comparison: compareWardDays(wardId, searchParams.get('from'), searchParams.get('to'))
    }
  }));
}

function normaliseThroughDay(value) {
  if (value == null || value === '') return 1;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1) return null;
  return day;
}

function normaliseAuditLimit(value) {
  if (value == null || value === '') return 25;
  const limit = Number(value);
  if (!Number.isFinite(limit)) return 25;
  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

async function readJson(req) {
  if (typeof req.json === 'function') {
    return req.json();
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res, env) {
  for (const [name, value] of Object.entries(createCorsHeaders(env))) {
    res.setHeader(name, value);
  }
}
