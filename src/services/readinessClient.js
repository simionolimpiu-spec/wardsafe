import { buildApiUrl } from './apiBaseUrl.js';

export async function requestReadinessReport({
  fetchImpl = globalThis.fetch,
  env = import.meta.env
} = {}) {
  if (!fetchImpl) return null;

  try {
    const response = await fetchImpl(buildApiUrl('/api/simulation/readiness', { env }), {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;

    const report = await response.json();
    if (
      report?.product !== 'SafeFlow' ||
      report.simulationOnly !== true ||
      report.safetyBoundary?.noLivePatientData !== true ||
      report.safetyBoundary?.directCareIdentifiers !== false
    ) {
      return null;
    }

    return report;
  } catch {
    return null;
  }
}
