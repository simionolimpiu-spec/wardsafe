import { describe, expect, it, vi } from 'vitest';
import {
  recordRiskSuggestionAction,
  requestRiskSuggestions,
  requestSignalTimeline
} from './signalClient.js';

describe('signalClient', () => {
  it('returns simulation-safe signal timelines and suggestions', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          product: 'SafeFlow',
          simulationOnly: true,
          signals: [{ signalId: 'signal-1', syntheticPatientRef: 'DCU-031', simulationOnly: true }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          product: 'SafeFlow',
          simulationOnly: true,
          suggestions: [{
            suggestionId: 'suggestion-1',
            syntheticPatientRef: 'DCU-031',
            requiresHumanReview: true,
            simulationOnly: true
          }]
        })
      });

    await expect(requestSignalTimeline({ patientId: 'DCU-031', fetchImpl })).resolves.toHaveLength(1);
    await expect(requestRiskSuggestions({ patientId: 'DCU-031', fetchImpl })).resolves.toHaveLength(1);
    expect(fetchImpl).toHaveBeenNthCalledWith(1, '/api/simulation/signals?patientId=DCU-031', {
      headers: { Accept: 'application/json' }
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(2, '/api/simulation/risk-suggestions?patientId=DCU-031', {
      headers: { Accept: 'application/json' }
    });
  });

  it('returns null for unsafe or unavailable responses', async () => {
    const unsafeEnvelope = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ product: 'SafeFlow', simulationOnly: false, signals: [] })
    });
    const unsafeSignal = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        signals: [{ signalId: 'signal-1', simulationOnly: false }]
      })
    });
    const unavailable = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(requestSignalTimeline({ patientId: 'DCU-031', fetchImpl: unsafeEnvelope })).resolves.toBeNull();
    await expect(requestSignalTimeline({ patientId: 'DCU-031', fetchImpl: unsafeSignal })).resolves.toBeNull();
    await expect(requestRiskSuggestions({ patientId: 'DCU-031', fetchImpl: unavailable })).resolves.toBeNull();
  });

  it('posts nurse confirmation actions', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        action: {
          suggestionId: 'suggestion-1',
          status: 'accepted',
          actionType: 'accepted'
        }
      })
    });

    await expect(recordRiskSuggestionAction({
      suggestionId: 'suggestion-1',
      actionType: 'accepted',
      actionReason: 'Reviewed',
      fetchImpl
    })).resolves.toEqual({
      suggestionId: 'suggestion-1',
      status: 'accepted',
      actionType: 'accepted'
    });
    expect(fetchImpl).toHaveBeenCalledWith('/api/simulation/risk-suggestions/suggestion-1/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType: 'accepted',
        actionReason: 'Reviewed',
        actorRef: 'fictional-user-laura-bennett'
      })
    });
  });
});
