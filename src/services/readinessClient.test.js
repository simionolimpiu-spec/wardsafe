import { describe, expect, it, vi } from 'vitest';
import { requestReadinessReport } from './readinessClient.js';

describe('requestReadinessReport', () => {
  it('returns readiness when the API response is simulation-safe', async () => {
    const report = {
      product: 'SafeFlow',
      mode: 'simulation',
      simulationOnly: true,
      clinicalUse: false,
      validationStatus: 'not-clinically-validated',
      explanation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.',
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      migrations: { approved: true },
      providers: { draft: 'deterministic', workspace: 'local-fictional-fixture' },
      providerMetadata: {
        signals: { providerId: 'local-simulation-signals', provider: 'fixture' },
        suggestions: { providerId: 'local-simulation-risk-suggestions', provider: 'fixture' }
      }
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(report)
    });

    await expect(requestReadinessReport({ fetchImpl: fetch })).resolves.toEqual(report);
    expect(fetch).toHaveBeenCalledWith('/api/simulation/readiness', {
      headers: { Accept: 'application/json' }
    });
  });

  it('returns null for unavailable or unsafe readiness responses', async () => {
    const unavailable = vi.fn().mockRejectedValue(new Error('offline'));
    const unsafe = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ product: 'SafeFlow', simulationOnly: false })
    });

    await expect(requestReadinessReport({ fetchImpl: unavailable })).resolves.toBeNull();
    await expect(requestReadinessReport({ fetchImpl: unsafe })).resolves.toBeNull();
  });
});
