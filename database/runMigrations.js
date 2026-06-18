import { Client } from 'pg';
import { pathToFileURL } from 'node:url';
import {
  loadMigrationApproval,
  planMigrationRun,
  runMigration
} from './migrationRunner.js';

function parseMode(argv) {
  return argv.includes('--execute') ? 'execute' : 'dry-run';
}

export function isCliEntryPoint(metaUrl, argvPath) {
  return Boolean(argvPath) && metaUrl === pathToFileURL(argvPath).href;
}

export function redactSensitiveText(text) {
  return String(text).replace(/\b(postgres(?:ql)?:\/\/)([^@\s/]+)@/gi, '$1[redacted]@');
}

export function createMigrationCli({
  clientFactory = (connectionString, env) => new Client({
    connectionString,
    ssl: env.SAFEFLOW_DATABASE_SSL === 'false' ? false : { rejectUnauthorized: true }
  }),
  loadMigrationApproval: loadApproval = loadMigrationApproval,
  planMigrationRun: planRun = planMigrationRun,
  runMigration: executeMigration = runMigration,
  stdout = process.stdout,
  stderr = process.stderr,
  env = process.env
} = {}) {
  return async function migrationCli(argv = process.argv.slice(2)) {
    try {
      const mode = parseMode(argv);
      const approval = loadApproval();
      const plan = planRun({ approval, mode });

      if (mode === 'dry-run') {
        stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
        return 0;
      }

      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for execute mode.');
      }

      const client = clientFactory(env.DATABASE_URL, env);

      await client.connect();
      try {
        const result = await executeMigration({ client, approval, mode });
        stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } finally {
        await client.end();
      }

      return 0;
    } catch (error) {
      stderr.write(`${redactSensitiveText(error.message)}\n`);
      return 1;
    }
  };
}

if (isCliEntryPoint(import.meta.url, process.argv[1])) {
  const exitCode = await createMigrationCli()();
  process.exitCode = exitCode;
}
