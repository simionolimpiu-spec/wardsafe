import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [inputDir, outputDir] = process.argv.slice(2);

if (!inputDir || !outputDir) {
  throw new Error('copyMigratorAssets requires input and output directories.');
}

const outputDatabaseDir = join(outputDir, 'database');
mkdirSync(outputDatabaseDir, { recursive: true });

for (const fileName of ['schema.sql', 'seed.sql', 'migrationApproval.json']) {
  cpSync(join(inputDir, 'database', fileName), join(outputDatabaseDir, fileName));
}

const outputQueriesDir = join(outputDatabaseDir, 'queries');
mkdirSync(outputQueriesDir, { recursive: true });

for (const fileName of [
  'insertSimulationAuditEvent.sql',
  'listSimulationAuditEvents.sql',
  'simulationWorkspace.sql',
  'simulationSignalTimeline.sql',
  'simulationRiskSuggestions.sql',
  'recordSimulationSuggestionAction.sql'
]) {
  cpSync(join(inputDir, 'database', 'queries', fileName), join(outputQueriesDir, fileName));
}

const outputCertsDir = join(outputDir, 'infra', 'aws', 'certs');
mkdirSync(outputCertsDir, { recursive: true });
cpSync(
  join(inputDir, 'infra', 'aws', 'certs', 'rds-eu-west-2-bundle.pem'),
  join(outputCertsDir, 'rds-eu-west-2-bundle.pem')
);
