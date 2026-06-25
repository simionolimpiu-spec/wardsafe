import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';
import { simulatedPatients } from '../src/data/simulatedPatients.js';

const AUDIT_INSERT_QUERY_PATH = 'database/queries/insertSimulationAuditEvent.sql';
const DIRECT_IDENTIFIER_FIELD_PATTERN = /\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i;
const SECRET_VALUE_PATTERN = /(postgres:\/\/|\bsk-[A-Za-z0-9_-]{8,})/;
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

  const serialized = JSON.stringify(payload ?? {});
  if (SECRET_VALUE_PATTERN.test(serialized)) {
    throw new SimulationAuditEventValidationError('Simulation audit event includes a secret-like value');
  }
}

export function createLocalAuditEventProvider({ now = () => new Date().toISOString() } = {}) {
  let sequence = 0;

  return {
    id: 'local-audit-fixture',
    async recordEvent(input) {
      const event = normaliseAuditEvent(input);
      sequence += 1;

      return {
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
    }
  };
}

export function createDatabaseAuditEventProvider({
  env = process.env,
  Pool = PgPool,
  queryPath = AUDIT_INSERT_QUERY_PATH
} = {}) {
  if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    throw new Error('Database audit event mode requires SAFEFLOW_SIMULATION_ONLY=true');
  }
  if (!env.DATABASE_URL) {
    throw new Error('Database audit event mode requires DATABASE_URL');
  }

  return {
    id: 'postgresql-simulation-audit-events',
    async recordEvent(input) {
      const event = normaliseAuditEvent(input);
      const pool = new Pool({
        connectionString: env.DATABASE_URL,
        max: 1,
        application_name: 'safeflow-simulation-audit-events'
      });

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
    }
  };
}

export function createConfiguredAuditEventProvider({
  env = process.env,
  Pool = PgPool
} = {}) {
  if (!env.DATABASE_URL) {
    return createLocalAuditEventProvider();
  }

  return createDatabaseAuditEventProvider({ env, Pool });
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

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normaliseTimestamp(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}
