import { useEffect, useReducer } from 'react';
import {
  createInitialSimulationState,
  normaliseSimulationState,
  simulationReducer
} from './simulationWorkspace.js';
import {
  clearSimulationState,
  loadSimulationState,
  saveSimulationState
} from './simulationPersistence.js';

export function useSimulationWorkspace() {
  const [state, dispatch] = useReducer(
    simulationReducer,
    undefined,
    () => normaliseSimulationState(loadSimulationState()) ?? createInitialSimulationState()
  );

  useEffect(() => {
    saveSimulationState(state);
  }, [state]);

  function reset(meta) {
    clearSimulationState();
    dispatch({ type: 'workspace/reset', meta });
  }

  return { state, dispatch, reset };
}
