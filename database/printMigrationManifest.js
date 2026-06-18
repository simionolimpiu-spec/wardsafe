import { buildMigrationManifest } from './migrationManifest.js';

process.stdout.write(`${JSON.stringify(buildMigrationManifest(), null, 2)}\n`);
