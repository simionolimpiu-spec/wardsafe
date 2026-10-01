import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'vite.offline.config.js'], { cwd: root, stdio: 'inherit' });
const output = join(root, 'WardSafe_Offline_Demo.html');
copyFileSync(join(root, 'dist-offline/index.offline.html'), output);

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}
const sourceHash = createHash('sha256');
const sources = [...filesIn(join(root, 'src')), ...['package.json', 'package-lock.json', 'index.offline.html', 'vite.offline.config.js', 'scripts/build-offline.mjs'].map((path) => join(root, path))].filter(existsSync).sort();
for (const path of sources) sourceHash.update(relative(root, path).replaceAll('\\', '/')).update('\0').update(readFileSync(path)).update('\0');
writeFileSync(join(root, 'WardSafe_Offline_Demo.build.json'), JSON.stringify({
  simulationOnly: true,
  builtAt: new Date().toISOString(),
  sourceSha256: sourceHash.digest('hex'),
  htmlSha256: createHash('sha256').update(readFileSync(output)).digest('hex'),
  sourceFileCount: sources.length,
  command: 'npm run build:offline'
}, null, 2) + '\n');
console.log('Updated WardSafe_Offline_Demo.html and its build manifest.');
