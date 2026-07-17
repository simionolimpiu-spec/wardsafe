import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Pool as PgPool } from 'pg';
import {
  SimulationAuditEventValidationError,
  assertSimulationAuditPayloadIsSafe,
  createDatabaseAuditEventProvider
} from '../../../../server/auditEventProvider.js';
import { createCorsHeaders, isOriginAllowed } from '../../../../server/corsConfig.js';
import { buildEpisodes, compareDays, getPatientDay } from '../../../../src/domain/longitudinalJourney.js';
import { createSimulationReadinessReport } from '../../../../server/readinessReport.js';
import {
  allowsSimulationPreviewFallback,
  buildSimulationOutputEnvelope,
  createSimulationProviderMetadata,
  SIMULATION_OUTPUT_EXPLANATION,
  SIMULATION_OUTPUT_VALIDATION_STATUS
} from '../../../../server/simulationOutputMetadata.js';
import { createDatabaseSignalProvider } from '../../../../server/signalProvider.js';
import { createDatabaseSuggestionProvider } from '../../../../server/suggestionProvider.js';
import { createDatabaseWorkspaceProvider } from '../../../../server/workspaceProvider.js';

export function createSafeFlowApiHandler({
  Pool = PgPool,
  readSecret = createSecretsManagerReader(),
  env = process.env
} = {}) {
  let poolConfigPromise;

  async function getPoolConfig() {
    if (!poolConfigPromise) {
      poolConfigPromise = createPoolConfigFromSecret({ env, readSecret });
    }
    return poolConfigPromise;
  }

  async function createDatabaseProviders() {
    const poolConfig = await getPoolConfig();
    const providerEnv = {
      ...env,
      SAFEFLOW_SIMULATION_ONLY: String(env.SAFEFLOW_SIMULATION_ONLY === 'true')
    };

    return {
      workspaceProvider: createDatabaseWorkspaceProvider({ env: providerEnv, Pool, poolConfig }),
      auditEventProvider: createDatabaseAuditEventProvider({ env: providerEnv, Pool, poolConfig }),
      signalProvider: createDatabaseSignalProvider({ env: providerEnv, Pool, poolConfig }),
      suggestionProvider: createDatabaseSuggestionProvider({ env: providerEnv, Pool, poolConfig })
    };
  }

  return async function safeFlowApiHandler(event = {}) {
    const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
    const path = event.requestContext?.http?.path ?? event.path ?? '/api/health';
    const simulationOnly = env.SAFEFLOW_SIMULATION_ONLY === 'true';
    const databaseMode = shouldUseDatabaseMode(env);
    const respond = (statusCode, payload) => jsonResponse(statusCode, payload, env);

    try {
      if (method === 'OPTIONS') {
        return noContentResponse(env);
      }

      if (!isPreviewAccessAuthorized(event, env)) {
        return respond(401, {
          error: 'Preview access token required.'
        });
      }

      if (!isPreviewOriginAuthorized(event, env)) {
        return respond(403, {
          error: 'Preview origin not allowed.'
        });
      }

      if (method === 'GET' && path === '/api/simulation/workspace') {
        if (!databaseMode) {
          return respond(200, placeholderWorkspace({ env, simulationOnly }));
        }

        const { workspaceProvider } = await createDatabaseProviders();
        return respond(200, await workspaceProvider.getSnapshot());
      }

      if (method === 'GET' && path === '/api/simulation/readiness') {
        if (!databaseMode) {
          return respond(200, placeholderReadiness({ env, simulationOnly }));
        }

        const {
          workspaceProvider,
          auditEventProvider,
          signalProvider,
          suggestionProvider
        } = await createDatabaseProviders();
        await workspaceProvider.getSnapshot();
        await auditEventProvider.listEvents({ limit: 1 });
        const verifiedSignalProvider = await verifyOptionalPreviewProvider({
          env,
          provider: signalProvider,
          verify: () => signalProvider.listPatientSignals(),
          fallbackId: 'private-lambda-signals-placeholder',
          route: '/api/simulation/signals'
        });
        const verifiedSuggestionProvider = await verifyOptionalPreviewProvider({
          env,
          provider: suggestionProvider,
          verify: () => suggestionProvider.listRiskSuggestions(),
          fallbackId: 'private-lambda-risk-suggestions-placeholder',
          route: '/api/simulation/risk-suggestions'
        });

        return respond(200, createSimulationReadinessReport({
          draftProvider: { id: 'server-side-provider-secret' },
          workspaceProvider,
          auditEventProvider,
          signalProvider: verifiedSignalProvider,
          suggestionProvider: verifiedSuggestionProvider,
          env
        }));
      }

      if (method === 'GET' && path === '/api/simulation/signals') {
        if (!databaseMode) {
          return respond(200, placeholderSignals({ env, simulationOnly }));
        }

        const { signalProvider } = await createDatabaseProviders();

        try {
          return respond(200, buildSimulationOutputEnvelope({
            source: signalProvider.id,
            payload: {
              product: 'SafeFlow',
              simulationOnly: true,
              safetyBoundary: safetyBoundary(),
              signals: await signalProvider.listPatientSignals({
                patientId: event.queryStringParameters?.patientId ?? null
              })
            }
          }));
        } catch (error) {
          if (!allowsSimulationPreviewFallback(env)) {
            throw error;
          }
          logPreviewFallback('/api/simulation/signals', error);
          return respond(200, placeholderSignals({ env, simulationOnly }));
        }
      }

      if (method === 'GET' && path === '/api/simulation/risk-suggestions') {
        if (!databaseMode) {
          return respond(200, placeholderRiskSuggestions({ env, simulationOnly }));
        }

        const { suggestionProvider } = await createDatabaseProviders();

        try {
          return respond(200, buildSimulationOutputEnvelope({
            source: suggestionProvider.id,
            payload: {
              product: 'SafeFlow',
              simulationOnly: true,
              safetyBoundary: safetyBoundary(),
              suggestions: await suggestionProvider.listRiskSuggestions({
                patientId: event.queryStringParameters?.patientId ?? null
              })
            }
          }));
        } catch (error) {
          if (!allowsSimulationPreviewFallback(env)) {
            throw error;
          }
          logPreviewFallback('/api/simulation/risk-suggestions', error);
          return respond(200, placeholderRiskSuggestions({ env, simulationOnly }));
        }
      }

      const suggestionActionMatch = path.match(/^\/api\/simulation\/risk-suggestions\/([^/]+)\/actions$/);
      const longitudinalDayMatch = path.match(/^\/api\/simulation\/longitudinal\/patients\/([^/]+)\/days\/(-?\d+)$/);
      const longitudinalEpisodesMatch = path.match(/^\/api\/simulation\/longitudinal\/patients\/([^/]+)\/episodes$/);
      const longitudinalCompareMatch = path.match(/^\/api\/simulation\/longitudinal\/patients\/([^/]+)\/compare$/);

      if (method === 'POST' && suggestionActionMatch) {
        if (!databaseMode) {
          return respond(202, placeholderRiskSuggestionAction({ env, simulationOnly }));
        }

        const body = parseEventBody(event);
        const { suggestionProvider } = await createDatabaseProviders();

        try {
          return respond(201, {
            action: await suggestionProvider.recordSuggestionAction({
              suggestionId: decodeURIComponent(suggestionActionMatch[1]),
              actionType: body.actionType,
              actionReason: body.actionReason,
              actorRef: body.actorRef
            })
          });
        } catch (error) {
          if (!allowsSimulationPreviewFallback(env)) {
            throw error;
          }
          logPreviewFallback('/api/simulation/risk-suggestions/{suggestionId}/actions', error);
          return respond(202, placeholderRiskSuggestionAction({ env, simulationOnly }));
        }
      }

      if (method === 'GET' && path === '/api/simulation/audit-events') {
        if (!databaseMode) {
          return respond(200, placeholderAuditEvents({ env, simulationOnly }));
        }

        const { auditEventProvider } = await createDatabaseProviders();
        const limit = Number(event.queryStringParameters?.limit ?? 25);

        return respond(200, {
          product: 'SafeFlow',
          simulationOnly: true,
          source: auditEventProvider.id,
          safetyBoundary: safetyBoundary(),
          events: await auditEventProvider.listEvents({ limit })
        });
      }

      if (method === 'POST' && path === '/api/simulation/audit-events') {
        const body = parseEventBody(event);

        if (!databaseMode) {
          return respond(202, placeholderAuditWrite({ env, simulationOnly }));
        }

        assertSimulationAuditPayloadIsSafe(body);
        const { auditEventProvider } = await createDatabaseProviders();

        return respond(201, {
          event: await auditEventProvider.recordEvent(body)
        });
      }

      if (method === 'GET' && longitudinalDayMatch) {
        const day = Number(longitudinalDayMatch[2]);
        if (!Number.isInteger(day) || day < 1) {
          return respond(400, { error: 'Day must be a positive integer' });
        }

        return respond(200, buildSimulationOutputEnvelope({
          source: 'longitudinal-journey-engine',
          payload: {
            product: 'SafeFlow',
            simulationOnly: true,
            safetyBoundary: safetyBoundary(),
            day: getPatientDay(decodeURIComponent(longitudinalDayMatch[1]), day)
          }
        }));
      }

      if (method === 'GET' && longitudinalEpisodesMatch) {
        const throughDay = Number(event.queryStringParameters?.throughDay ?? 1);
        if (!Number.isInteger(throughDay) || throughDay < 1) {
          return respond(400, { error: 'throughDay must be a positive integer' });
        }

        return respond(200, buildSimulationOutputEnvelope({
          source: 'longitudinal-journey-engine',
          payload: {
            product: 'SafeFlow',
            simulationOnly: true,
            safetyBoundary: safetyBoundary(),
            throughDay,
            episodes: buildEpisodes(decodeURIComponent(longitudinalEpisodesMatch[1]), throughDay)
          }
        }));
      }

      if (method === 'GET' && longitudinalCompareMatch) {
        const dayA = Number(event.queryStringParameters?.from);
        const dayB = Number(event.queryStringParameters?.to);
        if (!Number.isInteger(dayA) || dayA < 1 || !Number.isInteger(dayB) || dayB < 1) {
          return respond(400, { error: 'from and to must be positive integers' });
        }

        return respond(200, buildSimulationOutputEnvelope({
          source: 'longitudinal-journey-engine',
          payload: {
            product: 'SafeFlow',
            simulationOnly: true,
            safetyBoundary: safetyBoundary(),
            comparison: compareDays(decodeURIComponent(longitudinalCompareMatch[1]), dayA, dayB)
          }
        }));
      }

      if (method !== 'GET' || path !== '/api/health') {
        return respond(404, { error: 'Not found' });
      }

        return respond(200, {
          service: 'SafeFlow API',
          environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
          simulationOnly,
          noLivePatientData: true,
          publicIngress: true,
          migrationManifestPath: env.MIGRATION_MANIFEST_PATH,
          configuredResources: {
            hasDatabaseSecret: Boolean(env.DATABASE_SECRET_ARN),
            hasProviderConfigSecret: Boolean(env.PROVIDER_CONFIG_SECRET_ARN),
            hasDocumentBucket: Boolean(env.DOCUMENT_BUCKET_NAME)
        }
      });
    } catch (error) {
      console.error('SafeFlow API route failed', {
        message: redactSensitiveText(error.message),
        name: error.name
      });

      if (error instanceof SimulationAuditEventValidationError || error.statusCode === 400) {
        return respond(400, {
          error: 'Invalid simulation audit event.'
        });
      }

      return respond(503, {
        error: 'SafeFlow database route unavailable.'
      });
    }
  };
}

function shouldUseDatabaseMode(env) {
  return env.SAFEFLOW_DATA_MODE === 'database';
}

function isPreviewAccessAuthorized(event, env) {
  const expectedToken = typeof env.SAFEFLOW_PREVIEW_ACCESS_TOKEN === 'string'
    ? env.SAFEFLOW_PREVIEW_ACCESS_TOKEN.trim()
    : '';

  if (!expectedToken) {
    return true;
  }

  const providedToken = getHeaderValue(event, 'x-safeflow-preview-token')?.trim() ?? '';
  if (!providedToken) {
    return false;
  }

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);

  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function isPreviewOriginAuthorized(event, env) {
  const configuredOrigin = typeof env.SAFEFLOW_ALLOWED_ORIGIN === 'string'
    ? env.SAFEFLOW_ALLOWED_ORIGIN.trim()
    : '';

  if (!configuredOrigin || configuredOrigin === '*') {
    return true;
  }

  const requestOrigin = getHeaderValue(event, 'origin');

  return isOriginAllowed(requestOrigin, env);
}

function getHeaderValue(event, headerName) {
  const headers = event.headers ?? {};
  const match = Object.entries(headers).find(([name]) => name.toLowerCase() === headerName);

  return typeof match?.[1] === 'string' ? match[1] : null;
}

async function createPoolConfigFromSecret({ env, readSecret }) {
  if (!env.DATABASE_SECRET_ARN) {
    throw new Error('DATABASE_SECRET_ARN is required for private database-backed SafeFlow API routes.');
  }

  const secretString = await readSecret(env.DATABASE_SECRET_ARN);
  const secret = JSON.parse(secretString);

  for (const field of ['username', 'password', 'host']) {
    if (!secret[field]) {
      throw new Error(`Database secret is missing required field: ${field}`);
    }
  }

  return {
    user: secret.username,
    password: secret.password,
    host: secret.host,
    port: Number(secret.port ?? 5432),
    database: secret.dbname ?? secret.database ?? 'safeflow',
    ssl: env.SAFEFLOW_DATABASE_SSL === 'false'
      ? false
      : {
          rejectUnauthorized: true,
          ca: readBundledAsset('infra/aws/certs/rds-eu-west-2-bundle.pem')
        }
  };
}

function parseEventBody(event) {
  if (!event.body) return {};

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  return typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
}

function readBundledAsset(path) {
  const roots = [
    process.env.LAMBDA_TASK_ROOT,
    process.cwd()
  ].filter(Boolean);

  for (const root of roots) {
    try {
      return readFileSync(resolve(root, path), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  throw new Error(`SafeFlow bundled asset not found: ${path}`);
}

function createSecretsManagerReader(client = new SecretsManagerClient({})) {
  return async function readSecret(secretId) {
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

    if (!response.SecretString) {
      throw new Error('SafeFlow database secret did not contain a SecretString value.');
    }

    return response.SecretString;
  };
}

function placeholderWorkspace({ env, simulationOnly }) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    route: '/api/simulation/workspace',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
    simulationOnly,
    source: 'private-lambda-read-model-placeholder',
    safetyBoundary: safetyBoundary(),
    publicIngress: true,
    workspace: {
      status: 'ready-for-approved-simulation-database',
      databaseReadModel: 'database/queries/simulationWorkspace.sql'
    }
  };
}

function placeholderReadiness({ env, simulationOnly }) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
    mode: 'simulation',
    simulationOnly,
    clinicalUse: false,
    validationStatus: SIMULATION_OUTPUT_VALIDATION_STATUS,
    explanation: SIMULATION_OUTPUT_EXPLANATION,
    safetyBoundary: safetyBoundary(),
    publicIngress: true,
    providers: {
      draft: 'server-side-provider-secret',
      workspace: 'private-lambda-read-model-placeholder',
      audit: 'private-lambda-audit-placeholder',
      signals: 'private-lambda-signals-placeholder',
      suggestions: 'private-lambda-risk-suggestions-placeholder'
    },
    providerMetadata: {
      signals: createSimulationProviderMetadata({
        id: 'private-lambda-signals-placeholder'
      }),
      suggestions: createSimulationProviderMetadata({
        id: 'private-lambda-risk-suggestions-placeholder'
      })
    },
    database: {
      configured: Boolean(env.DATABASE_SECRET_ARN),
      guardedBySimulationOnly: simulationOnly
    },
    migrations: {
      approved: true,
      count: 2,
      simulationOnly: true,
      manifestPath: env.MIGRATION_MANIFEST_PATH ?? 'database/migration-manifest.json'
    },
  };
}

function placeholderSignals({ env, simulationOnly }) {
  return buildSimulationOutputEnvelope({
    source: 'private-lambda-signals-placeholder',
    payload: {
      schemaVersion: 1,
      product: 'SafeFlow',
      route: '/api/simulation/signals',
      environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
      simulationOnly,
      safetyBoundary: safetyBoundary(),
      publicIngress: true,
      signals: []
    }
  });
}

function placeholderRiskSuggestions({ env, simulationOnly }) {
  return buildSimulationOutputEnvelope({
    source: 'private-lambda-risk-suggestions-placeholder',
    payload: {
      schemaVersion: 1,
      product: 'SafeFlow',
      route: '/api/simulation/risk-suggestions',
      environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
      simulationOnly,
      safetyBoundary: safetyBoundary(),
      publicIngress: true,
      suggestions: []
    }
  });
}

function placeholderRiskSuggestionAction({ env, simulationOnly }) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    route: '/api/simulation/risk-suggestions/{suggestionId}/actions',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
    simulationOnly,
    source: 'private-lambda-risk-suggestions-placeholder',
    safetyBoundary: safetyBoundary(),
    actionStore: {
      appendOnly: true,
      databaseWriteContract: 'database/queries/recordSimulationSuggestionAction.sql'
    },
    publicIngress: true
  };
}

function placeholderAuditWrite({ env, simulationOnly }) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    route: '/api/simulation/audit-events',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
    simulationOnly,
    source: 'private-lambda-audit-placeholder',
    safetyBoundary: safetyBoundary(),
    auditStore: {
      appendOnly: true,
      databaseWriteContract: 'database/queries/insertSimulationAuditEvent.sql'
    },
    publicIngress: true
  };
}

function placeholderAuditEvents({ env, simulationOnly }) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    route: '/api/simulation/audit-events',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
    simulationOnly,
    source: 'private-lambda-audit-placeholder',
    safetyBoundary: safetyBoundary(),
    publicIngress: true,
    events: []
  };
}

function safetyBoundary() {
  return {
    noLivePatientData: true,
    directCareIdentifiers: false,
    humanReviewRequired: true
  };
}

function jsonResponse(statusCode, payload, env = process.env) {
  return {
    statusCode,
    headers: {
      ...createCorsHeaders(env),
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  };
}

function noContentResponse(env = process.env) {
  return {
    statusCode: 204,
    headers: createCorsHeaders(env),
    body: ''
  };
}

function redactSensitiveText(text) {
  return String(text)
    .replace(/\b(postgres(?:ql)?:\/\/)([^@\s/]+)@/gi, '$1[redacted]@')
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[redacted]"');
}

async function verifyOptionalPreviewProvider({ env, provider, verify, fallbackId, route }) {
  try {
    await verify();
    return provider;
  } catch (error) {
    if (!allowsSimulationPreviewFallback(env)) {
      throw error;
    }
    logPreviewFallback(route, error);
    return { id: fallbackId };
  }
}

function logPreviewFallback(route, error) {
  console.warn('SafeFlow API route fallback', {
    route,
    message: redactSensitiveText(error?.message),
    name: error?.name
  });
}

export const handler = createSafeFlowApiHandler();
