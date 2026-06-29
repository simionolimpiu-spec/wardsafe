import { describe, expect, it, vi } from 'vitest';
import {
  createConfiguredSignalProvider,
  createDatabaseSignalProvider,
  createLocalSignalProvider
} from './signalProvider.js';

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

describe('signal provider', () => {
  it('uses local fictional signal fixtures when database access is not configured', async () => {
    const provider = createConfiguredSignalProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true' }
    });

    const signals = await provider.listPatientSignals({ patientId: 'DCU-031' });

    expect(provider.id).toBe('local-simulation-signals');
    expect(signals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        syntheticPatientRef: 'DCU-031',
        sourceSystem: 'simulation-ice',
        sourceType: 'lab',
        signalCode: 'potassium',
        simulationOnly: true
      })
    ]));
    expect(JSON.stringify(signals)).not.toMatch(/\bnhs_number|date_of_birth|postcode|address\b/i);
  });

  it('refuses database mode unless simulation-only mode and database URL are explicit', () => {
    const { Pool } = createPoolFactory();

    expect(() => createDatabaseSignalProvider({
      env: { DATABASE_URL: 'postgres://example/safeflow' },
      Pool
    })).toThrow(/SAFEFLOW_SIMULATION_ONLY=true/);
    expect(() => createDatabaseSignalProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true' },
      Pool
    })).toThrow(/DATABASE_URL/);
    expect(Pool).not.toHaveBeenCalled();
  });

  it('loads patient signals through the approved read contract and closes the pool', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{
        signal_id: 'signal-row-1',
        synthetic_patient_ref: 'DCU-031',
        source_system: 'simulation-ice',
        source_type: 'lab',
        signal_code: 'potassium',
        display_name: 'Potassium',
        signal_value: '3.1',
        unit: 'mmol/L',
        reference_range: '3.5-5.3',
        status: 'final',
        collected_at: new Date('2026-06-10T08:55:00.000Z'),
        resulted_at: new Date('2026-06-10T09:10:00.000Z'),
        received_at: new Date('2026-06-10T09:10:30.000Z'),
        effective_at: new Date('2026-06-10T09:10:00.000Z'),
        source_freshness: 'current',
        confidence: '0.980',
        provenance: { feed: 'simulation', directCareIdentifiers: false },
        simulation_only: true
      }]
    });
    const provider = createDatabaseSignalProvider({
      env: {
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_URL: 'postgres://example/safeflow'
      },
      Pool
    });

    const signals = await provider.listPatientSignals({ patientId: 'DCU-031' });

    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: 'postgres://example/safeflow',
      max: 1,
      application_name: 'safeflow-simulation-signals'
    }));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('clinical_signals'), ['DCU-031']);
    expect(end).toHaveBeenCalledTimes(1);
    expect(signals).toEqual([{
      signalId: 'signal-row-1',
      syntheticPatientRef: 'DCU-031',
      sourceSystem: 'simulation-ice',
      sourceType: 'lab',
      signalCode: 'potassium',
      displayName: 'Potassium',
      value: '3.1',
      unit: 'mmol/L',
      referenceRange: '3.5-5.3',
      status: 'final',
      collectedAt: '2026-06-10T08:55:00.000Z',
      resultedAt: '2026-06-10T09:10:00.000Z',
      receivedAt: '2026-06-10T09:10:30.000Z',
      effectiveAt: '2026-06-10T09:10:00.000Z',
      sourceFreshness: 'current',
      confidence: 0.98,
      provenance: { feed: 'simulation', directCareIdentifiers: false },
      simulationOnly: true
    }]);
  });
});
