import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildWardDatabaseExport, wardLibrary } from '../src/data/wardLibrary/index.js';

export const EXPORT_TABLES = [
  'wards',
  'flags',
  'scenarios',
  'scenario_patients',
  'patients',
  'patient_flags',
  'journey_events'
];

const TABLE_COLUMNS = {
  wards: ['id', 'name', 'ward_type', 'ward_group', 'bed_count', 'simulation_only'],
  flags: [
    'id',
    'code',
    'name',
    'category',
    'severity',
    'description',
    'trigger_signals',
    'rationale_template',
    'applicable_ward_types',
    'simulation_only'
  ],
  scenarios: ['id', 'title', 'ward_type', 'description', 'review_cues', 'simulation_only'],
  scenario_patients: ['scenario_id', 'patient_id', 'sequence'],
  patients: [
    'id',
    'ward_id',
    'patient_ref',
    'fictional_name',
    'age',
    'pronouns',
    'demographic_context',
    'risk_level',
    'news2',
    'responsible_nurse',
    'next_action',
    'escalation',
    'handover_complete',
    'discharge_ready',
    'baseline',
    'current_state',
    'trajectory',
    'uncertainty',
    'clinical_use',
    'simulation_only'
  ],
  patient_flags: ['patient_id', 'flag_id', 'sequence'],
  journey_events: [
    'id',
    'patient_id',
    'sequence',
    'timestamp',
    'type',
    'label',
    'detail',
    'news2',
    'missing_information',
    'limitations',
    'simulation_label',
    'clinical_use',
    'simulation_only'
  ]
};

const SEED_INSERT_ORDER = [
  'wards',
  'flags',
  'scenarios',
  'patients',
  'scenario_patients',
  'patient_flags',
  'journey_events'
];

const WARD_TYPE_CHECK = [
  'surgical',
  'general medical',
  'acute medical',
  'day care',
  'community frailty team',
  'rehab',
  'care-of-the-elderly',
  'paediatrics',
  'maternity',
  'ICU/HDU',
  'ED'
].map(sqlValue).join(', ');

export function renderWardDatabaseArtifacts(exportModel = buildWardDatabaseExport(wardLibrary)) {
  const csvFiles = {};

  for (const tableName of EXPORT_TABLES) {
    csvFiles[`${tableName}.csv`] = renderCsv(tableName, exportModel.tables[tableName]);
  }

  return {
    csvFiles,
    schemaSql: renderSchemaSql(),
    seedSql: renderSeedSql(exportModel),
    sqliteFileName: 'wardsafe-sim.db'
  };
}

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

function renderCsv(tableName, rows = []) {
  const columns = TABLE_COLUMNS[tableName];
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(','))
  ].join('\n');
}

function renderSchemaSql() {
  return `PRAGMA foreign_keys = ON;

CREATE TABLE wards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ward_type TEXT NOT NULL CHECK (ward_type IN (${WARD_TYPE_CHECK})),
  ward_group TEXT NOT NULL,
  bed_count INTEGER NOT NULL CHECK (bed_count >= 0),
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1))
);

CREATE TABLE flags (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high')),
  description TEXT NOT NULL,
  trigger_signals TEXT NOT NULL,
  rationale_template TEXT NOT NULL,
  applicable_ward_types TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1))
);

CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  ward_type TEXT NOT NULL CHECK (ward_type IN (${WARD_TYPE_CHECK})),
  description TEXT NOT NULL,
  review_cues TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1))
);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  ward_id TEXT NOT NULL,
  patient_ref TEXT NOT NULL UNIQUE,
  fictional_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0),
  pronouns TEXT NOT NULL,
  demographic_context TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  news2 INTEGER NOT NULL CHECK (news2 >= 0),
  responsible_nurse TEXT NOT NULL,
  next_action TEXT NOT NULL,
  escalation TEXT NOT NULL CHECK (escalation IN ('None', 'Monitoring', 'Active')),
  handover_complete INTEGER NOT NULL CHECK (handover_complete BETWEEN 0 AND 100),
  discharge_ready INTEGER NOT NULL CHECK (discharge_ready IN (0, 1)),
  baseline TEXT NOT NULL,
  current_state TEXT NOT NULL,
  trajectory TEXT NOT NULL,
  uncertainty TEXT NOT NULL,
  clinical_use TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1)),
  FOREIGN KEY (ward_id) REFERENCES wards(id)
);

CREATE TABLE scenario_patients (
  scenario_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  PRIMARY KEY (scenario_id, patient_id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE patient_flags (
  patient_id TEXT NOT NULL,
  flag_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  PRIMARY KEY (patient_id, flag_id),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (flag_id) REFERENCES flags(id) ON DELETE RESTRICT
);

CREATE TABLE journey_events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vital', 'intervention', 'note', 'escalation', 'handover')),
  label TEXT NOT NULL,
  detail TEXT NOT NULL,
  news2 INTEGER,
  missing_information TEXT NOT NULL,
  limitations TEXT NOT NULL,
  simulation_label TEXT NOT NULL,
  clinical_use TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1)),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_scenarios_ward_type ON scenarios(ward_type);
CREATE INDEX idx_patients_ward_id ON patients(ward_id);
CREATE INDEX idx_patient_flags_flag_id ON patient_flags(flag_id);
CREATE INDEX idx_journey_events_patient_time ON journey_events(patient_id, timestamp);
`;
}

function renderSeedSql(exportModel) {
  const statements = ['PRAGMA foreign_keys = ON;', 'BEGIN TRANSACTION;'];

  for (const tableName of SEED_INSERT_ORDER) {
    const columns = TABLE_COLUMNS[tableName];
    for (const row of exportModel.tables[tableName]) {
      statements.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((column) => sqlValue(row[column])).join(', ')});`);
    }
  }

  statements.push('COMMIT;');
  return `${statements.join('\n')}\n`;
}

function csvValue(value) {
  if (value == null) return '';
  const text = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function sqlValue(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
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
