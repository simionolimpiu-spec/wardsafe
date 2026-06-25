import { describe, expect, it, vi } from 'vitest';
import { requestWorkspaceSnapshot } from './workspaceClient.js';

describe('requestWorkspaceSnapshot', () => {
  it('returns API workspace metadata when the simulation endpoint responds', async () => {
    const apiSnapshot = {
      product: 'SafeFlow',
      source: 'postgresql-simulation-read-model',
      simulationOnly: true,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      workspace: {
        summary: { patientCount: 5, openTaskCount: 4, activeEscalationCount: 2 }
      }
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiSnapshot)
    });

    await expect(requestWorkspaceSnapshot({ fetchImpl: fetch })).resolves.toEqual(apiSnapshot);
    expect(fetch).toHaveBeenCalledWith('/api/simulation/workspace', {
      headers: { Accept: 'application/json' }
    });
  });

  it('returns null when the API is unavailable or the response is not simulation-safe', async () => {
    const unavailable = vi.fn().mockRejectedValue(new Error('offline'));
    const unsafe = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ product: 'SafeFlow', simulationOnly: false })
    });

    await expect(requestWorkspaceSnapshot({ fetchImpl: unavailable })).resolves.toBeNull();
    await expect(requestWorkspaceSnapshot({ fetchImpl: unsafe })).resolves.toBeNull();
  });
});
