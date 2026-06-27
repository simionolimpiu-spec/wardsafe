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
  it('returns simulation readiness without exposing provider secrets', async () => {
    const provider = { id: 'deterministic', createSbarDraft: vi.fn() };
    const workspaceProvider = {
      id: 'local-fictional-fixture',
      getSnapshot: vi.fn()
    };
    const auditEventProvider = { id: 'local-audit-fixture', recordEvent: vi.fn() };
    const signalProvider = { id: 'local-simulation-signals', listPatientSignals: vi.fn() };
    const suggestionProvider = { id: 'local-simulation-risk-suggestions', listRiskSuggestions: vi.fn() };
    const handler = createApiHandler({
      provider,
      workspaceProvider,
      auditEventProvider,
      signalProvider,
      suggestionProvider,
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://secret@example/safeflow',
        OPENAI_API_KEY: 'sk-secret'
      }
    });
    const req = createJsonRequest({ method: 'GET', path: '/api/simulation/readiness' });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(200);
    expect(payload.providers).toEqual({
      draft: 'deterministic',
      workspace: 'local-fictional-fixture',
      audit: 'local-audit-fixture',
      signals: 'local-simulation-signals',
      suggestions: 'local-simulation-risk-suggestions'
    });
    expect(payload.migrations.approved).toBe(true);
    expect(serializedPayload).not.toContain('postgres://');
    expect(serializedPayload).not.toContain('sk-secret');
  });

  it('uses configured database providers by default when simulation database mode is set', async () => {
    const handler = createApiHandler({
      provider: { id: 'deterministic', createSbarDraft: vi.fn() },
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://secret-user:secret-pass@example/safeflow'
      }
    });
    const req = createJsonRequest({ method: 'GET', path: '/api/simulation/readiness' });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(200);
    expect(payload.providers).toMatchObject({
      workspace: 'postgresql-simulation-read-model',
      audit: 'postgresql-simulation-audit-events',
      signals: 'postgresql-simulation-signals',
      suggestions: 'postgresql-simulation-risk-suggestions'
    });
    expect(payload.database).toMatchObject({
      configured: true,
      guardedBySimulationOnly: true
    });
    expect(serializedPayload).not.toContain('secret-pass');
    expect(serializedPayload).not.toContain('postgres://');
  });

  it('returns the fictional simulation workspace snapshot', async () => {
    const workspaceProvider = {
      getSnapshot: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        workspace: {
          patients: [{ syntheticPatientRef: 'DCU-031' }]
        }
      })
    };
    const handler = createApiHandler({ workspaceProvider });
    const req = createJsonRequest({ method: 'GET', path: '/api/simulation/workspace' });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(200);
    expect(workspaceProvider.getSnapshot).toHaveBeenCalledTimes(1);
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

  it('records a simulation audit event through the configured audit provider', async () => {
    const auditEventProvider = {
      recordEvent: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        source: 'local-audit-fixture',
        id: 'audit-local-1',
        syntheticPatientRef: 'DCU-031',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed',
        occurredAt: '2026-06-10T09:15:00.000Z'
      })
    };
    const handler = createApiHandler({ auditEventProvider });
    const req = createJsonRequest({
      method: 'POST',
      path: '/api/simulation/audit-events',
      body: {
        patientId: 'DCU-031',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed',
        actorRole: 'charge_nurse',
        sourceTable: 'tasks',
        metadata: { screen: 'tasks' }
      }
    });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(201);
    expect(auditEventProvider.recordEvent).toHaveBeenCalledWith({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed',
      actorRole: 'charge_nurse',
      sourceTable: 'tasks',
      metadata: { screen: 'tasks' }
    });
    expect(payload.event).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      syntheticPatientRef: 'DCU-031'
    });
    expect(serializedPayload).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
  });

  it('lists simulation audit events through the configured audit provider', async () => {
    const auditEventProvider = {
      id: 'local-audit-fixture',
      listEvents: vi.fn().mockResolvedValue([
        {
          product: 'SafeFlow',
          simulationOnly: true,
          source: 'local-audit-fixture',
          id: 'audit-local-1',
          syntheticPatientRef: 'DCU-031',
          eventType: 'task.completed',
          eventSummary: 'Fictional task completed',
          occurredAt: '2026-06-10T09:15:00.000Z',
          metadata: { actorRole: 'charge_nurse', screen: 'tasks' }
        }
      ])
    };
    const handler = createApiHandler({ auditEventProvider });
    const req = createJsonRequest({
      method: 'GET',
      path: '/api/simulation/audit-events'
    });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(200);
    expect(auditEventProvider.listEvents).toHaveBeenCalledWith({ limit: 25 });
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'local-audit-fixture',
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      events: [
        expect.objectContaining({
          syntheticPatientRef: 'DCU-031',
          eventType: 'task.completed'
        })
      ]
    });
    expect(serializedPayload).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
  });

  it('returns a simulation signal timeline through the configured signal provider', async () => {
    const signalProvider = {
      id: 'local-simulation-signals',
      listPatientSignals: vi.fn().mockResolvedValue([
        {
          signalId: 'signal-dcu-031-potassium-0910',
          syntheticPatientRef: 'DCU-031',
          sourceType: 'lab',
          simulationOnly: true
        }
      ])
    };
    const handler = createApiHandler({ signalProvider });
    const req = createJsonRequest({
      method: 'GET',
      path: '/api/simulation/signals?patientId=DCU-031'
    });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);
    const serializedPayload = JSON.stringify(payload);

    expect(res.statusCode).toBe(200);
    expect(signalProvider.listPatientSignals).toHaveBeenCalledWith({ patientId: 'DCU-031' });
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'local-simulation-signals',
      signals: [expect.objectContaining({ syntheticPatientRef: 'DCU-031', simulationOnly: true })]
    });
    expect(serializedPayload).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
  });

  it('returns nurse-reviewed risk suggestions through the configured suggestion provider', async () => {
    const suggestionProvider = {
      id: 'local-simulation-risk-suggestions',
      listRiskSuggestions: vi.fn().mockResolvedValue([
        {
          suggestionId: 'suggestion-dcu-031-electrolyte-review',
          syntheticPatientRef: 'DCU-031',
          requiresHumanReview: true,
          simulationOnly: true
        }
      ])
    };
    const handler = createApiHandler({ suggestionProvider });
    const req = createJsonRequest({
      method: 'GET',
      path: '/api/simulation/risk-suggestions?patientId=DCU-031'
    });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(suggestionProvider.listRiskSuggestions).toHaveBeenCalledWith({ patientId: 'DCU-031' });
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'local-simulation-risk-suggestions',
      suggestions: [expect.objectContaining({
        suggestionId: 'suggestion-dcu-031-electrolyte-review',
        requiresHumanReview: true
      })]
    });
  });

  it('records a nurse confirmation action for a risk suggestion', async () => {
    const suggestionProvider = {
      recordSuggestionAction: vi.fn().mockResolvedValue({
        actionId: 'action-1',
        suggestionId: 'suggestion-dcu-031-electrolyte-review',
        status: 'accepted',
        actionType: 'accepted'
      })
    };
    const handler = createApiHandler({ suggestionProvider });
    const req = createJsonRequest({
      method: 'POST',
      path: '/api/simulation/risk-suggestions/suggestion-dcu-031-electrolyte-review/actions',
      body: {
        actionType: 'accepted',
        actionReason: 'Charge nurse reviewed fictional evidence',
        actorRef: 'fictional-user-laura-bennett'
      }
    });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(suggestionProvider.recordSuggestionAction).toHaveBeenCalledWith({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      actorRef: 'fictional-user-laura-bennett'
    });
    expect(payload.action).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      status: 'accepted'
    });
  });

  it('rejects unsafe simulation audit payloads without storing them', async () => {
    const auditEventProvider = {
      recordEvent: vi.fn()
    };
    const handler = createApiHandler({ auditEventProvider });
    const req = createJsonRequest({
      method: 'POST',
      path: '/api/simulation/audit-events',
      body: {
        patientId: 'DCU-031',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed',
        metadata: { nhs_number: '000 000 0000' }
      }
    });
    const res = createJsonResponse();

    await handler(req, res);
    const payload = JSON.parse(res.body);

    expect(res.statusCode).toBe(400);
    expect(payload.error).toMatch(/audit event rejected/i);
    expect(auditEventProvider.recordEvent).not.toHaveBeenCalled();
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
