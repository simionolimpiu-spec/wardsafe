export async function requestReadinessReport({ fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl) return null;

  try {
    const response = await fetchImpl('/api/simulation/readiness', {
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
