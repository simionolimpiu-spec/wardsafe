import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';
import { getDemoSuggestionFixtures } from '../src/data/demoScenarios.js';

const SUGGESTION_LIST_QUERY_PATH = 'database/queries/simulationRiskSuggestions.sql';
const SUGGESTION_ACTION_QUERY_PATH = 'database/queries/recordSimulationSuggestionAction.sql';
const ACTION_TYPES = new Set([
  'accepted',
  'dismissed',
  'snoozed',
  'escalated',
  'converted_to_task',
  'converted_to_blocker',
  'resolved'
]);

export function createLocalSuggestionProvider({ now = () => new Date().toISOString() } = {}) {
  const suggestions = getDemoSuggestionFixtures().map(clone);
  let actionSequence = 0;

  return {
    id: 'local-simulation-risk-suggestions',
    async listRiskSuggestions({ patientId } = {}) {
      return clone(suggestions.filter((suggestion) => (
        !patientId || suggestion.syntheticPatientRef === patientId
      )));
    },
    async recordSuggestionAction(input) {
      const actionInput = normaliseActionInput(input);
      const suggestion = suggestions.find((candidate) => candidate.suggestionId === actionInput.suggestionId);
      if (!suggestion) {
        throw new Error('Simulation suggestion action requires a known fictional suggestion');
      }

      actionSequence += 1;
      const occurredAt = now();
      const action = {
        actionId: `suggestion-action-local-${actionSequence}`,
        suggestionId: suggestion.suggestionId,
        status: actionInput.actionType,
        actionType: actionInput.actionType,
        actionReason: actionInput.actionReason,
        actorRef: actionInput.actorRef,
        occurredAt,
        updatedAt: occurredAt
      };

      suggestion.status = action.status;
      suggestion.updatedAt = occurredAt;
      suggestion.actions.unshift(action);
      return clone(action);
    }
  };
}

export function createDatabaseSuggestionProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig,
  listQueryPath = SUGGESTION_LIST_QUERY_PATH,
  actionQueryPath = SUGGESTION_ACTION_QUERY_PATH
} = {}) {
  if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    throw new Error('Database suggestion mode requires SAFEFLOW_SIMULATION_ONLY=true');
  }
  if (!env.DATABASE_URL && !poolConfig) {
    throw new Error('Database suggestion mode requires DATABASE_URL');
  }

  return {
    id: 'postgresql-simulation-risk-suggestions',
    async listRiskSuggestions({ patientId } = {}) {
      const pool = new Pool(createPoolConfig({
        applicationName: 'safeflow-simulation-risk-suggestions',
        env,
        poolConfig
      }));

      try {
        const query = readFileSync(resolve(process.cwd(), listQueryPath), 'utf8');
        const result = await pool.query(query, [patientId ?? null]);
        return result.rows.map(normaliseSuggestionRow);
      } finally {
        await pool.end();
      }
    },
    async recordSuggestionAction(input) {
      const actionInput = normaliseActionInput(input);
      const pool = new Pool(createPoolConfig({
        applicationName: 'safeflow-simulation-risk-suggestions',
        env,
        poolConfig
      }));

      try {
        const query = readFileSync(resolve(process.cwd(), actionQueryPath), 'utf8');
        const result = await pool.query(query, [
          actionInput.suggestionId,
          actionInput.actionType,
          actionInput.actionReason,
          actionInput.actorRef
        ]);
        const row = result.rows[0];
        if (!row?.suggestion_id) {
          throw new Error('Simulation suggestion action did not return a fictional suggestion');
        }
        return normaliseActionRow(row);
      } finally {
        await pool.end();
      }
    }
  };
}

export function createConfiguredSuggestionProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig
} = {}) {
  if (!env.DATABASE_URL && !poolConfig) {
    return createLocalSuggestionProvider();
  }

  return createDatabaseSuggestionProvider({ env, Pool, poolConfig });
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

function normaliseSuggestionRow(row) {
  if (row.requires_human_review !== true) {
    throw new Error('Risk suggestion read model returned an item without human review');
  }

  return {
    suggestionId: String(row.suggestion_id),
    syntheticPatientRef: String(row.synthetic_patient_ref),
    riskType: String(row.risk_type),
    riskTier: String(row.risk_tier),
    riskScore: Number(row.risk_score),
    status: String(row.status),
    title: String(row.title),
    suggestedFlag: String(row.suggested_flag),
    suggestedBlocker: String(row.suggested_blocker),
    suggestedTask: String(row.suggested_task),
    evidence: normaliseJson(row.evidence, []),
    missingData: normaliseJson(row.missing_data, []),
    modelVersion: String(row.model_version),
    featureSetVersion: String(row.feature_set_version),
    requiresHumanReview: true,
    createdAt: normaliseTimestamp(row.created_at),
    updatedAt: normaliseTimestamp(row.updated_at),
    actions: normaliseJson(row.actions, []),
    simulationOnly: true
  };
}

function normaliseActionRow(row) {
  return {
    actionId: String(row.action_id),
    suggestionId: String(row.suggestion_id),
    status: String(row.status),
    actionType: String(row.action_type),
    actionReason: String(row.action_reason),
    occurredAt: normaliseTimestamp(row.occurred_at),
    updatedAt: normaliseTimestamp(row.updated_at)
  };
}

function normaliseActionInput(input) {
  const suggestionId = stringField(input?.suggestionId, 'suggestionId');
  const actionType = stringField(input?.actionType, 'actionType');
  const actionReason = stringField(input?.actionReason, 'actionReason');

  if (!ACTION_TYPES.has(actionType)) {
    throw new Error('Simulation suggestion action type is not allowed');
  }

  return {
    suggestionId,
    actionType,
    actionReason,
    actorRef: input.actorRef == null || input.actorRef === ''
      ? 'fictional-user-laura-bennett'
      : stringField(input.actorRef, 'actorRef')
  };
}

function stringField(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Simulation suggestion action requires ${fieldName}`);
  }

  return value.trim();
}

function normaliseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
}

function normaliseTimestamp(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
