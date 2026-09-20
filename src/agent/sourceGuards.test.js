import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = resolve('src/agent');
const sources = readdirSync(directory).filter((name) => name.endsWith('.js') && !name.endsWith('.test.js'));

describe('agent source guards', () => {
  it('scans all domain source modules', () => {
    expect(sources).toEqual(expect.arrayContaining(['trustTiers.js', 'provenance.js', 'clinicalFact.js', 'agentEvent.js', 'generatedContent.js', 'systemInstruction.js', 'agentSession.js', 'index.js']));
  });
  it.each(sources)('%s has no network, environment or ambient randomness', (name) => {
    const source = readFileSync(join(directory, name), 'utf8');
    expect(source).not.toMatch(/\bfetch\s*\(|import\s+OpenAI|process\s*\.\s*env|Date\s*\.\s*now|Math\s*\.\s*random/);
  });
  it.each(sources)('%s has no prohibited wording', (name) => {
    // Scanning all source text is stricter than scanning only string literals.
    const source = readFileSync(join(directory, name), 'utf8');
    expect(source).not.toMatch(/diagnos|prescrib|administer|treatment recommendation|patient requires|safe to discharge/i);
  });
});
