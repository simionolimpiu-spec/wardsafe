import { simulatedPatients } from '../src/data/simulatedPatients.js';
import { deterministicDraftProvider } from '../src/domain/draftProvider.js';
import { evaluatePotassiumSafetyGap } from '../src/domain/safetyRules.js';
import { createSimulationWorkspaceSnapshot } from './simulationWorkspaceSnapshot.js';

export function createApiHandler({ provider = deterministicDraftProvider } = {}) {
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
      writeJson(res, 200, createSimulationWorkspaceSnapshot());
      return;
    }

    if (req.method === 'POST' && pathname === '/api/drafts/sbar') {
      await handleSbarDraft(req, res, provider);
      return;
    }

    writeJson(res, 404, { error: 'Not found' });
  };
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
