import { describe, expect, it, vi } from 'vitest';
import {
  createDatabaseAuditEventProvider,
  createLocalAuditEventProvider
} from './auditEventProvider.js';

function createPoolFactory({ rows = [], error } = {}) {
  const query = vi.fn(async () => {
    if (error) throw error;
    return { rows };
  });
  const end = vi.fn(async () => {});
  const Pool = vi.fn(function Pool() {
    return { query, end };
  });

  return { Pool, query, end };
}

describe('audit event provider', () => {
  it('records a local public-safe simulation audit event', async () => {
    const provider = createLocalAuditEventProvider({
      now: () => '2026-06-10T09:15:00.000Z'
    });

    const event = await provider.recordEvent({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed for ward review',
      actorRole: 'charge_nurse',
      sourceTable: 'tasks',
      metadata: { screen: 'tasks' }
    });
    const serialized = JSON.stringify(event);

    expect(event).toEqual({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'local-audit-fixture',
      id: 'audit-local-1',
      syntheticPatientRef: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed for ward review',
      occurredAt: '2026-06-10T09:15:00.000Z',
      metadata: {
        actorRole: 'charge_nurse',
        screen: 'tasks'
      }
    });
    expect(serialized).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
    expect(serialized).not.toContain('postgres://');
    expect(serialized).not.toMatch(/\bsk-[A-Za-z0-9_-]{8,}/);
  });

  it('rejects unknown patients and direct identifier fields before storage', async () => {
    const provider = createLocalAuditEventProvider();

    await expect(provider.recordEvent({
      patientId: 'REAL-123',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed'
    })).rejects.toThrow(/known fictional patient/);

    await expect(provider.recordEvent({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed',
      metadata: { email: 'person@example.invalid' }
    })).rejects.toThrow(/direct identifier/i);
  });

  it('refuses database audit mode unless simulation-only mode and database URL are explicit', () => {
    const { Pool } = createPoolFactory();

    expect(() => createDatabaseAuditEventProvider({
      env: { DATABASE_URL: 'postgres://example/safeflow' },
      Pool
    })).toThrow(/SAFEFLOW_SIMULATION_ONLY=true/);
    expect(() => createDatabaseAuditEventProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true' },
      Pool
    })).toThrow(/DATABASE_URL/);
    expect(Pool).not.toHaveBeenCalled();
  });

  it('inserts parameterised audit events through the fictional patient reference and closes the pool', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{
        id: '6a66c078-58a9-46c2-b682-36885f75b131',
        event_type: 'task.completed',
        event_summary: 'Fictional task completed for ward review',
        synthetic_patient_ref: 'DCU-031',
        occurred_at: '2026-06-10T09:15:00.000Z'
      }]
    });
    const provider = createDatabaseAuditEventProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool
    });

    const event = await provider.recordEvent({
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed for ward review',
      actorRole: 'charge_nurse',
      sourceTable: 'tasks',
      metadata: { screen: 'tasks' }
    });

    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: 'postgres://example/safeflow',
      max: 1,
      application_name: 'safeflow-simulation-audit-events'
    }));
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('fictional_scenario is true'),
      [
        'DCU-031',
        'task.completed',
        'Fictional task completed for ward review',
        'tasks',
        JSON.stringify({ actorRole: 'charge_nurse', screen: 'tasks' })
      ]
    );
    expect(end).toHaveBeenCalledTimes(1);
    expect(event).toEqual({
      product: 'SafeFlow',
      simulationOnly: true,
      source: 'postgresql-simulation-audit-events',
      id: '6a66c078-58a9-46c2-b682-36885f75b131',
      syntheticPatientRef: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed for ward review',
      occurredAt: '2026-06-10T09:15:00.000Z'
    });
  });
});
