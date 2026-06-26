import { describe, expect, it, vi } from 'vitest';
import {
  requestSimulationAuditEvent,
  requestSimulationAuditEvents
} from './auditClient.js';

describe('requestSimulationAuditEvent', () => {
  it('posts a public-safe simulation audit event and returns the server event', async () => {
    const serverEvent = {
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'local-audit-fixture',
      syntheticPatientRef: 'DCU-031',
      eventType: 'task.completed'
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ event: serverEvent })
    });

    await expect(requestSimulationAuditEvent({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed',
      actorRole: 'charge_nurse',
      sourceTable: 'tasks',
      metadata: { screen: 'tasks' },
      fetchImpl: fetch
    })).resolves.toEqual(serverEvent);

    expect(fetch).toHaveBeenCalledWith('/api/simulation/audit-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'DCU-031',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed',
        actorRole: 'charge_nurse',
        sourceTable: 'tasks',
        metadata: { screen: 'tasks' }
      })
    });
  });

  it('does not send direct identifier fields or accept unsafe responses', async () => {
    const fetch = vi.fn();
    await expect(requestSimulationAuditEvent({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed',
      metadata: { nhs_number: '000 000 0000' },
      fetchImpl: fetch
    })).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();

    const unsafeResponse = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        event: { product: 'SafeFlow', simulationOnly: false }
      })
    });

    await expect(requestSimulationAuditEvent({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed',
      fetchImpl: unsafeResponse
    })).resolves.toBeNull();
  });
});

describe('requestSimulationAuditEvents', () => {
  it('returns public-safe simulation audit events from the API', async () => {
    const apiPayload = {
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'local-audit-fixture',
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      events: [
        {
          product: 'SafeFlow',
          simulationOnly: true,
          source: 'local-audit-fixture',
          syntheticPatientRef: 'DCU-031',
          eventType: 'task.completed',
          eventSummary: 'Fictional task completed',
          occurredAt: '2026-06-10T09:15:00.000Z',
          metadata: { actorRole: 'charge_nurse', screen: 'tasks' }
        }
      ]
    };
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiPayload)
    });

    await expect(requestSimulationAuditEvents({ fetchImpl: fetch })).resolves.toEqual(apiPayload);
    expect(fetch).toHaveBeenCalledWith('/api/simulation/audit-events', {
      headers: { Accept: 'application/json' }
    });
  });

  it('returns null when the audit event response is unavailable or unsafe', async () => {
    const unavailable = vi.fn().mockRejectedValue(new Error('offline'));
    const unsafeEnvelope = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ product: 'SafeFlow', simulationOnly: false })
    });
    const unsafeEvent = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        product: 'SafeFlow',
        simulationOnly: true,
        safetyBoundary: {
          noLivePatientData: true,
          directCareIdentifiers: false,
          humanReviewRequired: true
        },
        events: [{ syntheticPatientRef: 'DCU-031', eventType: 'task.completed', metadata: { email: 'person@example.invalid' } }]
      })
    });

    await expect(requestSimulationAuditEvents({ fetchImpl: unavailable })).resolves.toBeNull();
    await expect(requestSimulationAuditEvents({ fetchImpl: unsafeEnvelope })).resolves.toBeNull();
    await expect(requestSimulationAuditEvents({ fetchImpl: unsafeEvent })).resolves.toBeNull();
  });
});
