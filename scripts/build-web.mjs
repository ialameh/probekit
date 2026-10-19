import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { loadProbes } from '../lib/engine.mjs';

// Public deployments include only the shipped library, never project probes or usage.
const data = [...loadProbes(null).values()].map(({ file, ...probe }) => ({ ...probe, logged: 0 }));
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = readFileSync(new URL('../lib/web.html', import.meta.url), 'utf8')
  .replace('/*PROBES*/', () => json);
const output = new URL('../dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
writeFileSync(new URL('index.html', output), html);
writeFileSync(new URL('getting-started.html', output), readFileSync(new URL('../docs/getting-started.html', import.meta.url)));
cpSync(new URL('../web/', import.meta.url), output, { recursive: true, filter: source => !source.endsWith('.test.mjs') });
rmSync(new URL('access-analysis.test.mjs', output), { force: true });
const catalogue = data.map(({ id, question, family, params, safety, steps, traps }) => ({ id, question, family, params, safety, steps, traps }));
writeFileSync(new URL('investigation-catalogue.mjs', output), `export default ${JSON.stringify(catalogue).replace(/</g, '\\u003c')};\n`);
console.log(`Built ${data.length} probes into dist/index.html`);
