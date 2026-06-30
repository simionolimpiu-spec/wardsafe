import { buildApiUrl, createApiHeaders } from './apiBaseUrl.js';

const PREVIEW_VALIDATION_STATUS = 'not-clinically-validated';

export async function requestReadinessReport({
  fetchImpl = globalThis.fetch,
  env = import.meta.env
} = {}) {
  if (!fetchImpl) return null;

  try {
    const response = await fetchImpl(buildApiUrl('/api/simulation/readiness', { env }), {
      headers: createApiHeaders({ Accept: 'application/json' }, { env })
    });
    if (!response.ok) return null;

    const report = await response.json();
    if (
      report?.product !== 'SafeFlow' ||
      report.mode !== 'simulation' ||
      report.simulationOnly !== true ||
      report.clinicalUse !== false ||
      report.validationStatus !== PREVIEW_VALIDATION_STATUS ||
      !isPreviewExplanation(report.explanation) ||
      report.safetyBoundary?.noLivePatientData !== true ||
      report.safetyBoundary?.directCareIdentifiers !== false ||
      typeof report.providerMetadata?.signals?.provider !== 'string' ||
      typeof report.providerMetadata?.suggestions?.provider !== 'string'
    ) {
      return null;
    }

    return report;
  } catch {
    return null;
  }
}

function isPreviewExplanation(value) {
  return typeof value === 'string' &&
    /preview only/i.test(value) &&
    /not clinically validated/i.test(value) &&
    /not for clinical decision-making/i.test(value);
}
