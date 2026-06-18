export async function handler() {
  const simulationOnly = process.env.SAFEFLOW_SIMULATION_ONLY === 'true';

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
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
    })
  };
}
