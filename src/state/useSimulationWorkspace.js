import { useEffect, useReducer, useState } from 'react';
import { createInitialSimulationState, simulationReducer } from './simulationWorkspace.js';
import {
  clearSimulationState,
  loadSimulationState,
  saveSimulationState
} from './simulationPersistence.js';

export function useSimulationWorkspace(initialView) {
  const [persistenceError, setPersistenceError] = useState('');
  const [state, dispatch] = useReducer(
    simulationReducer,
    undefined,
    () => {
      const saved = loadSimulationState();
      if (saved?.selectedHospitalId && saved.censusVersion !== 3) {
        // Keep the previous census in its original archive key; never attach old edits to new fictional identities.
        const updated = simulationReducer(saved, { type: 'workspace/wardOpened', payload: { hospitalId: saved.selectedHospitalId, wardId: saved.selectedWardId } });
        return updated === saved ? { ...saved, selectedView: 'hospitals' } : updated;
      }
      return saved ?? { ...createInitialSimulationState(), ...(initialView ? { selectedView: initialView } : {}) };
    }
  );

  useEffect(() => {
    try {
      saveSimulationState(state);
      setPersistenceError('');
    } catch {
      setPersistenceError('Changes could not be saved on this device. Keep this page open and retry saving.');
    }
  }, [state]);

  function reset(meta) {
    try { clearSimulationState(); } catch { /* The reset state will be saved by the effect. */ }
    dispatch({ type: 'workspace/reset', meta });
  }

  function commit(action) {
    try {
      saveSimulationState(simulationReducer(state, action));
      dispatch(action);
      setPersistenceError('');
      return true;
    } catch {
      setPersistenceError('Changes could not be saved on this device. Keep this page open and retry saving.');
      return false;
    }
  }

  return { state, dispatch, reset, commit, persistenceError };
}
