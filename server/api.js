import { simulatedPatients } from '../src/data/simulatedPatients.js';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { evaluatePotassiumSafetyGap } from '../src/domain/safetyRules.js';
import {
  assertSimulationAuditPayloadIsSafe,
  createConfiguredAuditEventProvider
} from './auditEventProvider.js';
import { createSimulationReadinessReport } from './readinessReport.js';
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
    setCorsHeaders(res);

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
    writeJson(res, 200, {
      product: 'SafeFlow',
      simulationOnly: true,
      source: signalProvider.id ?? 'simulation-signals',
      safetyBoundary: simulationSafetyBoundary(),
      signals
    });
  } catch {
    writeJson(res, 503, { error: 'Simulation signals unavailable' });
  }
}

async function handleSimulationRiskSuggestions(res, suggestionProvider, searchParams) {
  try {
    const suggestions = await suggestionProvider.listRiskSuggestions({ patientId: searchParams.get('patientId') || null });
    writeJson(res, 200, {
      product: 'SafeFlow',
      simulationOnly: true,
      source: suggestionProvider.id ?? 'simulation-risk-suggestions',
      safetyBoundary: simulationSafetyBoundary(),
      suggestions
    });
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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
