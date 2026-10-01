import { afterEach, describe, expect, it, vi } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from '../domain/safetyRules.js';
import { requestSbarDraft } from './draftClient.js';

describe('requestSbarDraft', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the API draft when the server provider responds', async () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const apiDraft = {
      provider: 'openai',
      model: 'gpt-5.5',
      isEditable: true,
      evidenceLinks: ['labs.potassium'],
      sections: {
        situation: 'API situation',
        background: 'API background',
        assessment: 'API assessment',
        recommendation: 'API recommendation'
      },
      boundary: flag.boundary
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ draft: apiDraft })
    });
    vi.stubGlobal('fetch', fetch);

    const draft = await requestSbarDraft({ patient, flag });

    expect(fetch).toHaveBeenCalledWith('/api/drafts/sbar', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id })
    }));
    expect(draft).toEqual(apiDraft);
  });

  it('uses the configured preview API base URL when provided', async () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        draft: {
          provider: 'deterministic',
          sections: {
            situation: 'Preview API',
            background: 'Preview background',
            assessment: 'Preview assessment',
            recommendation: 'Preview recommendation'
          }
        }
      })
    });

    await requestSbarDraft({
      patient,
      flag,
      fetchImpl: fetch,
      env: { VITE_SAFEFLOW_API_BASE_URL: 'https://preview-api.example.com/' }
    });

    expect(fetch).toHaveBeenCalledWith('https://preview-api.example.com/api/drafts/sbar', expect.any(Object));
  });

  it('includes the preview access token header for hosted preview draft requests', async () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        draft: {
          provider: 'deterministic',
          sections: {
            situation: 'Preview API',
            background: 'Preview background',
            assessment: 'Preview assessment',
            recommendation: 'Preview recommendation'
          }
        }
      })
    });

    await requestSbarDraft({
      patient,
      flag,
      fetchImpl: fetch,
      env: {
        VITE_SAFEFLOW_API_BASE_URL: 'https://preview-api.example.com/',
        VITE_SAFEFLOW_PREVIEW_ACCESS_TOKEN: 'preview-token-12345'
      }
    });

    expect(fetch).toHaveBeenCalledWith('https://preview-api.example.com/api/drafts/sbar', expect.objectContaining({
      headers: {
        'Content-Type': 'application/json',
        'X-SafeFlow-Preview-Token': 'preview-token-12345'
      }
    }));
  });

  it('falls back to the deterministic draft when the API is unavailable', async () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const draft = await requestSbarDraft({ patient, flag });

    expect(draft.provider).toBe('deterministic');
    expect(draft.sections.situation).toContain(patient.id);
  });
});
