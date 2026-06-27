import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';

const SIGNAL_TIMELINE_QUERY_PATH = 'database/queries/simulationSignalTimeline.sql';

const localSignals = [
  {
    signalId: 'signal-dcu-031-potassium-0910',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'potassium',
    displayName: 'Potassium',
    value: '3.1',
    unit: 'mmol/L',
    referenceRange: '3.5-5.3',
    status: 'final',
    collectedAt: '2026-06-10T08:55:00.000Z',
    resultedAt: '2026-06-10T09:10:00.000Z',
    receivedAt: '2026-06-10T09:10:30.000Z',
    effectiveAt: '2026-06-10T09:10:00.000Z',
    sourceFreshness: 'current',
    confidence: 0.98,
    provenance: {
      feed: 'simulation',
      messageType: 'ice_pathology_result',
      directCareIdentifiers: false
    },
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-magnesium-missing-0910',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'magnesium',
    displayName: 'Magnesium',
    value: null,
    unit: 'mmol/L',
    referenceRange: '0.7-1.0',
    status: 'missing',
    collectedAt: null,
    resultedAt: null,
    receivedAt: '2026-06-10T09:10:30.000Z',
    effectiveAt: '2026-06-10T09:10:30.000Z',
    sourceFreshness: 'current',
    confidence: 0.9,
    provenance: {
      feed: 'simulation',
      messageType: 'expected_pathology_result',
      directCareIdentifiers: false
    },
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-news2-0915',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-observations',
    sourceType: 'observation',
    signalCode: 'NEWS2',
    displayName: 'NEWS2',
    value: '7',
    unit: null,
    referenceRange: null,
    status: 'final',
    collectedAt: '2026-06-10T09:15:00.000Z',
    resultedAt: '2026-06-10T09:15:00.000Z',
    receivedAt: '2026-06-10T09:15:10.000Z',
    effectiveAt: '2026-06-10T09:15:00.000Z',
    sourceFreshness: 'current',
    confidence: 1,
    provenance: {
      feed: 'simulation',
      messageType: 'news2_observation',
      directCareIdentifiers: false
    },
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-plan-gap-0920',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-workflow',
    sourceType: 'workflow',
    signalCode: 'electrolyte_plan_gap',
    displayName: 'Electrolyte monitoring plan',
    value: 'unclear',
    unit: null,
    referenceRange: null,
    status: 'final',
    collectedAt: '2026-06-10T09:20:00.000Z',
    resultedAt: '2026-06-10T09:20:00.000Z',
    receivedAt: '2026-06-10T09:20:10.000Z',
    effectiveAt: '2026-06-10T09:20:00.000Z',
    sourceFreshness: 'current',
    confidence: 0.92,
    provenance: {
      feed: 'simulation',
      messageType: 'workflow_gap',
      directCareIdentifiers: false
    },
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-028-urine-prelim-1145',
    syntheticPatientRef: 'DCU-028',
    sourceSystem: 'simulation-microbiology',
    sourceType: 'microbiology',
    signalCode: 'urine_culture',
    displayName: 'Urine culture',
    value: 'preliminary growth flagged',
    unit: null,
    referenceRange: null,
    status: 'preliminary',
    collectedAt: '2026-06-10T07:20:00.000Z',
    resultedAt: '2026-06-10T11:45:00.000Z',
    receivedAt: '2026-06-10T11:45:30.000Z',
    effectiveAt: '2026-06-10T11:45:00.000Z',
    sourceFreshness: 'current',
    confidence: 0.85,
    provenance: {
      feed: 'simulation',
      messageType: 'microbiology_result',
      directCareIdentifiers: false
    },
    simulationOnly: true
  }
];

export function createLocalSignalProvider() {
  return {
    id: 'local-simulation-signals',
    async listPatientSignals({ patientId } = {}) {
      return clone(localSignals)
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
