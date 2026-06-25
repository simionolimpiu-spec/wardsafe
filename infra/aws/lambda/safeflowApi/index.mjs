export async function handler(event = {}) {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path = event.requestContext?.http?.path ?? event.path ?? '/api/health';
  const simulationOnly = process.env.SAFEFLOW_SIMULATION_ONLY === 'true';

  if (method === 'GET' && path === '/api/simulation/workspace') {
    return jsonResponse(200, {
      schemaVersion: 1,
      product: 'SafeFlow',
      route: '/api/simulation/workspace',
      environment: process.env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
      simulationOnly,
      source: 'private-lambda-read-model-placeholder',
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      workspace: {
        status: 'ready-for-approved-simulation-database',
        databaseReadModel: 'database/queries/simulationWorkspace.sql'
      }
    });
  }

  if (method === 'GET' && path === '/api/simulation/readiness') {
    return jsonResponse(200, {
      schemaVersion: 1,
      product: 'SafeFlow',
      environment: process.env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
      simulationOnly,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      providers: {
        draft: 'server-side-provider-secret',
        workspace: 'private-lambda-read-model-placeholder'
      },
      database: {
        configured: Boolean(process.env.DATABASE_SECRET_ARN),
        guardedBySimulationOnly: simulationOnly
      },
      migrations: {
        approved: true,
        count: 2,
        simulationOnly: true,
        manifestPath: process.env.MIGRATION_MANIFEST_PATH ?? 'database/migration-manifest.json'
      },
      publicIngress: false
    });
  }

  if (method !== 'GET' || path !== '/api/health') {
    return jsonResponse(404, { error: 'Not found' });
  }

  return jsonResponse(200, {
    service: 'SafeFlow API',
    environment: process.env.SAFEFLOW_ENVIRONMENT ?? 'simulation',
    simulationOnly,
    noLivePatientData: true,
    publicIngress: false,
    migrationManifestPath: process.env.MIGRATION_MANIFEST_PATH,
    configuredResources: {
      hasDatabaseSecret: Boolean(process.env.DATABASE_SECRET_ARN),
      hasProviderConfigSecret: Boolean(process.env.PROVIDER_CONFIG_SECRET_ARN),
      hasDocumentBucket: Boolean(process.env.DOCUMENT_BUCKET_NAME)
    }
  });
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  };
}
