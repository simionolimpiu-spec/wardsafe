import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const directory = resolve('src/agent');
const allFiles = readdirSync(directory, { recursive: true }).map((name) => name.replaceAll('\\', '/'));
const sources = allFiles.filter((name) => name.endsWith('.js') && !name.endsWith('.test.js'));

describe('agent source guards', () => {
  it('scans all domain source modules', () => {
    expect(sources).toEqual(expect.arrayContaining(['ai/promptBoundary.js', 'ai/reviewResponse.js', 'ai/aiModelProvider.js', 'ai/mockAIModelProvider.js']));
    expect(sources).toEqual(expect.arrayContaining(['tools/clinicalTools.js', 'tools/simulatedPatientSource.js']));
    expect(sources).toEqual(expect.arrayContaining(['trustTiers.js', 'provenance.js', 'clinicalFact.js', 'agentEvent.js', 'generatedContent.js', 'systemInstruction.js', 'agentSession.js', 'index.js']));
  });
  it('excludes public case corpus imports from every agent file', () => {
    for (const name of allFiles.filter((file) => file.endsWith('.js'))) {
      const source = readFileSync(join(directory, name), 'utf8');
      expect(source).not.toMatch(/(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*data\/public-case-corpus/);
    }
  });
  it.each(sources)('%s has no network, environment or ambient randomness', (name) => {
    const source = readFileSync(join(directory, name), 'utf8');
    expect(source).not.toMatch(/\bfetch\s*\(|import\s+OpenAI|process\s*\.\s*env|Date\s*\.\s*now|Math\s*\.\s*random/);
  });
  it.each(sources)('%s has no prohibited wording', (name) => {
    // Scanning all source text is stricter than scanning only string literals.
    const source = readFileSync(join(directory, name), 'utf8');
    // The response validator must name rejected phrases in its detection regex.
    // Keep the exception to that single declaration; scan all other source text.
    const checked = name === 'ai/reviewResponse.js' ? source.replace(/^const bannedWording = \/.*\/i;$/m, '') : source;
    expect(checked).not.toMatch(/diagnos|prescrib|administer|treatment recommendation|patient requires|safe to discharge/i);
  });
});
