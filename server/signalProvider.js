import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';
import { getDemoSignalFixtures } from '../src/data/demoScenarios.js';
import { allowsSimulationPreviewFallback } from './simulationOutputMetadata.js';

const SIGNAL_TIMELINE_QUERY_PATH = 'database/queries/simulationSignalTimeline.sql';

export function createLocalSignalProvider() {
  return {
    id: 'local-simulation-signals',
    async listPatientSignals({ patientId } = {}) {
      return clone(getDemoSignalFixtures())
        .filter((signal) => !patientId || signal.syntheticPatientRef === patientId)
        .sort((left, right) => right.effectiveAt.localeCompare(left.effectiveAt));
    }
  };
}

export function createDatabaseSignalProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig,
  queryPath = SIGNAL_TIMELINE_QUERY_PATH
} = {}) {
  if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    throw new Error('Database signal mode requires SAFEFLOW_SIMULATION_ONLY=true');
  }
  if (!env.DATABASE_URL && !poolConfig) {
    throw new Error('Database signal mode requires DATABASE_URL');
  }

  return {
    id: 'postgresql-simulation-signals',
    async listPatientSignals({ patientId } = {}) {
      const pool = new Pool(createPoolConfig({
        applicationName: 'safeflow-simulation-signals',
        env,
        poolConfig
      }));

      try {
        const query = readFileSync(resolve(process.cwd(), queryPath), 'utf8');
        const result = await pool.query(query, [patientId ?? null]);
        return result.rows.map(normaliseSignalRow);
      } finally {
        await pool.end();
      }
    }
  };
}

export function createConfiguredSignalProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig
} = {}) {
  if (!env.DATABASE_URL && !poolConfig) {
    if (!allowsSimulationPreviewFallback(env)) {
      throw new Error(
        'Signal provider has no DATABASE_URL configured and SAFEFLOW_ENVIRONMENT does not allow a ' +
        'simulation preview fallback; refusing to silently serve fictional placeholder signals. ' +
        'Set DATABASE_URL or an allowed SAFEFLOW_ENVIRONMENT (e.g. "local", "dev", "simulation").'
      );
    }
    return createLocalSignalProvider();
  }

  return createDatabaseSignalProvider({ env, Pool, poolConfig });
}

function createPoolConfig({ applicationName, env, poolConfig }) {
  if (poolConfig) {
    return {
      max: 1,
      application_name: applicationName,
      ...poolConfig
    };
  }

  return {
    connectionString: env.DATABASE_URL,
    max: 1,
    application_name: applicationName
  };
}

function normaliseSignalRow(row) {
  if (row.simulation_only !== true) {
    throw new Error('Signal read model returned a non-simulation row');
  }

  return {
    signalId: String(row.signal_id),
    syntheticPatientRef: String(row.synthetic_patient_ref),
    sourceSystem: String(row.source_system),
    sourceType: String(row.source_type),
    signalCode: String(row.signal_code),
    displayName: String(row.display_name),
    value: row.signal_value == null ? null : String(row.signal_value),
    unit: row.unit == null ? null : String(row.unit),
    referenceRange: row.reference_range == null ? null : String(row.reference_range),
    status: String(row.status),
    collectedAt: normaliseTimestamp(row.collected_at),
    resultedAt: normaliseTimestamp(row.resulted_at),
    receivedAt: normaliseTimestamp(row.received_at),
    effectiveAt: normaliseTimestamp(row.effective_at),
    sourceFreshness: String(row.source_freshness),
    confidence: Number(row.confidence),
    provenance: normaliseJson(row.provenance, {}),
    simulationOnly: true
  };
}

function normaliseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
}

function normaliseTimestamp(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
