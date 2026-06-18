import { afterEach, describe, expect, it } from 'vitest';
import { handler } from './index.mjs';

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
});
