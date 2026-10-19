#!/usr/bin/env node
// probekit: run named, reusable Salesforce org probes.
//   probe list [family]
//   probe show <id>
//   probe run <id> --org dev[,uat] [--ticket PROJ-1234] [--<param> value ...]
//   probe docs --out <dir>

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import {
  findProject, loadProbes, checkParams, safetyCheck, runProbe, logUsage, readUsage, TOOL_DIR,
} from './lib/engine.mjs';

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, flags };
}

function table(records, maxWidth = 60) {
  if (!records.length) return '    (no rows)';
  const cols = Object.keys(records[0]);
  const cell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.length > maxWidth ? s.slice(0, maxWidth - 1) + '~' : s;
  };
  const widths = cols.map((c) => Math.max(c.length, ...records.map((r) => cell(r[c]).length)));
  const line = (vals) => '    ' + vals.map((v, i) => v.padEnd(widths[i])).join('  ');
  return [line(cols), line(widths.map((w) => '-'.repeat(w))), ...records.map((r) => line(cols.map((c) => cell(r[c]))))].join('\n');
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function cmdList(probes, family) {
  const rows = [...probes.values()]
    .filter((p) => !family || p.family === family)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => ({ id: p.id, writes: p.safety.writes ? 'WRITES' : 'read', from: p.source, question: p.question }));
  console.log(table(rows, 90));
}

function cmdShow(project, probe) {
  console.log(`${probe.id}  (${probe.source}: ${probe.file})`);
  console.log(`Question: ${probe.question}`);
  console.log(`Safety:   ${probe.safety.writes ? 'WRITES' : 'read-only'}, orgs ${probe.safety.orgs?.join(', ') ?? 'any'}`);
  if (probe.rule) console.log(`Rule:     ${probe.rule}`);
  console.log('Params:');
  for (const [k, s] of Object.entries(probe.params)) {
    console.log(`  --${k}  ${s.type}${s.optional ? ' (optional)' : ''}  e.g. ${s.example ?? ''}`);
  }
  console.log('Steps:');
  for (const s of probe.steps) console.log(`  ${s.name}${s.when ? `  when ${s.when}` : ''}${s.tooling ? '  [tooling]' : ''}`);
  if (probe.traps?.length) {
    console.log('Traps:');
    for (const t of probe.traps) console.log(`  - ${t}`);
  }
  const usage = project ? readUsage(project, probe) : [];
  console.log(`Usage: ${usage.length} logged run(s)`);
  for (const u of usage.slice(-10)) console.log(`  ${u}`);
}

function cmdRun(project, probe, flags) {
  if (!project) die('No .probekit/config.json found above this folder.');
  if (!flags.org) die('--org is required, e.g. --org dev or --org dev,uat');
  const { params, problems } = checkParams(probe, flags);
  if (problems.length) die(problems.join('\n'));

  const envs = String(flags.org).split(',');
  const runs = [];
  for (const env of envs) {
    const org = project.config.orgs[env];
    const blocked = safetyCheck(probe, env, org, { allowWrite: flags['allow-write'] === true });
    if (blocked.length) die(`Refused on ${env}:\n  ${blocked.join('\n  ')}`);
  }
  for (const env of envs) {
    const org = project.config.orgs[env];
    const when = new Date().toISOString();
    console.log(`\n=== ${probe.id} on ${env} (${org.alias})${org.production ? ' PRODUCTION' : ''}, ${when}`);
    const out = runProbe(probe, params, org.alias, undefined, { allSteps: flags['all-steps'] === true, production: org.production === true });
    for (const [name, r] of Object.entries(out.results)) {
      if (r.skipped) { console.log(`\n  ${name}: skipped`); continue; }
      console.log(`\n  ${name}: ${r.rows} row(s)`);
      if (flags.soql) console.log(`    ${r.soql}`);
      console.log(table(r.records));
    }
    console.log(`\n  Verdict: ${out.verdict}`);
    logUsage(project, probe, { when, env, alias: org.alias, ticket: flags.ticket ?? '', params, verdict: out.verdict });
    runs.push({ env, out });
  }

  if (runs.length > 1) {
    // Compare only the columns a step names as meaningful; deployer names and dates differ by nature.
    console.log('\n=== Compare (' + envs.join(' vs ') + ')');
    for (const step of probe.steps) {
      const sample = runs.map((r) => r.out.results[step.name].records[0]).find(Boolean) ?? {};
      const cols = step.compare === '*' ? Object.keys(sample).filter((c) => c !== 'Id') : step.compare;
      if (!cols) { console.log(`  ${step.name}: no compare columns declared`); continue; }
      const keyed = runs.map((r) => new Set(r.out.results[step.name].records.map((rec) => cols.map((c) => `${c}=${rec[c]}`).join(' | '))));
      const all = new Set(keyed.flatMap((k) => [...k]));
      const odd = [...all].filter((k) => !keyed.every((set) => set.has(k)));
      if (!odd.length) { console.log(`  ${step.name}: same on ${cols.join(', ')}`); continue; }
      console.log(`  ${step.name}: DIFFERS on ${cols.join(', ')}`);
      for (const k of odd) console.log(`    only on ${envs.filter((e, i) => keyed[i].has(k)).join(', ')}: ${k}`);
    }
  }
}

function cmdDocs(project, probes, outDir) {
  if (!outDir) die('--out <dir> is required');
  mkdirSync(outDir, { recursive: true });
  const all = [...probes.values()].sort((a, b) => a.family.localeCompare(b.family) || a.id.localeCompare(b.id));
  const index = ['# Probe library', '', `${all.length} probes.`, '',
    '| Probe | Question | Writes | Runs logged |', '|---|---|---|---|'];
  for (const p of all) {
    const usage = project ? readUsage(project, p) : [];
    index.push(`| [${p.id}](${p.id}.md) | ${p.question} | ${p.safety.writes ? 'yes' : 'no'} | ${usage.length} |`);
    const page = [`# ${p.id}`, '', p.question, '', `- Family: ${p.family}`, `- Writes: ${p.safety.writes ? 'yes' : 'no'}`,
      `- Orgs: ${p.safety.orgs?.join(', ') ?? 'any'}`, p.rule ? `- Rule: ${p.rule}` : '',
      '', '## Run', '', '```', `probe run ${p.id} --org <org> ${Object.entries(p.params).filter(([, s]) => !s.optional && s.default === undefined).map(([k, s]) => `--${k} ${/\s/.test(s.example ?? '') ? `"${s.example}"` : s.example}`).join(' ')}`, '```',
      '', '## Parameters', ''];
    if (!Object.keys(p.params).length) page.push('None.');
    for (const [k, s] of Object.entries(p.params)) page.push(`- ${k}: ${s.type}${s.optional ? ', optional' : ''}${s.default !== undefined ? `, default ${s.default}` : ''}, e.g. ${s.example ?? ''}`);
    page.push('', '## Steps', '');
    for (const s of p.steps) page.push(`### ${s.name}${s.tooling ? ' (Tooling API)' : ''}`, '', s.when ? `Runs when: \`${s.when}\`` : '', '', '```sql', s.soql, '```', '');
    page.push('## Verdicts', '');
    for (const v of p.verdicts) page.push(`- ${v.when ? `When ${v.when}: ` : 'Otherwise: '}${v.say}`);
    if (p.traps?.length) page.push('', '## Traps', '', ...p.traps.map((t) => `- ${t}`));
    page.push('', '## Usage', '', `${usage.length} logged run(s).`, '');
    if (usage.length) page.push('```', 'when,org,alias,ticket,params,verdict', ...usage.slice(-20), '```');
    writeFileSync(join(outDir, `${p.id}.md`), page.join('\n').replace(/\n{3,}/g, '\n\n') + '\n');
  }
  writeFileSync(join(outDir, 'README.md'), index.join('\n') + '\n');
  console.log(`Wrote ${all.length + 1} page(s) to ${outDir}`);
}

// The browser page: one self-contained HTML file with the probes embedded as JSON.
function webPage(project) {
  const probes = loadProbes(project);
  const data = [...probes.values()].map(({ file, ...p }) => ({ ...p, logged: project ? readUsage(project, p).length : 0 }));
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return readFileSync(join(TOOL_DIR, 'lib', 'web.html'), 'utf8').replace('/*PROBES*/', () => json);
}

function cmdWeb(project, flags) {
  if (flags.serve) {
    const port = Number(flags.port) || 4791;
    createServer((req, res) => {
      try {
        // Rebuilt on every load, so edits to probe files show on refresh.
        const html = webPage(findProject() ?? project);
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(html);
      } catch (e) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end(String(e.message));
      }
    }).listen(port, '127.0.0.1', () => console.log(`Probe Library on http://127.0.0.1:${port} (Ctrl+C to stop)`));
    return;
  }
  const out = flags.out || 'probe-library.html';
  writeFileSync(out, webPage(project));
  console.log(`Wrote ${out}`);
}

const { pos, flags } = parseArgs(process.argv.slice(2));
const [cmd, arg] = pos;
const project = findProject();
let probes;
try { probes = loadProbes(project); } catch (e) { die(e.message); }

const needProbe = () => probes.get(arg) ?? die(`Unknown probe "${arg}". Try: probe list`);

switch (cmd) {
  case 'list': cmdList(probes, arg); break;
  case 'show': cmdShow(project, needProbe()); break;
  case 'run': try { cmdRun(project, needProbe(), flags); } catch (e) { die(`Failed: ${e.message}`); } break;
  case 'docs': cmdDocs(project, probes, flags.out); break;
  case 'web': cmdWeb(project, flags); break;
  default: console.log('Usage: probe list [family] | show <id> | run <id> --org dev[,uat] [--ticket KEY] [--param value] | docs --out <dir> | web [--out file.html] [--serve [--port 4791]]');
}
