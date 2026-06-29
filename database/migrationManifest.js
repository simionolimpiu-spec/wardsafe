import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const migrationSources = [
  {
    path: 'database/schema.sql',
    phase: 'schema',
    simulationOnly: true
  },
  {
    path: 'database/seed.sql',
    phase: 'seed',
    simulationOnly: true
  }
];

export function readMigrationSource(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function normalizeSqlSource(content) {
  return content.replace(/\r\n/g, '\n');
}

export function createMigrationEntry(source, content) {
  const normalizedContent = normalizeSqlSource(content);

  return {
    ...source,
    bytes: Buffer.byteLength(normalizedContent, 'utf8'),
    sha256: createHash('sha256').update(normalizedContent).digest('hex')
  };
}

export function buildMigrationManifest() {
  return {
    manifestVersion: 1,
    product: 'SafeFlow',
    simulationOnly: true,
    migrations: migrationSources.map((source) => {
      const content = readMigrationSource(source.path);

      return createMigrationEntry(source, content);
    })
  };
}
