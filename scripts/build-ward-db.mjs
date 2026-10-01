import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildWardDatabaseExport, wardLibrary } from '../src/data/wardLibrary/index.js';
import { EXPORT_TABLES, renderWardDatabaseArtifacts } from '../src/data/wardLibrary/wardDatabaseArtifacts.js';

export { EXPORT_TABLES, renderWardDatabaseArtifacts };

export function writeWardDatabaseArtifacts({
  outputDir = defaultOutputDir(),
  library = wardLibrary
} = {}) {
  const exportModel = buildWardDatabaseExport(library);
  const artifacts = renderWardDatabaseArtifacts(exportModel);

  fs.mkdirSync(outputDir, { recursive: true });

  for (const [fileName, contents] of Object.entries(artifacts.csvFiles)) {
    fs.writeFileSync(path.join(outputDir, fileName), contents, 'utf8');
  }

  fs.writeFileSync(path.join(outputDir, 'schema.sql'), artifacts.schemaSql, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'seed.sql'), artifacts.seedSql, 'utf8');

  const sqlitePath = path.join(outputDir, artifacts.sqliteFileName);
  if (fs.existsSync(sqlitePath)) {
    fs.rmSync(sqlitePath);
  }
  buildSqliteDatabase({
    sqlitePath,
    schemaSql: artifacts.schemaSql,
    seedSql: artifacts.seedSql
  });

  return {
    outputDir,
    sqlitePath,
    counts: exportModel.counts,
    files: [
      ...Object.keys(artifacts.csvFiles),
      'schema.sql',
      'seed.sql',
      artifacts.sqliteFileName
    ]
  };
}

function buildSqliteDatabase({ sqlitePath, schemaSql, seedSql }) {
  const db = new DatabaseSync(sqlitePath);
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(schemaSql);
    db.exec(seedSql);
    const violations = db.prepare('PRAGMA foreign_key_check').all();
    if (violations.length > 0) {
      throw new Error(`Generated SQLite database has ${violations.length} foreign key violation(s).`);
    }
  } finally {
    db.close();
  }
}

function defaultOutputDir() {
  return path.resolve(projectRoot(), 'data', 'exports');
}

function projectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isMainModule()) {
  const result = writeWardDatabaseArtifacts();
  console.log(`Wrote ward simulation database exports to ${result.outputDir}`);
  console.log(`SQLite database: ${result.sqlitePath}`);
  console.log(JSON.stringify(result.counts, null, 2));
}
