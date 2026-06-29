import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';
import { createSimulationWorkspaceSnapshot } from './simulationWorkspaceSnapshot.js';

const WORKSPACE_QUERY_PATH = 'database/queries/simulationWorkspace.sql';

export function createLocalWorkspaceProvider() {
  return {
    id: 'local-fictional-fixture',
    async getSnapshot() {
      return createSimulationWorkspaceSnapshot({ source: 'local-fictional-fixture' });
    }
  };
}

export function createDatabaseWorkspaceProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig,
  queryPath = WORKSPACE_QUERY_PATH
} = {}) {
  if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    throw new Error('Database workspace mode requires SAFEFLOW_SIMULATION_ONLY=true');
  }
  if (!env.DATABASE_URL && !poolConfig) {
    throw new Error('Database workspace mode requires DATABASE_URL');
  }

  return {
    id: 'postgresql-simulation-read-model',
    async getSnapshot() {
      const pool = new Pool(createPoolConfig({
        applicationName: 'safeflow-simulation-workspace',
        env,
        poolConfig
      }));

      try {
        const query = readFileSync(resolve(process.cwd(), queryPath), 'utf8');
        const result = await pool.query(query);
        const payload = result.rows[0]?.workspace_snapshot;
        const snapshot = typeof payload === 'string' ? JSON.parse(payload) : payload;

        if (!snapshot || snapshot.simulationOnly !== true) {
          throw new Error('Workspace read model did not return a simulation-only snapshot');
        }

        return {
          ...snapshot,
          source: 'postgresql-simulation-read-model'
        };
      } finally {
        await pool.end();
      }
    }
  };
}

export function createConfiguredWorkspaceProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig
} = {}) {
  if (!env.DATABASE_URL && !poolConfig) {
    return createLocalWorkspaceProvider();
  }

  return createDatabaseWorkspaceProvider({ env, Pool, poolConfig });
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
