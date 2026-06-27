import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

const seed = readFileSync(resolve(process.cwd(), 'database/seed.sql'), 'utf8');

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

  it('includes the approved simulation signal schema and seed content', () => {
    const manifest = buildMigrationManifest();
    const approval = createApprovedFixture(manifest);

    expect(approval.migrations.map((migration) => migration.path)).toEqual([
      'database/schema.sql',
      'database/seed.sql'
    ]);
    expect(manifest.migrations.every((migration) => migration.simulationOnly)).toBe(true);
    expect(JSON.stringify(manifest)).not.toMatch(/nhs_number|date_of_birth|postcode|address/i);
  });

  it('seeds fictional signal intelligence inputs with idempotent suggestion keys', () => {
    expect(seed).toMatch(/insert into clinical_signals\b/i);
    expect(seed).toMatch(/insert into risk_predictions\b/i);
    expect(seed).toMatch(/insert into risk_suggestions\b/i);
    expect(seed).toContain('simulation-ice');
    expect(seed).toContain('simulation-microbiology');
    expect(seed).toContain('on conflict (seed_key) do update');
    expect(seed).not.toMatch(/\bnhs_number\b|\bdate_of_birth\b|\bpostcode\b|\baddress\b/i);
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
