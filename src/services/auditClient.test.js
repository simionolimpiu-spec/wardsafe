import { describe, expect, it, vi } from 'vitest';
import { requestSimulationAuditEvent } from './auditClient.js';

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
