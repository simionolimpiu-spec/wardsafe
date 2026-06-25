import { describe, expect, it, vi } from 'vitest';
import { createApiHandler } from './api.js';

function createJsonRequest({ method = 'POST', path = '/api/drafts/sbar', body = {} } = {}) {
  return {
    method,
    url: path,
    async json() {
      return body;
    }
  };
}

function createJsonResponse() {
  const response = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload = '') {
      this.body = payload;
    }
  };
  return response;
}

describe('createApiHandler', () => {
  it('returns the fictional simulation workspace snapshot', async () => {
    const handler = createApiHandler();
    const req = createJsonRequest({ method: 'GET', path: '/api/simulation/workspace' });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      }
    });
    expect(payload.workspace.patients).toEqual(expect.arrayContaining([
      expect.objectContaining({ syntheticPatientRef: 'DCU-031' })
    ]));
    expect(serializedPayload).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
  });

  it('creates an SBAR draft for a known fictional patient', async () => {
    const provider = {
      createSbarDraft: vi.fn().mockResolvedValue({
        provider: 'openai',
        sections: {
          situation: 'OpenAI draft',
          background: 'Visible evidence',
          assessment: 'Assessment',
          recommendation: 'Clarify the plan.'
        },
        evidenceLinks: ['labs.potassium'],
        isEditable: true
      })
    };
    const handler = createApiHandler({ provider });
    const req = createJsonRequest({ body: { patientId: 'DCU-031' } });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(provider.createSbarDraft).toHaveBeenCalledWith(expect.objectContaining({
      patient: expect.objectContaining({ id: 'DCU-031' }),
      flag: expect.objectContaining({ title: expect.stringMatching(/electrolyte/i) })
    }));
    expect(payload.draft.provider).toBe('openai');
  });

  it('returns a deterministic fallback draft when the provider fails', async () => {
    const provider = {
      createSbarDraft: vi.fn().mockRejectedValue(new Error('provider unavailable'))
    };
    const handler = createApiHandler({ provider });
    const req = createJsonRequest({ body: { patientId: 'DCU-031' } });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(payload.fallbackUsed).toBe(true);
    expect(payload.draft.provider).toBe('deterministic');
    expect(payload.draft.sections.situation).toContain('DCU-031');
  });
});
