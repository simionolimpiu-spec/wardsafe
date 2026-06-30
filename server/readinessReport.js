import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildMigrationManifest } from '../database/migrationManifest.js';
import {
  SIMULATION_OUTPUT_EXPLANATION,
  SIMULATION_OUTPUT_VALIDATION_STATUS,
  createSimulationProviderMetadata
} from './simulationOutputMetadata.js';

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
  signalProvider,
  suggestionProvider,
  env = process.env
} = {}) {
  return {
    schemaVersion: 1,
    product: 'SafeFlow',
    environment: env.SAFEFLOW_ENVIRONMENT ?? 'local',
    mode: 'simulation',
    simulationOnly: true,
    clinicalUse: false,
    validationStatus: SIMULATION_OUTPUT_VALIDATION_STATUS,
    explanation: SIMULATION_OUTPUT_EXPLANATION,
    safetyBoundary: {
      noLivePatientData: true,
      directCareIdentifiers: false,
      humanReviewRequired: true
    },
    providers: {
      draft: providerId(draftProvider, 'deterministic'),
      workspace: providerId(workspaceProvider, 'local-fictional-fixture'),
      audit: providerId(auditEventProvider, 'local-audit-fixture'),
      signals: providerId(signalProvider, 'local-simulation-signals'),
      suggestions: providerId(suggestionProvider, 'local-simulation-risk-suggestions')
    },
    providerMetadata: {
      signals: createSimulationProviderMetadata({
        id: providerId(signalProvider, 'local-simulation-signals')
      }),
      suggestions: createSimulationProviderMetadata({
        id: providerId(suggestionProvider, 'local-simulation-risk-suggestions')
      })
    },
    database: {
      configured: Boolean(env.DATABASE_URL || env.DATABASE_SECRET_ARN),
      guardedBySimulationOnly: env.SAFEFLOW_SIMULATION_ONLY === 'true'
    },
    migrations: createMigrationStatus()
  };
}
