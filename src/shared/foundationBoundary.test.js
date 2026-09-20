import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { assertImplementsContract, assertSimulationProvider } from './providerContract.js';
import { CommunicationProvider, createSimulationCommunicationProvider } from '../connect/index.js';
import * as voice from '../voice/index.js';
import * as poc from '../pointOfCare/index.js';
const roots = ['shared', 'connect', 'voice', 'pointOfCare'];
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(resolve(directory, entry.name)) : entry.name.endsWith('.js') && !entry.name.endsWith('.test.js') ? [resolve(directory, entry.name)] : []);
}
const files = roots.flatMap((root) => sourceFiles(resolve('src', root)));
it.each(files.map((file) => [relative(resolve('src'), file), file]))('%s contains no network, capture, storage, logging, environment or nondeterministic calls', (_, file) => {
  const source = readFileSync(file, 'utf8');
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'getUserMedia', 'MediaRecorder', 'SpeechRecognition(', 'speechSynthesis', 'localStorage', 'sessionStorage', 'console.', 'openai', 'baileys', 'whatsapp-web', 'process.env', 'Date.now(', 'Math.random(']) expect(source, `${file}: ${forbidden}`).not.toContain(forbidden);
  expect(source).not.toMatch(/\b(?:fetch|Date\.now|Math\.random)\s*\(/);
});
it('keeps pillars independent and shared free of pillar imports', () => {
  for (const file of files) {
    const sourceRoot = relative(resolve('src'), file).split(/[\\/]/)[0];
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:^\s*(?:import|export)\s+[^;\n]*?\sfrom\s+|^\s*import\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/gm)) {
      const target = match[1];
      expect(target.startsWith('.'), `${file}: external import ${target}`).toBe(true);
      const targetRoot = relative(resolve('src'), resolve(dirname(file), target)).split(/[\\/]/)[0];
      expect(sourceRoot === 'shared' ? targetRoot === 'shared' : [sourceRoot, 'shared'].includes(targetRoot), `${file}: cross-pillar import ${target}`).toBe(true);
    }
  }
});
it('every simulation provider implements its contract and rejects a live variant', () => {
  const deps = { now: () => '2026-09-20T12:00:00Z', createId: () => 'fixture-id' };
  const pairs = [
    [createSimulationCommunicationProvider(), CommunicationProvider],
    [voice.createSimulationSpeechRecognitionProvider(deps), voice.SpeechRecognitionProvider],
    [voice.createSimulationSpeechSynthesisProvider(), voice.SpeechSynthesisProvider],
    [voice.createSimulationAmbientDocumentationProvider(deps), voice.AmbientDocumentationProvider],
    [voice.createSimulationTranslationProvider(deps), voice.TranslationProvider],
    [voice.createSimulationClinicalSpeechLexiconProvider(), voice.ClinicalSpeechLexiconProvider],
    [poc.createSimulationDeviceObservationProvider(deps), poc.DeviceObservationProvider],
    [poc.createSimulationDocumentCaptureProvider(deps), poc.DocumentCaptureProvider]
  ];
  for (const [provider, contract] of pairs) {
    expect(assertImplementsContract(provider, contract)).toBe(provider);
    expect(assertSimulationProvider(provider)).toBe(provider);
    expect(() => assertSimulationProvider({ ...provider, live: true })).toThrow();
  }
});
