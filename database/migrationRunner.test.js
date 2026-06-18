import { describe, expect, it, vi } from 'vitest';
import { buildMigrationManifest } from './migrationManifest.js';
import {
  createApprovalFromManifest,
  loadMigrationApproval,
  planMigrationRun,
  runMigration,
  validateMigrationGates
} from './migrationRunner.js';

function createApprovedFixture(manifest = buildMigrationManifest()) {
  return createApprovalFromManifest(manifest, {
    approvedBy: 'SafeFlow build steward',
    approvalReason: 'Simulation-only database bootstrap approved for local review.'
  });
}

describe('SafeFlow migration runner', () => {
  it('loads the checked approval file for the current manifest', () => {
    const approval = loadMigrationApproval();

    expect(() => validateMigrationGates({
      manifest: buildMigrationManifest(),
      approval,
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true'
      },
      mode: 'dry-run'
    })).not.toThrow();
  });

  it('refuses to plan unless the simulation-only gate is set', () => {
    expect(() => planMigrationRun({
      manifest: buildMigrationManifest(),
      approval: createApprovedFixture(),
      env: {},
      mode: 'dry-run'
    })).toThrow(/SAFEFLOW_SIMULATION_ONLY=true/);
  });

  it('refuses execute mode unless explicit migration approval is set', () => {
    expect(() => planMigrationRun({
      manifest: buildMigrationManifest(),
      approval: createApprovedFixture(),
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true'
      },
      mode: 'execute'
    })).toThrow(/SAFEFLOW_MIGRATION_APPROVED=true/);
  });

  it('rejects approval files that do not match the current manifest checksums', () => {
    const approval = createApprovedFixture();
    approval.migrations[0].sha256 = '0'.repeat(64);

    expect(() => planMigrationRun({
      manifest: buildMigrationManifest(),
      approval,
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true'
      },
      mode: 'dry-run'
    })).toThrow(/does not match approved checksum/);
  });

  it('rejects approval files with extra stale migrations', () => {
    const approval = createApprovedFixture();
    approval.migrations.push({
      path: 'database/old-live-export.sql',
      phase: 'seed',
      simulationOnly: true,
      bytes: 12,
      sha256: '1'.repeat(64)
    });

    expect(() => planMigrationRun({
      manifest: buildMigrationManifest(),
      approval,
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true'
      },
      mode: 'dry-run'
    })).toThrow(/exactly match the current manifest/);
  });

  it('rejects approval files with migrations in the wrong order', () => {
    const approval = createApprovedFixture();
    approval.migrations.reverse();

    expect(() => planMigrationRun({
      manifest: buildMigrationManifest(),
      approval,
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true'
      },
      mode: 'dry-run'
    })).toThrow(/approval order/);
  });

  it('dry-runs the approved ordered migration plan without touching a client', async () => {
    const client = {
      query: vi.fn()
    };
    const result = await runMigration({
      client,
      manifest: buildMigrationManifest(),
      approval: createApprovedFixture(),
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true'
      },
      mode: 'dry-run'
    });

    expect(result.mode).toBe('dry-run');
    expect(result.migrations.map((migration) => migration.path)).toEqual([
      'database/schema.sql',
      'database/seed.sql'
    ]);
    expect(client.query).not.toHaveBeenCalled();
  });

  it('executes approved migrations in a transaction in manifest order', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({})
    };

    await runMigration({
      client,
      manifest: buildMigrationManifest(),
      approval: createApprovedFixture(),
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        SAFEFLOW_MIGRATION_APPROVED: 'true'
      },
      mode: 'execute',
      readSource: (path) => `-- ${path}`
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'begin');
    expect(client.query).toHaveBeenNthCalledWith(2, '-- database/schema.sql');
    expect(client.query).toHaveBeenNthCalledWith(3, '-- database/seed.sql');
    expect(client.query).toHaveBeenNthCalledWith(4, 'commit');
  });

  it('rolls back the transaction when an approved migration fails', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('schema failed'))
        .mockResolvedValueOnce({})
    };

    await expect(runMigration({
      client,
      manifest: buildMigrationManifest(),
      approval: createApprovedFixture(),
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        SAFEFLOW_MIGRATION_APPROVED: 'true'
      },
      mode: 'execute',
      readSource: (path) => `-- ${path}`
    })).rejects.toThrow(/schema failed/);

    expect(client.query).toHaveBeenLastCalledWith('rollback');
  });
});
