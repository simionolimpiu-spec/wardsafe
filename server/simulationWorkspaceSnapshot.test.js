import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSimulationWorkspaceSnapshot } from './simulationWorkspaceSnapshot.js';

const projectionSql = readFileSync(
  resolve(process.cwd(), 'database/queries/simulationWorkspace.sql'),
  'utf8'
);

describe('simulation workspace snapshot', () => {
  it('projects the fictional workspace into an API-safe contract', () => {
    const snapshot = createSimulationWorkspaceSnapshot();

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      product: 'SafeFlow',
      simulationOnly: true,
      safetyBoundary: {
        noLivePatientData: true,
        directCareIdentifiers: false,
        humanReviewRequired: true
      }
    });
    expect(snapshot.workspace.patients).toHaveLength(5);
    expect(snapshot.workspace.summary.openTaskCount).toBeGreaterThan(0);
    expect(snapshot.workspace.summary.activeEscalationCount).toBeGreaterThan(0);
    expect(snapshot.workspace.auditEvents[0]).toEqual(expect.objectContaining({
      label: expect.any(String),
      patientId: expect.stringMatching(/^DCU-/)
    }));
  });

  it('does not expose direct patient identifiers in the serialized contract', () => {
    const serialized = JSON.stringify(createSimulationWorkspaceSnapshot());

    expect(serialized).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
    expect(serialized).toContain('DCU-031');
    expect(serialized).toContain('fictional');
  });

  it('documents the PostgreSQL read model as fictional-only', () => {
    expect(projectionSql).toMatch(/fictional_scenario\s+is\s+true/i);
    expect(projectionSql).toMatch(/synthetic_patient_ref/i);
    expect(projectionSql).toMatch(/jsonb_build_object/i);
    expect(projectionSql).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
  });
});
