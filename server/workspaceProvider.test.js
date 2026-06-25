import { describe, expect, it, vi } from 'vitest';
import {
  createConfiguredWorkspaceProvider,
  createDatabaseWorkspaceProvider
} from './workspaceProvider.js';

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

describe('workspace provider', () => {
  it('uses the local fictional fixture when database access is not explicitly configured', async () => {
    const provider = createConfiguredWorkspaceProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true' }
    });

    const snapshot = await provider.getSnapshot();

    expect(provider.id).toBe('local-fictional-fixture');
    expect(snapshot.simulationOnly).toBe(true);
    expect(snapshot.source).toBe('local-fictional-fixture');
    expect(snapshot.workspace.patients[0].syntheticPatientRef).toBe('DCU-031');
  });

  it('refuses database mode unless simulation-only mode is explicit', () => {
    const { Pool } = createPoolFactory();

    expect(() => createDatabaseWorkspaceProvider({
      env: { DATABASE_URL: 'postgres://example/safeflow' },
      Pool
    })).toThrow(/SAFEFLOW_SIMULATION_ONLY=true/);
    expect(Pool).not.toHaveBeenCalled();
  });

  it('loads the workspace snapshot through the approved read model and closes the pool', async () => {
    const databaseSnapshot = {
      schemaVersion: 1,
      product: 'SafeFlow',
      simulationOnly: true,
      workspace: { patients: [] }
    };
    const { Pool, query, end } = createPoolFactory({
      rows: [{ workspace_snapshot: databaseSnapshot }]
    });
    const provider = createDatabaseWorkspaceProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool
    });

    const snapshot = await provider.getSnapshot();

    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: 'postgres://example/safeflow',
      max: 1,
      application_name: 'safeflow-simulation-workspace'
    }));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('fictional_scenario is true'));
    expect(end).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual({
      ...databaseSnapshot,
      source: 'postgresql-simulation-read-model'
    });
  });

  it('falls back to the local fixture when the configured database read fails', async () => {
    const { Pool } = createPoolFactory({ error: new Error('database unavailable') });
    const provider = createConfiguredWorkspaceProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool
    });

    const snapshot = await provider.getSnapshot();

    expect(provider.id).toBe('postgresql-simulation-read-model');
    expect(snapshot.source).toBe('local-fictional-fixture');
    expect(snapshot.workspace.patients).toEqual(expect.arrayContaining([
      expect.objectContaining({ syntheticPatientRef: 'DCU-031' })
    ]));
  });
});
