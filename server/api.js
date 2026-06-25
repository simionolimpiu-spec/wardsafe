import { simulatedPatients } from '../src/data/simulatedPatients.js';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { evaluatePotassiumSafetyGap } from '../src/domain/safetyRules.js';
import {
  assertSimulationAuditPayloadIsSafe,
  createLocalAuditEventProvider
} from './auditEventProvider.js';
import { createSimulationReadinessReport } from './readinessReport.js';
import { createLocalWorkspaceProvider } from './workspaceProvider.js';

export function createApiHandler({
  provider = deterministicDraftProvider,
  workspaceProvider = createLocalWorkspaceProvider(),
  auditEventProvider = createLocalAuditEventProvider(),
  env = process.env
} = {}) {
  return async function apiHandler(req, res) {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
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
        env
      }));
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
