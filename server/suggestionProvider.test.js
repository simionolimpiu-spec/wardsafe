import { describe, expect, it, vi } from 'vitest';
import {
  createConfiguredSuggestionProvider,
  createDatabaseSuggestionProvider,
  createLocalSuggestionProvider
} from './suggestionProvider.js';

function createPoolFactory({ rows = [], error } = {}) {
  const query = vi.fn(async () => {
    if (error) throw error;
    return { rows };
  });
  const end = vi.fn(async () => {});
  const Pool = vi.fn(function Pool() {
    return { query, end };
  });

  return { Pool, query, end };
}

describe('suggestion provider', () => {
  it('lists and records local nurse actions against fictional suggestions', async () => {
    const provider = createLocalSuggestionProvider({
      now: () => '2026-06-10T09:30:00.000Z'
    });

    const suggestions = await provider.listRiskSuggestions({ patientId: 'DCU-031' });
    const action = await provider.recordSuggestionAction({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      actorRef: 'fictional-user-laura-bennett'
    });

    expect(provider.id).toBe('local-simulation-risk-suggestions');
    expect(suggestions[0]).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      syntheticPatientRef: 'DCU-031',
      riskType: 'missed_action',
      riskTier: 'urgent',
      requiresHumanReview: true,
      simulationOnly: true
    });
    expect(action).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      status: 'accepted',
      actionType: 'accepted',
      occurredAt: '2026-06-10T09:30:00.000Z'
    });
    expect(JSON.stringify({ suggestions, action })).not.toMatch(/\bnhs_number|date_of_birth|postcode|address\b/i);
  });

  it('refuses database mode unless simulation-only mode and database URL are explicit', () => {
    const { Pool } = createPoolFactory();

    expect(() => createDatabaseSuggestionProvider({
      env: { DATABASE_URL: 'postgres://example/safeflow' },
      Pool
    })).toThrow(/SAFEFLOW_SIMULATION_ONLY=true/);
    expect(() => createDatabaseSuggestionProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true' },
      Pool
    })).toThrow(/DATABASE_URL/);
    expect(Pool).not.toHaveBeenCalled();
  });

  it('loads risk suggestions through the approved read contract and closes the pool', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{
        suggestion_id: 'suggestion-dcu-031-electrolyte-review',
        synthetic_patient_ref: 'DCU-031',
        risk_type: 'missed_action',
        risk_tier: 'urgent',
        risk_score: '0.860',
        status: 'suggested',
        title: 'Electrolyte result review may be needed',
        suggested_flag: 'Electrolyte result review may be needed',
        suggested_blocker: 'Unresolved abnormal blood result',
        suggested_task: 'Review blood trend and document action',
        evidence: [{ signalCode: 'potassium', label: 'Potassium 3.1 mmol/L final at 09:10' }],
        missing_data: ['Magnesium result not visible'],
        model_version: 'simulation-risk-v0',
        feature_set_version: 'signal-features-v0',
        requires_human_review: true,
        created_at: new Date('2026-06-10T09:12:00.000Z'),
        updated_at: new Date('2026-06-10T09:12:00.000Z'),
        actions: []
      }]
    });
    const provider = createDatabaseSuggestionProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool
    });

    const suggestions = await provider.listRiskSuggestions({ patientId: 'DCU-031' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('risk_suggestions'), ['DCU-031']);
    expect(end).toHaveBeenCalledTimes(1);
    expect(suggestions[0]).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      syntheticPatientRef: 'DCU-031',
      riskScore: 0.86,
      requiresHumanReview: true,
      simulationOnly: true
    });
  });

  it('records database suggestion actions with parameterised values', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{
        action_id: 'action-row-1',
        suggestion_id: 'suggestion-dcu-031-electrolyte-review',
        status: 'accepted',
        action_type: 'accepted',
        action_reason: 'Charge nurse reviewed fictional evidence',
        occurred_at: new Date('2026-06-10T09:30:00.000Z'),
        updated_at: new Date('2026-06-10T09:30:00.000Z')
      }]
    });
    const provider = createDatabaseSuggestionProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool
    });

    const action = await provider.recordSuggestionAction({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      actorRef: 'fictional-user-laura-bennett'
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('suggestion_actions'),
      [
        'suggestion-dcu-031-electrolyte-review',
        'accepted',
        'Charge nurse reviewed fictional evidence',
        'fictional-user-laura-bennett'
      ]
    );
    expect(end).toHaveBeenCalledTimes(1);
    expect(action).toEqual({
      actionId: 'action-row-1',
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      status: 'accepted',
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      occurredAt: '2026-06-10T09:30:00.000Z',
      updatedAt: '2026-06-10T09:30:00.000Z'
    });
  });

  it('uses local suggestion fixtures when database access is not configured', () => {
    const provider = createConfiguredSuggestionProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true' }
    });

    expect(provider.id).toBe('local-simulation-risk-suggestions');
  });

  it('refuses to silently fall back to placeholder suggestions in a non-preview environment', () => {
    expect(() => createConfiguredSuggestionProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true', SAFEFLOW_ENVIRONMENT: 'production' }
    })).toThrow(/SAFEFLOW_ENVIRONMENT does not allow a simulation preview fallback/);
  });

  it('still falls back to local fixtures when SAFEFLOW_ENVIRONMENT is an allowed preview value', () => {
    const provider = createConfiguredSuggestionProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true', SAFEFLOW_ENVIRONMENT: 'dev' }
    });

    expect(provider.id).toBe('local-simulation-risk-suggestions');
  });
});
