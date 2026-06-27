import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSafeFlowApiHandler, handler } from './index.mjs';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('SafeFlow private API handler', () => {
  it('returns simulation metadata without exposing configured resource identifiers', async () => {
    process.env.SAFEFLOW_ENVIRONMENT = 'simulation';
    process.env.SAFEFLOW_SIMULATION_ONLY = 'true';
    process.env.DATABASE_SECRET_ARN = 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database';
    process.env.PROVIDER_CONFIG_SECRET_ARN = 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:provider';
    process.env.DOCUMENT_BUCKET_NAME = 'safeflow-private-documents';
    process.env.MIGRATION_MANIFEST_PATH = 'database/migration-manifest.json';

    const response = await handler();
    const payload = JSON.parse(response.body);
    const serializedPayload = JSON.stringify(payload);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      service: 'SafeFlow API',
      environment: 'simulation',
      simulationOnly: true,
      noLivePatientData: true,
      publicIngress: false,
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

    const response = await handler({
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

    const response = await handler({
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
      []
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
      audit: 'postgresql-simulation-audit-events'
    });
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('workspace_snapshot'));
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('audit_events'), [1]);
  });

  it('advertises the private audit-event append route without writing live data', async () => {
    process.env.SAFEFLOW_ENVIRONMENT = 'simulation';
    process.env.SAFEFLOW_SIMULATION_ONLY = 'true';

    const response = await handler({
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
