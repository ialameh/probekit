// probekit engine: load probe definitions, check safety, run steps, pick a verdict.
// Probe files are trusted local config: conditions are small JavaScript expressions.

import { readFileSync, readdirSync, existsSync, statSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const TOOL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- project config ----------

// Walk up from cwd to find .probekit/config.json. The project owns org aliases,
// extra probe folders and the usage log; the tool owns only generic probes.
export function findProject(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    const cfg = join(dir, '.probekit', 'config.json');
    if (existsSync(cfg)) {
      const root = join(dir, '.probekit');
      const config = JSON.parse(readFileSync(cfg, 'utf8'));
      return { root, config };
    }
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

// ---------- probe loading ----------

function walkJson(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

export function loadProbes(project) {
  const dirs = [{ dir: join(TOOL_DIR, 'probes'), source: 'tool' }];
  for (const d of project ? project.config.probePaths ?? ['probes'] : []) {
    dirs.push({ dir: resolve(project.root, d), source: 'project' });
  }
  const probes = new Map();
  for (const { dir, source } of dirs) {
    for (const file of walkJson(dir)) {
      const probe = JSON.parse(readFileSync(file, 'utf8'));
      const problems = validateProbe(probe);
      if (problems.length) throw new Error(`${file}: ${problems.join('; ')}`);
      // A project probe with the same id overrides the generic one.
      probes.set(probe.id, { ...probe, file, source });
    }
  }
  return probes;
}

const RESERVED = new Set(['class', 'function', 'new', 'delete', 'default', 'case', 'if', 'else', 'for', 'while', 'do',
  'return', 'var', 'let', 'const', 'in', 'of', 'this', 'true', 'false', 'null', 'undefined', 'with', 'switch', 'try', 'catch',
  'throw', 'typeof', 'void', 'yield', 'await', 'import', 'export', 'extends', 'super', 'enum', 'overlap', 'has']);

const REQUIRED = ['id', 'question', 'family', 'params', 'safety', 'steps', 'verdicts'];

export function validateProbe(p) {
  const problems = REQUIRED.filter((k) => p[k] === undefined).map((k) => `missing ${k}`);
  if (p.safety && typeof p.safety.writes !== 'boolean') problems.push('safety.writes must be true or false');
  for (const s of p.steps ?? []) {
    if (!/^[a-z][a-z0-9_]*$/.test(s.name ?? '')) problems.push(`step name "${s.name}" must be lower_snake_case`);
    else if (RESERVED.has(s.name)) problems.push(`step name "${s.name}" is a reserved word`);
    if (!s.soql) problems.push(`step ${s.name}: only soql steps are supported`);
  }
  for (const k of Object.keys(p.params ?? {})) {
    if (RESERVED.has(k) || !/^[a-z][a-z0-9_]*$/.test(k)) problems.push(`param name "${k}" must be lower_snake_case and not a reserved word`);
  }
  const last = (p.verdicts ?? []).at(-1);
  if (last && last.when !== undefined) problems.push('last verdict must be the fallback (no "when")');
  return problems;
}

// ---------- parameters ----------

const TYPES = {
  sobject: /^[A-Za-z][A-Za-z0-9_]*$/,
  field: /^[A-Za-z][A-Za-z0-9_]*$/,
  name: /^[A-Za-z0-9_ .\-]+$/,
  username: /^[^\s'"\\]+@[^\s'"\\]+$/,
  id: /^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/,
  text: /^[^'\\]*$/,
  int: /^\d{1,6}$/,
  fields: /^[A-Za-z][\w.]*(\s*,\s*[A-Za-z][\w.]*)*$/,
};

export function checkParams(probe, given) {
  const params = {};
  const problems = [];
  for (const [key, spec] of Object.entries(probe.params)) {
    const value = given[key] ?? spec.default;
    if (value === undefined || value === '') {
      if (!spec.optional) problems.push(`--${key} is required (${spec.type}, e.g. ${spec.example ?? '?'})`);
      continue;
    }
    const re = TYPES[spec.type];
    if (!re) problems.push(`param ${key}: unknown type ${spec.type}`);
    else if (!re.test(value)) problems.push(`--${key} "${value}" is not a valid ${spec.type}`);
    else params[key] = String(value);
  }
  return { params, problems };
}

// ---------- safety ----------

// Returns the reasons a probe may not run on an org. Empty means allowed.
export function safetyCheck(probe, envName, org, opts = {}) {
  const reasons = [];
  if (!org) return [`org "${envName}" is not in .probekit/config.json`];
  const allowed = probe.safety.orgs;
  if (allowed && !allowed.includes(envName)) reasons.push(`probe allows only ${allowed.join(', ')}`);
  if (probe.safety.writes) {
    if (org.readonly) reasons.push(`${envName} is read-only and this probe writes`);
    if (!opts.allowWrite) reasons.push('probe writes: pass --allow-write to confirm');
  }
  if (org.production) {
    // Production reads must be targeted: every query needs a WHERE or a LIMIT.
    for (const s of probe.steps) {
      if (!/\b(WHERE|LIMIT)\b/i.test(s.soql)) reasons.push(`step ${s.name} is unbounded, not allowed on production`);
    }
  }
  return reasons;
}

// ---------- running ----------

// Fill a SOQL template.
//   {param}          a checked parameter value
//   [[ ... ]]        optional fragment, kept when every {param} inside it was given
//   {@step.Field}    values of Field from an earlier step, quoted for IN ( ... );
//                    an empty result renders '' so the query stays valid
export function render(template, params, results = {}) {
  const given = (k) => params[k] !== undefined && params[k] !== '';
  let out = template.replace(/\[\[(.*?)\]\]/gs, (m, frag) => {
    const keys = [...frag.matchAll(/\{(\w+)\}/g)].map((x) => x[1]);
    return keys.every(given) ? frag : '';
  });
  out = out.replace(/\{@(\w+)\.([\w.]+)\}/g, (m, step, col) => {
    const vals = [...new Set((results[step]?.records ?? []).map((r) => r[col]).filter((v) => v != null))];
    return vals.length ? vals.map((v) => `'${String(v).replace(/'/g, "\\'")}'`).join(',') : "''";
  });
  return out.replace(/\{(\w+)\}/g, (m, k) => (given(k) ? params[k] : m));
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function flatten(rec, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(rec)) {
    if (k === 'attributes') continue;
    const key = prefix + k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key + '.', out);
    else out[key] = v;
  }
  return out;
}

export function sfQuery(alias, soql, tooling) {
  const args = ['data', 'query', '-o', alias, '-q', soql, '--json'];
  if (tooling) args.push('--use-tooling-api');
  let raw;
  try {
    raw = execFileSync('sf', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    raw = e.stdout || '';
    if (!raw) throw new Error(`sf failed: ${e.stderr || e.message}`);
  }
  const res = JSON.parse(raw);
  if (res.status !== 0) throw new Error(res.message || 'query failed');
  return res.result.records;
}

// Context handed to "when" expressions: each step as {rows, records, col(path)},
// every param by name, and two helpers.
function makeContext(params, results) {
  const ctx = { ...params };
  Object.assign(ctx, results);
  ctx.overlap = (a, b) => a.filter((x) => b.includes(x)).length;
  ctx.has = (k) => params[k] !== undefined;
  return ctx;
}

export function value(expr, params, results) {
  const ctx = makeContext(params, results);
  const names = Object.keys(ctx);
  try {
    return new Function(...names, `"use strict"; return (${expr});`)(...names.map((n) => ctx[n]));
  } catch (e) {
    throw new Error(`expression "${expr}": ${e.message}`);
  }
}

export const evaluate = (expr, params, results) => Boolean(value(expr, params, results));

function stepResult(records, step) {
  const flat = records.map((r) => {
    const f = flatten(r);
    for (const h of step.hash ?? []) {
      if (f[h] != null) f[h] = 'sha256:' + createHash('sha256').update(String(f[h])).digest('hex').slice(0, 12);
    }
    return f;
  });
  return {
    rows: flat.length,
    records: flat,
    col: (path) => flat.map((r) => r[path]).filter((v) => v !== undefined && v !== null),
  };
}

export function runProbe(probe, given, alias, query = sfQuery, opts = {}) {
  // Every declared param is visible to conditions; an optional one not given is undefined.
  const params = Object.fromEntries(Object.keys(probe.params).map((k) => [k, given[k]]));
  const results = {};
  for (const step of probe.steps) {
    if (step.when && !opts.allSteps && !evaluate(step.when, params, results)) {
      results[step.name] = { skipped: true, rows: null, records: [], col: () => [] };
      continue;
    }
    const soql = render(step.soql, params, results).replace(/\s+/g, ' ').trim();
    if (/\{\w+\}/.test(soql)) throw new Error(`step ${step.name}: unfilled parameter in ${soql}`);
    // Checked again on the final text: an optional fragment may have dropped the WHERE.
    if (opts.production && !/\b(WHERE|LIMIT)\b/i.test(soql)) throw new Error(`step ${step.name} is unbounded, refused on production`);
    results[step.name] = { ...stepResult(query(alias, soql, step.tooling), step), soql };
  }
  const verdict = probe.verdicts.find((v) => v.when === undefined || evaluate(v.when, params, results));
  const sayParams = { ...given };
  for (const [n, r] of Object.entries(results)) sayParams[`${n}.rows`] = r.rows;
  // {param} and {step.rows} fill in directly; {= expression} is computed from the results.
  const say = verdict.say
    .replace(/\{=([^}]+)\}/g, (m, e) => String(value(e.trim(), params, results)))
    .replace(/\{([\w.\-]+)\}/g, (m, k) => (k in sayParams ? sayParams[k] : m));
  return { results, verdict: say };
}

// ---------- usage log ----------

function csv(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function logUsage(project, probe, entry) {
  const dir = resolve(project.root, project.config.usageDir ?? 'usage');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${probe.id}.csv`);
  if (!existsSync(file)) appendFileSync(file, 'when,org,alias,ticket,params,verdict\n');
  const row = [entry.when, entry.env, entry.alias, entry.ticket, JSON.stringify(entry.params), entry.verdict];
  appendFileSync(file, row.map(csv).join(',') + '\n');
}

export function readUsage(project, probe) {
  const file = join(resolve(project.root, project.config.usageDir ?? 'usage'), `${probe.id}.csv`);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').trim().split('\n').slice(1);
}
