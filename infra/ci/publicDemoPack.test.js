import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readPublicDoc(path) {
  return readFileSync(resolve(process.cwd(), 'docs/public-demo-pack', path), 'utf8');
}

describe('SafeFlow public demo pack', () => {
  it('includes a reusable discovery feedback and backlog template', () => {
    const readme = readPublicDoc('README.md');
    const workshop = readPublicDoc('discovery-workshop-pack.md');
    const templatePath = 'templates/discovery-feedback-backlog-template.md';
    const templateFile = resolve(process.cwd(), 'docs/public-demo-pack', templatePath);

    expect(existsSync(templateFile)).toBe(true);
    expect(readme).toContain(templatePath);
    expect(workshop).toContain(templatePath);

    const template = readFileSync(templateFile, 'utf8');

    expect(template).toContain('Scenario Prioritisation');
    expect(template).toContain('Backlog Decision');
    expect(template).toContain('Hazard Or Safety Concern');
    expect(template).toContain('No live patient data');
    expect(template).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
    expect(template).not.toMatch(/NHS logo|official NHS/i);
  });
});
