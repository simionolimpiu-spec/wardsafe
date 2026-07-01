import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialSimulationState } from './simulationWorkspace.js';
import {
  clearSimulationState,
  loadSimulationState,
  saveSimulationState,
  STORAGE_KEY
} from './simulationPersistence.js';

describe('simulation persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips version 1 simulation state', () => {
    const state = createInitialSimulationState();
    state.selectedView = 'tasks';

    saveSimulationState(state);

    expect(loadSimulationState()).toMatchObject({
      version: 1,
      selectedView: 'tasks',
      selectedPatientId: 'DCU-031'
    });
  });

  it('rejects corrupt, incompatible and incomplete records', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    expect(loadSimulationState()).toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, patients: [] }));
    expect(loadSimulationState()).toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, patients: [] }));
    expect(loadSimulationState()).toBeNull();
  });

  it('clears the saved simulation', () => {
    saveSimulationState(createInitialSimulationState());

    clearSimulationState();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('uses an injected storage boundary', () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key)
    };

    saveSimulationState(createInitialSimulationState(), storage);
    expect(loadSimulationState(storage)?.version).toBe(1);
    clearSimulationState(storage);
    expect(loadSimulationState(storage)).toBeNull();
  });
});
