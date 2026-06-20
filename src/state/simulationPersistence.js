export const STORAGE_KEY = 'safeflow.simulation.v1';

function defaultStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function loadSimulationState(storage = defaultStorage()) {
  if (!storage) return null;

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) return null;

    const value = JSON.parse(rawValue);
    if (value?.version !== 1) return null;
    if (!Array.isArray(value.patients) || value.patients.length === 0) return null;
    if (!Array.isArray(value.auditEvents) || !Array.isArray(value.escalations)) return null;
    if (!value.settings || typeof value.settings !== 'object') return null;

    return value;
  } catch {
    return null;
  }
}

export function saveSimulationState(state, storage = defaultStorage()) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearSimulationState(storage = defaultStorage()) {
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}
