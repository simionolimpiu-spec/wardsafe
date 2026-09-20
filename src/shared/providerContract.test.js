import { expect, it } from 'vitest';
import { assertImplementsContract, assertSimulationProvider, defineProviderContract } from './providerContract.js';
const contract = defineProviderContract({ name: 'Example', methods: ['read'], capabilityKeys: ['supportedLocales', 'supportsConfidence'] });
const provider = { id: 'fictional', mode: 'simulation', live: false, capabilities: { supportedLocales: ['en-GB'], supportsConfidence: true }, read() {} };
it('freezes contracts and checks methods, identity and capability types', () => {
  expect(Object.isFrozen(contract.methods)).toBe(true);
  expect(assertImplementsContract(provider, contract)).toBe(provider);
  for (const invalid of [{ ...provider, id: '' }, { ...provider, read: true }, { ...provider, capabilities: {} }, { ...provider, capabilities: { ...provider.capabilities, supportedLocales: true } }]) expect(() => assertImplementsContract(invalid, contract)).toThrow();
});
it('fails closed for live true or missing simulation markers', () => {
  expect(assertSimulationProvider(provider)).toBe(provider);
  for (const invalid of [{ ...provider, live: true }, { ...provider, live: undefined }, { ...provider, mode: 'live' }, null]) expect(() => assertSimulationProvider(invalid)).toThrow();
});
it('rejects duplicate contract method names', () => expect(() => defineProviderContract({ name: 'bad', methods: ['read', 'read'], capabilityKeys: [] })).toThrow());
