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

  it('lists local audit events newest first without unsafe fields', async () => {
    const provider = createLocalAuditEventProvider({
      now: () => '2026-06-10T09:15:00.000Z'
    });

    await provider.recordEvent({
      patientId: 'DCU-031',
      eventType: 'task.created',
      eventSummary: 'Fictional task created',
      sourceTable: 'tasks',
      metadata: { screen: 'tasks' }
    });
    await provider.recordEvent({
      patientId: 'DCU-028',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed',
      sourceTable: 'tasks',
      metadata: { screen: 'tasks' }
    });

    const events = await provider.listEvents({ limit: 1 });
    const serialized = JSON.stringify(events);

    expect(events).toEqual([
      expect.objectContaining({
        product: 'SafeFlow',
        simulationOnly: true,
        source: 'local-audit-fixture',
        syntheticPatientRef: 'DCU-028',
        eventType: 'task.completed',
        eventSummary: 'Fictional task completed'
      })
    ]);
    expect(serialized).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
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

  it('rejects secret-like metadata keys and values before storage', async () => {
    const provider = createLocalAuditEventProvider();
    const safeBase = {
      patientId: 'DCU-031',
      eventType: 'task.completed',
      eventSummary: 'Fictional task completed'
    };

    await expect(provider.recordEvent({
      ...safeBase,
      metadata: { password: 'plain-text-password' }
    })).rejects.toThrow(/unsafe/i);

    await expect(provider.recordEvent({
      ...safeBase,
      metadata: { note: 'person@example.invalid' }
    })).rejects.toThrow(/unsafe/i);

    await expect(provider.recordEvent({
      ...safeBase,
      metadata: { accessKey: 'AKIAIOSFODNN7EXAMPLE' }
    })).rejects.toThrow(/unsafe/i);

    await expect(provider.recordEvent({
      ...safeBase,
      metadata: { resource: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database' }
    })).rejects.toThrow(/unsafe/i);
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

  it('lists database audit events through the fictional patient reference and closes the pool', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{
        id: 'c4c2a276-302e-48f7-87a9-2891c01743b8',
        event_type: 'handover.saved',
        event_summary: 'Fictional handover saved',
        synthetic_patient_ref: 'DCU-044',
        occurred_at: new Date('2026-06-10T10:00:00.000Z'),
        metadata: { actorRole: 'charge_nurse', screen: 'handover' }
      }]
    });
    const provider = createDatabaseAuditEventProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool,
      listQueryPath: 'database/queries/listSimulationAuditEvents.sql'
    });

    const events = await provider.listEvents({ limit: 5 });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('fictional_scenario is true'),
      [5]
    );
    expect(end).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      {
        product: 'SafeFlow',
        simulationOnly: true,
        source: 'postgresql-simulation-audit-events',
        id: 'c4c2a276-302e-48f7-87a9-2891c01743b8',
        syntheticPatientRef: 'DCU-044',
        eventType: 'handover.saved',
        eventSummary: 'Fictional handover saved',
        occurredAt: '2026-06-10T10:00:00.000Z',
        metadata: { actorRole: 'charge_nurse', screen: 'handover' }
      }
    ]);
  });
});
