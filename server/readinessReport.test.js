import { describe, expect, it } from 'vitest';
import { createSimulationReadinessReport } from './readinessReport.js';

describe('simulation readiness report', () => {
  it('summarizes provider modes and approved migration status without exposing secrets', () => {
    const report = createSimulationReadinessReport({
      draftProvider: { id: 'deterministic' },
      workspaceProvider: { id: 'postgresql-simulation-read-model' },
      auditEventProvider: { id: 'postgresql-simulation-audit-events' },
      signalProvider: { id: 'postgresql-simulation-signals' },
      suggestionProvider: { id: 'postgresql-simulation-risk-suggestions' },
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://secret-user:secret-pass@example/safeflow',
        OPENAI_API_KEY: 'sk-secret'
      }
    });
    const serialized = JSON.stringify(report);

    expect(report).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      },
      providers: {
        draft: 'deterministic',
        workspace: 'postgresql-simulation-read-model',
        audit: 'postgresql-simulation-audit-events',
        signals: 'postgresql-simulation-signals',
        suggestions: 'postgresql-simulation-risk-suggestions'
      },
      database: {
        configured: true,
        guardedBySimulationOnly: true
      },
      migrations: {
        approved: true,
        count: 2,
        simulationOnly: true
      }
    });
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('postgres://');
    expect(serialized).not.toContain('sk-secret');
  });
});
