import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';
import migrationApproval from '../../../../database/migrationApproval.json' with { type: 'json' };
import { createMigrationEntry, migrationSources } from '../../../../database/migrationManifest.js';
import { runMigration } from '../../../../database/migrationRunner.js';

const executeAction = 'execute-approved-simulation-migration';
const planAction = 'plan-approved-simulation-migration';
const applicationDatabaseUsername = 'safeflow_api';

class SafeFlowMigrationRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SafeFlowMigrationRequestError';
    this.statusCode = 400;
  }
}

export function createMigrationHandler({
  readSecret = createSecretsManagerReader(),
  clientFactory = (config) => new Client(config),
  executeMigration = runMigration,
  approval = migrationApproval,
  manifestFactory = buildBundledMigrationManifest,
  readSource = readBundledMigrationSource,
  env = process.env
} = {}) {
  return async function migrationHandler(event = {}) {
    try {
      const action = event.action ?? planAction;
      const mode = action === executeAction ? 'execute' : 'dry-run';

      if (![planAction, executeAction].includes(action)) {
        throw new SafeFlowMigrationRequestError(`Unsupported SafeFlow migration action: ${action}`);
      }

      if (mode === 'execute' && event.approved !== true) {
        throw new SafeFlowMigrationRequestError('Set event.approved=true before executing the SafeFlow simulation migration.');
      }

      const migrationEnv = {
        ...env,
        SAFEFLOW_MIGRATION_APPROVED: event.approved === true ? 'true' : env.SAFEFLOW_MIGRATION_APPROVED
      };
      const manifest = manifestFactory({ readSource });

      if (mode === 'dry-run') {
        const plan = await executeMigration({
          manifest,
          approval,
          env: migrationEnv,
          mode,
          readSource
        });

        return jsonResponse(200, {
          ...plan,
          action: 'planned'
        });
      }

      if (!env.DATABASE_SECRET_ARN) {
        throw new SafeFlowMigrationRequestError('DATABASE_SECRET_ARN is required for SafeFlow migration execution.');
      }
      if (!env.APP_DATABASE_SECRET_ARN) {
        throw new SafeFlowMigrationRequestError('APP_DATABASE_SECRET_ARN is required for SafeFlow application database role configuration.');
      }

      const secretString = await readSecret(env.DATABASE_SECRET_ARN);
      const appSecretString = await readSecret(env.APP_DATABASE_SECRET_ARN);
      const client = clientFactory(createPostgresClientConfig(secretString, env));

      await client.connect();
      try {
        const result = await executeMigration({
          client,
          manifest,
          approval,
          env: migrationEnv,
          mode,
          readSource
        });
        await configureApplicationDatabaseRole({ client, appSecretString });

        return jsonResponse(200, {
          ...result,
          action: 'executed'
        });
      } finally {
        await client.end();
      }
    } catch (error) {
      const statusCode = error.statusCode ?? 500;
      return jsonResponse(statusCode, {
        error: redactSensitiveText(error.message)
      });
    }
  };
}

export async function configureApplicationDatabaseRole({ client, appSecretString }) {
  const appSecret = parseApplicationDatabaseSecret(appSecretString);

  await client.query(`
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'safeflow_api') then
    create role safeflow_api login;
  end if;
end;
$$;
`);
  await client.query("select set_config('safeflow.api_password', $1, false)", [appSecret.password]);
  try {
    await client.query(`
do $$
begin
  execute 'alter role safeflow_api with login password ' || quote_literal(current_setting('safeflow.api_password'));
end;
$$;
`);
  } finally {
    await client.query('reset safeflow.api_password');
  }

  await client.query(`
grant usage on schema public to safeflow_api;
grant select on users, wards, patient_summaries, observations, safety_flags, tasks, escalations, handover_items, discharge_blockers, audit_events to safeflow_api;
grant insert on audit_events to safeflow_api;
`);
}

function parseApplicationDatabaseSecret(secretString) {
  const secret = typeof secretString === 'string' ? JSON.parse(secretString) : secretString;

  if (secret.username !== applicationDatabaseUsername) {
    throw new SafeFlowMigrationRequestError(`SafeFlow application database secret must use username ${applicationDatabaseUsername}.`);
  }
  if (!secret.password) {
    throw new SafeFlowMigrationRequestError('SafeFlow application database secret is missing required field: password');
  }

  return secret;
}

export function buildBundledMigrationManifest({ readSource = readBundledMigrationSource } = {}) {
  return {
    manifestVersion: 1,
    product: 'SafeFlow',
    simulationOnly: true,
    migrations: migrationSources.map((source) => createMigrationEntry(source, readSource(source.path)))
  };
}

export function createPostgresClientConfig(secretString, env = process.env) {
  const secret = typeof secretString === 'string' ? JSON.parse(secretString) : secretString;
  const database = secret.dbname ?? secret.database ?? 'safeflow';
  const port = Number(secret.port ?? 5432);

  for (const field of ['username', 'password', 'host']) {
    if (!secret[field]) {
      throw new SafeFlowMigrationRequestError(`Database secret is missing required field: ${field}`);
    }
  }

  return {
    user: secret.username,
    password: secret.password,
    host: secret.host,
    port,
    database,
    ssl: env.SAFEFLOW_DATABASE_SSL === 'false'
      ? false
      : {
          rejectUnauthorized: true,
          ca: readBundledAsset('infra/aws/certs/rds-eu-west-2-bundle.pem')
        }
  };
}

export function readBundledMigrationSource(path) {
  return readBundledAsset(path);
}

export function readBundledAsset(path) {
  const roots = [
    process.env.LAMBDA_TASK_ROOT,
    process.cwd()
  ].filter(Boolean);

  for (const root of roots) {
    try {
      return readFileSync(resolve(root, path), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  throw new Error(`SafeFlow bundled asset not found: ${path}`);
}

export function redactSensitiveText(text) {
  return String(text)
    .replace(/\b(postgres(?:ql)?:\/\/)([^@\s/]+)@/gi, '$1[redacted]@')
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[redacted]"');
}

function createSecretsManagerReader(client = new SecretsManagerClient({})) {
  return async function readSecret(secretId) {
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

    if (!response.SecretString) {
      throw new Error('SafeFlow database secret did not contain a SecretString value.');
    }

    return response.SecretString;
  };
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  };
}

export const handler = createMigrationHandler();
