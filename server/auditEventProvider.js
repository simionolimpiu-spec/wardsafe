import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';
import { simulatedPatients } from '../src/data/simulatedPatients.js';

const AUDIT_INSERT_QUERY_PATH = 'database/queries/insertSimulationAuditEvent.sql';
const AUDIT_LIST_QUERY_PATH = 'database/queries/listSimulationAuditEvents.sql';
const DIRECT_IDENTIFIER_FIELD_PATTERN = /\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i;
const SECRET_FIELD_PATTERN = /\b(password|secret|token|api[_-]?key|access[_-]?key|session|authorization|cookie|arn)\b/i;
const UNSAFE_VALUE_PATTERN = /(postgres(?:ql)?:\/\/|\bsk-[A-Za-z0-9_-]{8,}|\barn:aws:[^\s"'}]+|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9._-]{2,80}$/;
const SOURCE_TABLE_PATTERN = /^[a-z][a-z0-9_]{1,60}$/;

export class SimulationAuditEventValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SimulationAuditEventValidationError';
    this.statusCode = 400;
  }
}

export function assertSimulationAuditPayloadIsSafe(payload) {
  const unsafeField = findUnsafeField(payload);
  if (unsafeField) {
    throw new SimulationAuditEventValidationError(`Simulation audit event includes direct identifier field: ${unsafeField}`);
  }

  const unsafeContent = findUnsafeContent(payload);
  if (unsafeContent) {
    throw new SimulationAuditEventValidationError(`Simulation audit event includes unsafe metadata content: ${unsafeContent}`);
  }
}

export function createLocalAuditEventProvider({ now = () => new Date().toISOString() } = {}) {
  let sequence = 0;
  const events = [];

  return {
    id: 'local-audit-fixture',
    async recordEvent(input) {
      const event = normaliseAuditEvent(input);
      sequence += 1;

      const storedEvent = {
        product: 'SafeFlow',
        simulationOnly: true,
        source: 'local-audit-fixture',
        id: `audit-local-${sequence}`,
        syntheticPatientRef: event.patientId,
        eventType: event.eventType,
        eventSummary: event.eventSummary,
        occurredAt: now(),
        metadata: event.metadata
      };

      events.unshift(storedEvent);
      return storedEvent;
    },
    async listEvents({ limit = 25 } = {}) {
      return events.slice(0, normaliseLimit(limit));
    }
  };
}

export function createDatabaseAuditEventProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig,
  queryPath = AUDIT_INSERT_QUERY_PATH,
  listQueryPath = AUDIT_LIST_QUERY_PATH
} = {}) {
  if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    throw new Error('Database audit event mode requires SAFEFLOW_SIMULATION_ONLY=true');
  }
  if (!env.DATABASE_URL && !poolConfig) {
    throw new Error('Database audit event mode requires DATABASE_URL');
  }

  return {
    id: 'postgresql-simulation-audit-events',
    async recordEvent(input) {
      const event = normaliseAuditEvent(input);
      const pool = new Pool(createPoolConfig({
        applicationName: 'safeflow-simulation-audit-events',
        env,
        poolConfig
      }));

      try {
        const query = readFileSync(resolve(process.cwd(), queryPath), 'utf8');
        const result = await pool.query(query, [
          event.patientId,
          event.eventType,
          event.eventSummary,
          event.sourceTable,
          JSON.stringify(event.metadata)
        ]);
        const row = result.rows[0];

        if (!row?.id || row.synthetic_patient_ref !== event.patientId) {
          throw new Error('Simulation audit insert did not return the fictional patient reference');
        }

        return {
          product: 'SafeFlow',
          simulationOnly: true,
          source: 'postgresql-simulation-audit-events',
          id: row.id,
          syntheticPatientRef: row.synthetic_patient_ref,
          eventType: row.event_type,
          eventSummary: row.event_summary,
          occurredAt: normaliseTimestamp(row.occurred_at)
        };
      } finally {
        await pool.end();
      }
    },
    async listEvents({ limit = 25 } = {}) {
      const pool = new Pool(createPoolConfig({
        applicationName: 'safeflow-simulation-audit-events',
        env,
        poolConfig
      }));

      try {
        const query = readFileSync(resolve(process.cwd(), listQueryPath), 'utf8');
        const result = await pool.query(query, [normaliseLimit(limit)]);
        return result.rows.map((row) => normaliseStoredAuditEvent(row, 'postgresql-simulation-audit-events'));
      } finally {
        await pool.end();
      }
    }
  };
}

export function createConfiguredAuditEventProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig
} = {}) {
  if (!env.DATABASE_URL && !poolConfig) {
    return createLocalAuditEventProvider();
  }

  return createDatabaseAuditEventProvider({ env, Pool, poolConfig });
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

function normaliseAuditEvent(input) {
  assertSimulationAuditPayloadIsSafe(input);

  const patientId = stringField(input?.patientId, 'patientId');
  if (!simulatedPatients.some((patient) => patient.id === patientId)) {
    throw new SimulationAuditEventValidationError('Simulation audit event must reference a known fictional patient');
  }

  const eventType = stringField(input.eventType, 'eventType');
  if (!EVENT_TYPE_PATTERN.test(eventType)) {
    throw new SimulationAuditEventValidationError('Simulation audit event type must be a lowercase dotted identifier');
  }

  const eventSummary = stringField(input.eventSummary, 'eventSummary');
  if (eventSummary.length > 220) {
    throw new SimulationAuditEventValidationError('Simulation audit event summary must be 220 characters or fewer');
  }

  const sourceTable = input.sourceTable == null ? null : stringField(input.sourceTable, 'sourceTable');
  if (sourceTable && !SOURCE_TABLE_PATTERN.test(sourceTable)) {
    throw new SimulationAuditEventValidationError('Simulation audit source table must be a lowercase identifier');
  }

  return {
    patientId,
    eventType,
    eventSummary,
    sourceTable,
    metadata: {
      actorRole: input.actorRole ?? 'simulation_user',
      ...(isPlainObject(input.metadata) ? input.metadata : {})
    }
  };
}

function normaliseStoredAuditEvent(row, source) {
  const event = {
    product: 'SafeFlow',
    simulationOnly: true,
    source,
    id: String(row.id),
    syntheticPatientRef: String(row.synthetic_patient_ref),
    eventType: String(row.event_type),
    eventSummary: String(row.event_summary),
    occurredAt: normaliseTimestamp(row.occurred_at),
    metadata: isPlainObject(row.metadata) ? row.metadata : {}
  };

  assertSimulationAuditPayloadIsSafe(event);
  return event;
}

function normaliseLimit(value) {
  const limit = Number(value);
  if (!Number.isFinite(limit)) return 25;
  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function stringField(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new SimulationAuditEventValidationError(`Simulation audit event requires ${fieldName}`);
  }

  return value.trim();
}

function findUnsafeField(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const unsafe = findUnsafeField(item);
      if (unsafe) return unsafe;
    }
    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (DIRECT_IDENTIFIER_FIELD_PATTERN.test(key)) return key;
    const unsafe = findUnsafeField(nested);
    if (unsafe) return unsafe;
  }

  return null;
}

function findUnsafeContent(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const unsafe = findUnsafeContent(item);
      if (unsafe) return unsafe;
    }
    return null;
  }

  if (typeof value === 'string') {
    return UNSAFE_VALUE_PATTERN.test(value) ? 'value' : null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (SECRET_FIELD_PATTERN.test(key)) return key;
    const unsafe = findUnsafeContent(nested);
    if (unsafe) return key;
  }

  return null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normaliseTimestamp(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}
