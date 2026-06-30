import { describe, expect, it, vi } from 'vitest';
import { runPreviewApiSmoke } from './previewApiSmoke.js';

function jsonResponse(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': 'https://preview.example.com',
      ...headers
    }
  });
}

describe('runPreviewApiSmoke', () => {
  it('checks the hosted preview gate and simulation API contract', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, options = {}) => {
      calls.push({ url, options });

      switch (calls.length) {
        case 1:
          return jsonResponse(401, { error: 'Preview access token required.' });
        case 2:
          return jsonResponse(200, {
            service: 'SafeFlow API',
            environment: 'simulation',
            simulationOnly: true,
            noLivePatientData: true,
            publicIngress: true
          });
        case 3:
          return jsonResponse(200, {
            product: 'SafeFlow',
            simulationOnly: true,
            source: 'postgresql-simulation-read-model',
            safetyBoundary: {
              noLivePatientData: true,
              directCareIdentifiers: false,
              humanReviewRequired: true
            },
            workspace: {
              patients: [{ syntheticPatientRef: 'DCU-031' }]
            }
          });
        case 4:
          return jsonResponse(200, {
            product: 'SafeFlow',
            environment: 'simulation',
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
            providerMetadata: {
              signals: {
                providerId: 'private-lambda-signals-placeholder',
                provider: 'placeholder'
              },
              suggestions: {
                providerId: 'private-lambda-risk-suggestions-placeholder',
                provider: 'placeholder'
              }
            },
            database: {
              configured: true,
              guardedBySimulationOnly: true
            },
            migrations: {
              approved: true
            }
          });
        case 5:
          return jsonResponse(200, {
            product: 'SafeFlow',
            source: 'private-lambda-signals-placeholder',
            provider: 'placeholder',
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
            signals: [{ signalId: 'signal-1' }]
          });
        case 6:
          return jsonResponse(200, {
            product: 'SafeFlow',
            source: 'private-lambda-risk-suggestions-placeholder',
            provider: 'placeholder',
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
            suggestions: [{ suggestionId: 'suggestion-1' }]
          });
        case 7:
          return jsonResponse(200, {
            product: 'SafeFlow',
            simulationOnly: true,
            source: 'postgresql-simulation-audit-events',
            safetyBoundary: {
              noLivePatientData: true,
              directCareIdentifiers: false,
              humanReviewRequired: true
            },
            events: []
          });
        case 8:
          return jsonResponse(201, {
            event: {
              product: 'SafeFlow',
              simulationOnly: true,
              source: 'postgresql-simulation-audit-events',
              syntheticPatientRef: 'DCU-031'
            }
          });
        default:
          throw new Error(`Unexpected request ${calls.length}`);
      }
    });
    const messages = [];

    const result = await runPreviewApiSmoke({
      baseUrl: 'https://preview-api.example.com/',
      previewAccessToken: 'safe-preview-token-for-review-12345',
      fetchImpl,
      log(message) {
        messages.push(message);
      }
    });

    expect(result).toEqual({
      health: 'ok',
      corsOrigin: 'https://preview.example.com',
      workspace: 'postgresql-simulation-read-model',
      readiness: 'approved',
      signals: 1,
      signalProvider: 'placeholder',
      suggestions: 1,
      suggestionProvider: 'placeholder',
      auditRead: 'postgresql-simulation-audit-events',
      auditWrite: 201,
      smokeScope: 'availability-and-schema-only'
    });
    expect(calls[0].options.headers['X-SafeFlow-Preview-Token']).toBeUndefined();
    expect(calls[1].options.headers['X-SafeFlow-Preview-Token']).toBe('safe-preview-token-for-review-12345');
    expect(messages).toEqual(expect.arrayContaining([
      expect.stringContaining('/api/health preview gate rejects missing token'),
      expect.stringContaining('/api/simulation/workspace'),
      expect.stringContaining('/api/simulation/readiness'),
      expect.stringContaining('/api/simulation/signals placeholder'),
      expect.stringContaining('/api/simulation/risk-suggestions placeholder'),
      expect.stringContaining('/api/simulation/audit-events')
    ]));
  });

  it('requires a preview API URL before running', async () => {
    await expect(runPreviewApiSmoke({
      baseUrl: '',
      expectPreviewAccessGate: false,
      fetchImpl: vi.fn()
    })).rejects.toThrow(/SAFEFLOW_PREVIEW_API_URL/);
  });
});
