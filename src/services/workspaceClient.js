import { buildApiUrl, createApiHeaders } from './apiBaseUrl.js';

export async function requestWorkspaceSnapshot({
  fetchImpl = globalThis.fetch,
  env = import.meta.env
} = {}) {
  if (!fetchImpl) return null;

  try {
    const response = await fetchImpl(buildApiUrl('/api/simulation/workspace', { env }), {
      headers: createApiHeaders({ Accept: 'application/json' }, { env })
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
