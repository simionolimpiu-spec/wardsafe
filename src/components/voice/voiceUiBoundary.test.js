// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const folder = resolve('src/components/voice');
const files = [
  ...readdirSync(folder).filter((name) => name.endsWith('.jsx') && !name.endsWith('.test.jsx')).map((name) => resolve(folder, name)),
  resolve('src/voice/voiceWorkspace.js'), resolve('src/voice/voiceDemoFixtures.js')
];
it.each(files)('%s has no live, audio, storage or unsafe rendering capability', (file) => {
  const source = readFileSync(file, 'utf8');
  for (const pattern of [
    /\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /localStorage/, /sessionStorage/,
    /console\s*\./, /\bNotification\b/, /serviceWorker/, /navigator\s*\.\s*clipboard/,
    /dangerouslySetInnerHTML/, /Date\s*\.\s*now\s*\(/, /Math\s*\.\s*random\s*\(/,
    /getUserMedia/, /mediaDevices/, /MediaRecorder/, /AudioContext/, /webkitAudioContext/,
    /\bSpeechRecognition\b/, /webkitSpeechRecognition/, /speechSynthesis/, /SpeechSynthesisUtterance/,
    /new\s+Audio\s*\(/, /<audio\b/i, /<video\b/i
  ]) expect(source, `${file}: ${pattern}`).not.toMatch(pattern);
});
