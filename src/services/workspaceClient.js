export async function requestWorkspaceSnapshot({ fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl) return null;

  try {
    const response = await fetchImpl('/api/simulation/workspace', {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;

    const snapshot = await response.json();
    if (
      snapshot?.product !== 'SafeFlow' ||
      snapshot.simulationOnly !== true ||
      snapshot.safetyBoundary?.noLivePatientData !== true ||
      snapshot.safetyBoundary?.directCareIdentifiers !== false
    ) {
      return null;
    }

    return snapshot;
  } catch {
    return null;
  }
}
