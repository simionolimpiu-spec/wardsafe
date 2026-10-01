export const SIMULATION_OUTPUT_EXPLANATION = 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.';
export const SIMULATION_OUTPUT_VALIDATION_STATUS = 'not-clinically-validated';

const FALLBACK_ALLOWED_ENVIRONMENTS = new Set([
  '',
  'local',
  'dev',
  'simulation'
]);

export function buildSimulationOutputEnvelope({
  source,
  payload = {},
  mode = 'simulation'
} = {}) {
  const metadata = createSimulationProviderMetadata({ id: source, mode });

  return {
    ...payload,
    source: metadata.providerId,
    provider: metadata.provider,
    mode: metadata.mode,
    clinicalUse: metadata.clinicalUse,
    validationStatus: metadata.validationStatus,
    explanation: metadata.explanation
  };
}

export function createSimulationProviderMetadata({
  id,
  mode = 'simulation'
} = {}) {
  const providerId = normaliseProviderId(id);

  return {
    providerId,
    provider: classifySimulationProvider(providerId),
    mode,
    clinicalUse: false,
    validationStatus: SIMULATION_OUTPUT_VALIDATION_STATUS,
    explanation: SIMULATION_OUTPUT_EXPLANATION
  };
}

export function allowsSimulationPreviewFallback(env = process.env) {
  const environment = typeof env?.SAFEFLOW_ENVIRONMENT === 'string'
    ? env.SAFEFLOW_ENVIRONMENT.trim().toLowerCase()
    : 'simulation';

  return FALLBACK_ALLOWED_ENVIRONMENTS.has(environment);
}

export function classifySimulationProvider(source) {
  const normalized = normaliseProviderId(source).toLowerCase();

  if (normalized.includes('placeholder')) {
    return 'placeholder';
  }
  if (normalized.includes('postgresql')) {
    return 'database-read-model';
  }
  if (normalized.includes('local') || normalized.includes('fixture')) {
    return 'fixture';
  }

  return 'simulation-provider';
}

function normaliseProviderId(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : 'unknown-simulation-provider';
}
