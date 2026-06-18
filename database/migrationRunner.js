import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildMigrationManifest, readMigrationSource } from './migrationManifest.js';

export const migrationApprovalPath = 'database/migrationApproval.json';

export function createApprovalFromManifest(manifest, {
  approvedBy,
  approvalReason
} = {}) {
  return {
    approvalVersion: 1,
    product: manifest.product,
    simulationOnly: manifest.simulationOnly,
    approved: true,
    approvedBy,
    approvalReason,
    migrations: manifest.migrations.map((migration) => ({
      path: migration.path,
      phase: migration.phase,
      simulationOnly: migration.simulationOnly,
      bytes: migration.bytes,
      sha256: migration.sha256
    }))
  };
}

export function loadMigrationApproval(path = migrationApprovalPath) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
}

function assertMigrationError(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateMigrationGates({
  manifest = buildMigrationManifest(),
  approval = loadMigrationApproval(),
  env = process.env,
  mode = 'dry-run'
} = {}) {
  assertMigrationError(manifest.product === 'SafeFlow', 'Migration manifest must target SafeFlow.');
  assertMigrationError(manifest.simulationOnly === true, 'Migration manifest must be simulation-only.');
  assertMigrationError(
    manifest.migrations.every((migration) => migration.simulationOnly === true),
    'Every migration source must be marked simulation-only.'
  );
  assertMigrationError(approval.approved === true, 'Migration approval file must be explicitly approved.');
  assertMigrationError(approval.product === manifest.product, 'Migration approval product does not match manifest.');
  assertMigrationError(approval.simulationOnly === true, 'Migration approval must be simulation-only.');
  assertMigrationError(
    env.SAFEFLOW_SIMULATION_ONLY === 'true',
    'Set SAFEFLOW_SIMULATION_ONLY=true before planning or running SafeFlow migrations.'
  );

  if (mode === 'execute') {
    assertMigrationError(
      env.SAFEFLOW_MIGRATION_APPROVED === 'true',
      'Set SAFEFLOW_MIGRATION_APPROVED=true before executing SafeFlow migrations.'
    );
  }

  assertMigrationError(
    approval.migrations.length === manifest.migrations.length,
    'Migration approval entries must exactly match the current manifest.'
  );

  for (const [index, migration] of manifest.migrations.entries()) {
    const approvedMigration = approval.migrations[index];

    assertMigrationError(approvedMigration, `Migration ${migration.path} is missing from the approval file.`);
    assertMigrationError(
      approvedMigration.path === migration.path,
      `Migration approval order does not match the current manifest at position ${index + 1}.`
    );
    assertMigrationError(
      approvedMigration.phase === migration.phase,
      `Migration ${migration.path} phase does not match approval.`
    );
    assertMigrationError(
      approvedMigration.bytes === migration.bytes,
      `Migration ${migration.path} byte length does not match approval.`
    );
    assertMigrationError(
      approvedMigration.sha256 === migration.sha256,
      `Migration ${migration.path} does not match approved checksum.`
    );
  }

  return true;
}

export function planMigrationRun({
  manifest = buildMigrationManifest(),
  approval = loadMigrationApproval(),
  env = process.env,
  mode = 'dry-run'
} = {}) {
  validateMigrationGates({ manifest, approval, env, mode });

  return {
    product: manifest.product,
    simulationOnly: manifest.simulationOnly,
    mode,
    migrations: manifest.migrations.map((migration, index) => ({
      order: index + 1,
      path: migration.path,
      phase: migration.phase,
      sha256: migration.sha256,
      bytes: migration.bytes
    }))
  };
}

export async function runMigration({
  client,
  manifest = buildMigrationManifest(),
  approval = loadMigrationApproval(),
  env = process.env,
  mode = 'dry-run',
  readSource = readMigrationSource
} = {}) {
  const plan = planMigrationRun({ manifest, approval, env, mode });

  if (mode === 'dry-run') {
    return plan;
  }

  assertMigrationError(client?.query, 'A PostgreSQL client with query(sql) is required for execute mode.');

  await client.query('begin');
  try {
    for (const migration of plan.migrations) {
      await client.query(readSource(migration.path));
    }
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  }

  return plan;
}
