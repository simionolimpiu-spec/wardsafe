import { pathToFileURL } from 'node:url';
import { createApiHandler } from './api.js';

function createRequest({ method = 'GET', path, body = {} }) {
  return {
    method,
    url: path,
    async json() {
      return body;
    }
  };
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload = '') {
      this.body = payload;
    }
  };
}

async function requestJson(handler, request) {
  const response = createResponse();

  await handler(createRequest(request), response);
  const payload = response.body ? JSON.parse(response.body) : {};

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`${request.method ?? 'GET'} ${request.path} returned ${response.statusCode}`);
  }

  return payload;
}

function assertSimulationSafe(payload, path) {
  const serialized = JSON.stringify(payload);

  if (/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i.test(serialized)) {
    throw new Error(`${path} exposed a direct patient identifier field`);
  }
  if (serialized.includes('postgres://') || /\bsk-[A-Za-z0-9_-]{8,}/.test(serialized)) {
    throw new Error(`${path} exposed a secret-like value`);
  }
}

export async function runApiSmoke({ handler = createApiHandler(), log = console.log } = {}) {
  const health = await requestJson(handler, { path: '/api/health' });
  if (health.status !== 'ok') throw new Error('/api/health did not return ok');
  log('/api/health ok');

  const workspace = await requestJson(handler, { path: '/api/simulation/workspace' });
  if (workspace.product !== 'SafeFlow' || workspace.simulationOnly !== true) {
    throw new Error('/api/simulation/workspace did not return a simulation SafeFlow snapshot');
  }
  assertSimulationSafe(workspace, '/api/simulation/workspace');
  log(`/api/simulation/workspace ${workspace.source}`);

  const readiness = await requestJson(handler, { path: '/api/simulation/readiness' });
  if (readiness.product !== 'SafeFlow' || readiness.migrations?.approved !== true) {
    throw new Error('/api/simulation/readiness did not return approved simulation readiness');
  }
  assertSimulationSafe(readiness, '/api/simulation/readiness');
  log('/api/simulation/readiness approved');

  const audit = await requestJson(handler, {
    method: 'POST',
    path: '/api/simulation/audit-events',
    body: {
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional API smoke task completed',
      actorRole: 'charge_nurse',
      sourceTable: 'tasks',
      metadata: { smoke: true }
    }
  });
  if (audit.event?.source !== 'local-audit-fixture' && audit.event?.source !== 'postgresql-simulation-audit-events') {
    throw new Error('/api/simulation/audit-events did not return an approved audit source');
  }
  assertSimulationSafe(audit, '/api/simulation/audit-events');
  log(`/api/simulation/audit-events ${audit.event.source}`);

  const draft = await requestJson(handler, {
    method: 'POST',
    path: '/api/drafts/sbar',
    body: { patientId: 'DCU-031' }
  });
  if (draft.draft?.provider !== 'deterministic' && draft.draft?.provider !== 'openai') {
    throw new Error('/api/drafts/sbar did not return an approved draft provider');
  }
  assertSimulationSafe(draft, '/api/drafts/sbar');
  log(`/api/drafts/sbar ${draft.draft.provider}`);

  return {
    health: health.status,
    workspace: workspace.source,
    readiness: readiness.migrations.approved ? 'approved' : 'needs-review',
    audit: audit.event.source,
    draft: draft.draft.provider
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runApiSmoke().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
