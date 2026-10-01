import { assertKeys, assertStrings, frozenCopy, isNonEmptyString, requireValue } from './domainValues.js';
export function defineProviderContract(input) {
  assertKeys(input, ['name', 'methods', 'capabilityKeys']);
  assertStrings(input, ['name']);
  for (const key of ['methods', 'capabilityKeys']) {
    requireValue(Array.isArray(input[key]) && input[key].every(isNonEmptyString) && new Set(input[key]).size === input[key].length, `${key} must be unique names`);
  }
  requireValue(input.methods.length > 0, 'Contract requires methods');
  return frozenCopy({ ...input, simulationOnly: true });
}
export function assertSimulationProvider(provider) {
  requireValue(provider?.mode === 'simulation' && provider?.live === false, 'Only simulation providers are permitted');
  return provider;
}
export function assertImplementsContract(provider, contract) {
  requireValue(provider !== null && typeof provider === 'object', 'Provider required');
  assertStrings(provider, ['id', 'mode']);
  requireValue(provider.capabilities !== null && typeof provider.capabilities === 'object' && !Array.isArray(provider.capabilities), 'Provider capabilities required');
  for (const key of contract.capabilityKeys) {
    requireValue(Object.hasOwn(provider.capabilities, key), `Missing capability: ${key}`);
    const value = provider.capabilities[key];
    requireValue(key === 'supportedLocales' || key === 'outputModes' ? Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString) : typeof value === 'boolean', `Invalid capability: ${key}`);
  }
  for (const method of contract.methods) requireValue(typeof provider[method] === 'function', `Missing provider method: ${method}`);
  return provider;
}
