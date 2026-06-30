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

  it('includes the preview access token header for hosted preview workspace requests', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        workspace: {
          summary: { patientCount: 5 }
        }
      })
    });

    await requestWorkspaceSnapshot({
      fetchImpl: fetch,
      env: {
        VITE_SAFEFLOW_API_BASE_URL: 'https://preview-api.example.com/',
        VITE_SAFEFLOW_PREVIEW_ACCESS_TOKEN: 'preview-token-12345'
      }
    });

    expect(fetch).toHaveBeenCalledWith('https://preview-api.example.com/api/simulation/workspace', {
      headers: {
        Accept: 'application/json',
        'X-SafeFlow-Preview-Token': 'preview-token-12345'
      }
    });
  });
});
