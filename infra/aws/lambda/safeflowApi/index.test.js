import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSafeFlowApiHandler } from './index.mjs';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('SafeFlow private API handler', () => {
  it('sets preview-safe CORS headers for a configured frontend origin', async () => {
    const apiHandler = createSafeFlowApiHandler({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        SAFEFLOW_ALLOWED_ORIGIN: 'https://preview.example.com/'
      }
    });

    const response = await apiHandler();

    expect(response.headers).toMatchObject({
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': 'https://preview.example.com',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-SafeFlow-Preview-Token'
    });
  });

  it('allows CORS preflight without exposing route data', async () => {
    const apiHandler = createSafeFlowApiHandler({
      env: {
        SAFEFLOW_PREVIEW_ACCESS_TOKEN: 'safe-preview-token-for-review-12345'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'OPTIONS', path: '/api/simulation/workspace' } }
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });

  it('requires the preview token when the public preview gate is configured', async () => {
    const apiHandler = createSafeFlowApiHandler({
      env: {
        SAFEFLOW_PREVIEW_ACCESS_TOKEN: 'safe-preview-token-for-review-12345'
      }
    });

    const missingToken = await apiHandler();
    const validToken = await apiHandler({
      headers: {
        'X-SafeFlow-Preview-Token': 'safe-preview-token-for-review-12345'
      }
    });

    expect(missingToken.statusCode).toBe(401);
    expect(JSON.parse(missingToken.body)).toEqual({
      error: 'Preview access token required.'
    });
    expect(validToken.statusCode).toBe(200);
  });

  it('returns simulation metadata without exposing configured resource identifiers', async () => {
    process.env.SAFEFLOW_ENVIRONMENT = 'simulation';
    process.env.SAFEFLOW_SIMULATION_ONLY = 'true';
    process.env.DATABASE_SECRET_ARN = 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database';
    process.env.PROVIDER_CONFIG_SECRET_ARN = 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:provider';
    process.env.DOCUMENT_BUCKET_NAME = 'safeflow-private-documents';
    process.env.MIGRATION_MANIFEST_PATH = 'database/migration-manifest.json';
    const apiHandler = createSafeFlowApiHandler();

    const response = await apiHandler();
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      service: 'SafeFlow API',
      environment: 'simulation',
      simulationOnly: true,
      noLivePatientData: true,
      publicIngress: true,
      migrationManifestPath: 'database/migration-manifest.json',
      configuredResources: {
        hasDatabaseSecret: true,
        hasProviderConfigSecret: true,
        hasDocumentBucket: true
      }
    });
    expect(serializedPayload).not.toContain('arn:aws');
    expect(serializedPayload).not.toContain('safeflow-private-documents');
  });

  it('exposes a private simulation workspace route without live-data access', async () => {
    process.env.SAFEFLOW_ENVIRONMENT = 'simulation';
    process.env.SAFEFLOW_SIMULATION_ONLY = 'true';
    const apiHandler = createSafeFlowApiHandler();

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/workspace' } }
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      route: '/api/simulation/workspace',
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      }
    });
    expect(JSON.stringify(payload)).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email|arn:aws)\b/i);
  });

  it('loads the private simulation workspace from PostgreSQL when a database secret is configured', async () => {
    const workspaceSnapshot = {
      schemaVersion: 1,
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      workspace: {
        summary: { wardName: 'Day Care Unit', patientCount: 2 },
        patients: [{ syntheticPatientRef: 'DCU-031', fictionalScenario: true }]
      }
    };
    const Pool = createPoolFactory({
      rows: [{ workspace_snapshot: workspaceSnapshot }]
    }).Pool;
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_admin',
        password: 'secret-password',
        host: 'private-rds.example',
        port: 5432,
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/workspace' } }
    });
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'postgresql-simulation-read-model',
      workspace: {
        summary: { patientCount: 2 }
      }
    });
    expect(serializedPayload).not.toContain('secret-password');
    expect(serializedPayload).not.toContain('private-rds.example');
    expect(serializedPayload).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email|arn:aws)\b/i);
  });

  it('exposes private simulation readiness without configured resource identifiers', async () => {
    process.env.SAFEFLOW_ENVIRONMENT = 'simulation';
    process.env.SAFEFLOW_SIMULATION_ONLY = 'true';
    process.env.DATABASE_SECRET_ARN = 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database';
    process.env.DOCUMENT_BUCKET_NAME = 'safeflow-private-documents';
    const apiHandler = createSafeFlowApiHandler();

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/readiness' } }
    });
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      environment: 'simulation',
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      database: {
        configured: true,
        guardedBySimulationOnly: true
      }
    });
    expect(serializedPayload).not.toContain('arn:aws');
    expect(serializedPayload).not.toContain('safeflow-private-documents');
  });

  it('checks the database read models before reporting database readiness', async () => {
    const workspaceSnapshot = {
      schemaVersion: 1,
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      workspace: {
        summary: { wardName: 'Day Care Unit', patientCount: 2 },
        patients: []
      }
    };
    const { Pool, query } = createSequencedPoolFactory([
      [{ workspace_snapshot: workspaceSnapshot }],
      [],
      [{
        signal_id: 'signal-dcu-031-potassium-0910',
        synthetic_patient_ref: 'DCU-031',
        source_system: 'simulation-ice',
        source_type: 'lab',
        signal_code: 'potassium',
        display_name: 'Potassium',
        signal_value: '3.1',
        unit: 'mmol/L',
        reference_range: '3.5-5.3',
        status: 'final',
        collected_at: '2026-06-10T08:55:00.000Z',
        resulted_at: '2026-06-10T09:10:00.000Z',
        received_at: '2026-06-10T09:10:30.000Z',
        effective_at: '2026-06-10T09:10:00.000Z',
        source_freshness: 'current',
        confidence: '0.980',
        provenance: { feed: 'simulation', directCareIdentifiers: false },
        simulation_only: true
      }],
      [{
        suggestion_id: 'suggestion-dcu-031-electrolyte-review',
        synthetic_patient_ref: 'DCU-031',
        risk_type: 'missed_action',
        risk_tier: 'urgent',
        risk_score: '0.860',
        status: 'suggested',
        title: 'Electrolyte result review may be needed',
        suggested_flag: 'Electrolyte result review may be needed',
        suggested_blocker: 'Unresolved abnormal blood result',
        suggested_task: 'Review blood trend and document action',
        evidence: [],
        missing_data: [],
        model_version: 'simulation-risk-v0',
        feature_set_version: 'signal-features-v0',
        requires_human_review: true,
        created_at: '2026-06-10T09:12:00.000Z',
        updated_at: '2026-06-10T09:12:00.000Z',
        actions: []
      }]
    ]);
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_api',
        password: 'secret-password',
        host: 'private-rds.example',
        port: 5432,
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/readiness' } }
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload.providers).toMatchObject({
      workspace: 'postgresql-simulation-read-model',
      audit: 'postgresql-simulation-audit-events',
      signals: 'postgresql-simulation-signals',
      suggestions: 'postgresql-simulation-risk-suggestions'
    });
    expect(query).toHaveBeenCalledTimes(4);
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('workspace_snapshot'));
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('audit_events'), [1]);
    expect(query).toHaveBeenNthCalledWith(3, expect.stringContaining('clinical_signals'), [null]);
    expect(query).toHaveBeenNthCalledWith(4, expect.stringContaining('risk_suggestions'), [null]);
  });

  it('loads private simulation signals from PostgreSQL when database mode is configured', async () => {
    const { Pool, query } = createPoolFactory({
      rows: [{
        signal_id: 'signal-dcu-031-potassium-0910',
        synthetic_patient_ref: 'DCU-031',
        source_system: 'simulation-ice',
        source_type: 'lab',
        signal_code: 'potassium',
        display_name: 'Potassium',
        signal_value: '3.1',
        unit: 'mmol/L',
        reference_range: '3.5-5.3',
        status: 'final',
        collected_at: '2026-06-10T08:55:00.000Z',
        resulted_at: '2026-06-10T09:10:00.000Z',
        received_at: '2026-06-10T09:10:30.000Z',
        effective_at: '2026-06-10T09:10:00.000Z',
        source_freshness: 'current',
        confidence: '0.980',
        provenance: { feed: 'simulation', directCareIdentifiers: false },
        simulation_only: true
      }]
    });
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_api',
        password: 'secret-password',
        host: 'private-rds.example',
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/signals' } },
      queryStringParameters: { patientId: 'DCU-031' }
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'postgresql-simulation-signals',
      signals: [expect.objectContaining({ syntheticPatientRef: 'DCU-031', simulationOnly: true })]
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('clinical_signals'), ['DCU-031']);
    expect(JSON.stringify(payload)).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email|arn:aws)\b/i);
  });

  it('loads private simulation risk suggestions from PostgreSQL when database mode is configured', async () => {
    const { Pool, query } = createPoolFactory({
      rows: [{
        suggestion_id: 'suggestion-dcu-031-electrolyte-review',
        synthetic_patient_ref: 'DCU-031',
        risk_type: 'missed_action',
        risk_tier: 'urgent',
        risk_score: '0.860',
        status: 'suggested',
        title: 'Electrolyte result review may be needed',
        suggested_flag: 'Electrolyte result review may be needed',
        suggested_blocker: 'Unresolved abnormal blood result',
        suggested_task: 'Review blood trend and document action',
        evidence: [{ signalCode: 'potassium', label: 'Potassium 3.1 mmol/L final at 09:10' }],
        missing_data: ['Magnesium result not visible'],
        model_version: 'simulation-risk-v0',
        feature_set_version: 'signal-features-v0',
        requires_human_review: true,
        created_at: '2026-06-10T09:12:00.000Z',
        updated_at: '2026-06-10T09:12:00.000Z',
        actions: []
      }]
    });
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_api',
        password: 'secret-password',
        host: 'private-rds.example',
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/risk-suggestions' } },
      queryStringParameters: { patientId: 'DCU-031' }
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'postgresql-simulation-risk-suggestions',
      suggestions: [expect.objectContaining({
        suggestionId: 'suggestion-dcu-031-electrolyte-review',
        requiresHumanReview: true
      })]
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('risk_suggestions'), ['DCU-031']);
  });

  it('records private simulation risk suggestion actions into PostgreSQL', async () => {
    const { Pool, query } = createPoolFactory({
      rows: [{
        action_id: 'action-row-1',
        suggestion_id: 'suggestion-dcu-031-electrolyte-review',
        status: 'accepted',
        action_type: 'accepted',
        action_reason: 'Charge nurse reviewed fictional evidence',
        occurred_at: '2026-06-10T09:30:00.000Z',
        updated_at: '2026-06-10T09:30:00.000Z'
      }]
    });
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_api',
        password: 'secret-password',
        host: 'private-rds.example',
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: {
        http: {
          method: 'POST',
          path: '/api/simulation/risk-suggestions/suggestion-dcu-031-electrolyte-review/actions'
        }
      },
      body: JSON.stringify({
        actionType: 'accepted',
        actionReason: 'Charge nurse reviewed fictional evidence',
        actorRef: 'fictional-user-laura-bennett'
      })
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(payload.action).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      status: 'accepted',
      actionType: 'accepted'
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('suggestion_actions'),
      [
        'suggestion-dcu-031-electrolyte-review',
        'accepted',
        'Charge nurse reviewed fictional evidence',
        'fictional-user-laura-bennett'
      ]
    );
  });

  it('advertises the private audit-event append route without writing live data', async () => {
    process.env.SAFEFLOW_ENVIRONMENT = 'simulation';
    process.env.SAFEFLOW_SIMULATION_ONLY = 'true';
    const apiHandler = createSafeFlowApiHandler();

    const response = await apiHandler({
      requestContext: { http: { method: 'POST', path: '/api/simulation/audit-events' } }
    });
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(202);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      route: '/api/simulation/audit-events',
      source: 'private-lambda-audit-placeholder',
      auditStore: {
        appendOnly: true,
        databaseWriteContract: 'database/queries/insertSimulationAuditEvent.sql'
      }
    });
    expect(serializedPayload).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email|arn:aws)\b/i);
  });

  it('records private simulation audit events into PostgreSQL when database mode is configured', async () => {
    const { Pool, query } = createPoolFactory({
      rows: [{
        id: 'e7f84d88-642e-4476-b019-0c82aeb98725',
        event_type: 'task.completed',
        event_summary: 'Fictional task completed',
        synthetic_patient_ref: 'DCU-031',
        occurred_at: '2026-06-10T09:15:00.000Z'
      }]
    });
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_admin',
        password: 'secret-password',
        host: 'private-rds.example',
        port: 5432,
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'POST', path: '/api/simulation/audit-events' } },
      body: JSON.stringify({
        patientId: 'DCU-031',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed',
        sourceTable: 'tasks',
        metadata: { screen: 'tasks' }
      })
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(payload.event).toMatchObject({
      source: 'postgresql-simulation-audit-events',
      syntheticPatientRef: 'DCU-031',
      eventType: 'task.completed'
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('fictional_scenario is true'),
      [
        'DCU-031',
        'task.completed',
        'Fictional task completed',
        'tasks',
        JSON.stringify({ actorRole: 'simulation_user', screen: 'tasks' })
      ]
    );
    expect(JSON.stringify(payload)).not.toContain('secret-password');
  });

  it('returns a generic validation error without echoing unsafe audit metadata', async () => {
    const readSecret = vi.fn();
    const apiHandler = createSafeFlowApiHandler({
      readSecret,
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'POST', path: '/api/simulation/audit-events' } },
      body: JSON.stringify({
        patientId: 'DCU-031',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed',
        metadata: { password: 'secret-password' }
      })
    });
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(400);
    expect(payload).toEqual({ error: 'Invalid simulation audit event.' });
    expect(readSecret).not.toHaveBeenCalled();
    expect(serializedPayload).not.toContain('secret-password');
    expect(serializedPayload).not.toContain('password');
  });

  it('returns a generic operational error without exposing database identifiers', async () => {
    const { Pool } = createPoolFactory({
      error: new Error('failed postgresql://safeflow_admin:secret-password@private-rds.example/safeflow arn:aws:secretsmanager:eu-west-2:123456789012:secret:database')
    });
    const apiHandler = createSafeFlowApiHandler({
      Pool,
      readSecret: async () => JSON.stringify({
        username: 'safeflow_api',
        password: 'secret-password',
        host: 'private-rds.example',
        port: 5432,
        dbname: 'safeflow'
      }),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
        SAFEFLOW_DATA_MODE: 'database'
      }
    });

    const response = await apiHandler({
      requestContext: { http: { method: 'GET', path: '/api/simulation/workspace' } }
    });
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(503);
    expect(payload).toEqual({ error: 'SafeFlow database route unavailable.' });
    expect(serializedPayload).not.toContain('secret-password');
    expect(serializedPayload).not.toContain('private-rds.example');
    expect(serializedPayload).not.toContain('arn:aws');
    expect(serializedPayload).not.toContain('safeflow_admin');
  });
});

function createPoolFactory({ rows = [], error } = {}) {
  const query = vi.fn(async () => {
    if (error) throw error;
    return { rows };
  });
  const end = vi.fn(async () => {});
  const Pool = vi.fn(function Pool() {
    return { query, end };
  });

  return { Pool, query, end };
}

function createSequencedPoolFactory(rowSets) {
  const query = vi.fn(async () => ({ rows: rowSets.shift() ?? [] }));
  const end = vi.fn(async () => {});
  const Pool = vi.fn(function Pool() {
    return { query, end };
  });

  return { Pool, query, end };
}
