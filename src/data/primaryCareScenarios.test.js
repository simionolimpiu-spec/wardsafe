import { primaryCareScenarios } from './primaryCareScenarios.js';

describe('primary-care simulation fixtures', () => {
  it('uses simulated sample references and explicit simulation context', () => {
    expect(primaryCareScenarios.length).toBeGreaterThan(0);
    expect(primaryCareScenarios.every((scenario) => /sample|simulat/i.test(`${scenario.description} ${scenario.networkName}`))).toBe(true);
    expect(primaryCareScenarios.flatMap((scenario) => scenario.contacts).every((record) => /^PC-\d{3}$/.test(record.id))).toBe(true);
  });

  it('does not introduce prohibited clinical direction wording', () => {
    const content = JSON.stringify(primaryCareScenarios);
    expect(content).not.toMatch(/treatment recommendation|patient needs potassium|give potassium|autonomous care|live NHS deployment/i);
    expect(content).not.toMatch(/\b\d{3}\s?\d{3}\s?\d{4}\b/);
  });
});
