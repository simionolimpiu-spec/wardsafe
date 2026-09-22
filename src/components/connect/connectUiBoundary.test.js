// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const folder = resolve('src/components/connect');
const files = [
  ...readdirSync(folder)
    .filter((name) => name.endsWith('.jsx') && !name.endsWith('.test.jsx'))
    .map((name) => resolve(folder, name)),
  resolve('src/connect/connectWorkspace.js'),
  resolve('src/connect/demoFixtures.js')
];
it.each(files)(
  '%s has no live, persistence, capture or unsafe rendering boundary',
  (file) => {
    const source = readFileSync(file, 'utf8');
    for (const pattern of [
      /\bfetch\s*\(/,
      /XMLHttpRequest/,
      /WebSocket/,
      /localStorage/,
      /sessionStorage/,
      /console\s*\./,
      /\bNotification\b/,
      /serviceWorker/,
      /navigator\s*\.\s*clipboard/,
      /dangerouslySetInnerHTML/,
      /Date\s*\.\s*now\s*\(/,
      /Math\s*\.\s*random\s*\(/,
      /getUserMedia/
    ])
      expect(source).not.toMatch(pattern);
  }
);
