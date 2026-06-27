import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildMigrationManifest } from '../database/migrationManifest.js';

function readMigrationApproval() {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), 'database/migrationApproval.json'), 'utf8'));
  } catch {
    return null;
  }
}

function migrationApprovalMatches(manifest, approval) {
  if (!approval?.approved || approval.simulationOnly !== true) return false;

  return manifest.migrations.every((migration) => {
    const approvedMigration = approval.migrations?.find((item) => item.path === migration.path);

    return approvedMigration?.sha256 === migration.sha256 &&
      approvedMigration?.bytes === migration.bytes &&
      approvedMigration?.simulationOnly === true;
  });
}

function createMigrationStatus() {
  const manifest = buildMigrationManifest();
  const approval = readMigrationApproval();

  return {
    manifestVersion: manifest.manifestVersion,
    approved: migrationApprovalMatches(manifest, approval),
    count: manifest.migrations.length,
    simulationOnly: manifest.simulationOnly,
    sources: manifest.migrations.map((migration) => ({
      path: migration.path,
      phase: migration.phase,
      simulationOnly: migration.simulationOnly
    }))
  };
}

function providerId(provider, fallback) {
  return provider?.id ?? fallback;
}

export function createSimulationReadinessReport({
  draftProvider,
  workspaceProvider,
  auditEventProvider,
  env = process.env
} = {}) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'local',
    simulationOnly: true,
    safetyBoundary: {
      noLivePatientData: true,
      directCareIdentifiers: false,
      humanReviewRequired: true
    },
    providers: {
      draft: providerId(draftProvider, 'deterministic'),
      workspace: providerId(workspaceProvider, 'local-fictional-fixture'),
      audit: providerId(auditEventProvider, 'local-audit-fixture')
    },
    database: {
      configured: Boolean(env.DATABASE_URL || env.DATABASE_SECRET_ARN),
      guardedBySimulationOnly: env.SAFEFLOW_SIMULATION_ONLY === 'true'
    },
    migrations: createMigrationStatus()
  };
}
