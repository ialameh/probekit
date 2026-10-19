import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkParams, safetyCheck, runProbe, validateProbe } from './lib/engine.mjs';

const probe = {
  id: 't.probe', question: 'q', family: 't',
  params: { obj: { type: 'sobject' }, user: { type: 'username', optional: true } },
  safety: { writes: false },
  steps: [
    { name: 'grants', soql: "SELECT Parent.Name FROM FieldPermissions WHERE SobjectType = '{obj}'" },
    { name: 'assignments', when: 'user !== undefined', soql: "SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE Assignee.Username = '{user}'" },
  ],
  verdicts: [
    { when: 'grants.rows === 0', say: 'none on {obj}' },
    { when: "assignments.rows > 0 && overlap(grants.col('Parent.Name'), assignments.col('PermissionSet.Name')) === 0", say: 'not assigned to {user}' },
    { say: '{grants.rows} grant(s), first {= grants.records[0]["Parent.Name"]}' },
  ],
};

test('rejects injection through params', () => {
  assert.ok(checkParams(probe, { obj: "Account' OR Name != '" }).problems.length);
  assert.ok(checkParams(probe, { obj: 'Account', user: "x'@y" }).problems.length);
  assert.deepEqual(checkParams(probe, { obj: 'Account' }).problems, []);
});

test('missing required param is reported', () => {
  assert.match(checkParams(probe, {}).problems[0], /--obj is required/);
});

test('writing probe is refused on a read-only org and without --allow-write', () => {
  const w = { ...probe, safety: { writes: true } };
  assert.ok(safetyCheck(w, 'prod', { alias: 'P', readonly: true }).some((r) => /read-only/.test(r)));
  assert.ok(safetyCheck(w, 'dev', { alias: 'D' }).some((r) => /allow-write/.test(r)));
  assert.deepEqual(safetyCheck(w, 'dev', { alias: 'D' }, { allowWrite: true }), []);
});

test('unbounded query is refused on production', () => {
  const u = { ...probe, steps: [{ name: 'all', soql: 'SELECT Id FROM Account' }] };
  assert.ok(safetyCheck(u, 'prod', { alias: 'P', production: true }).some((r) => /unbounded/.test(r)));
  assert.deepEqual(safetyCheck(probe, 'prod', { alias: 'P', production: true }), []);
});

test('unknown org and disallowed org are refused', () => {
  assert.ok(safetyCheck(probe, 'nope', undefined).length);
  assert.ok(safetyCheck({ ...probe, safety: { writes: false, orgs: ['dev'] } }, 'uat', { alias: 'U' }).length);
});

test('optional step skipped and verdict picked from results', () => {
  const fake = () => [{ attributes: {}, Parent: { attributes: {}, Name: 'PS_A' } }];
  const out = runProbe(probe, { obj: 'Account' }, 'D', fake);
  assert.equal(out.results.assignments.skipped, true);
  assert.equal(out.verdict, '1 grant(s), first PS_A');
});

test('grant not assigned to user', () => {
  const fake = (alias, soql) => soql.includes('FieldPermissions')
    ? [{ Parent: { Name: 'PS_A' } }] : [{ PermissionSet: { Name: 'PS_B' } }];
  const out = runProbe(probe, { obj: 'Account', user: 'a@b.c' }, 'D', fake);
  assert.equal(out.verdict, 'not assigned to a@b.c');
});

test('validator catches reserved step names and a missing fallback', () => {
  assert.ok(validateProbe({ ...probe, steps: [{ name: 'class', soql: 'x' }] }).some((p) => /reserved/.test(p)));
  assert.ok(validateProbe({ ...probe, verdicts: [{ when: 'true', say: 'x' }] }).some((p) => /fallback/.test(p)));
});

import { render } from './lib/engine.mjs';

test('optional fragment kept only when its params are given', () => {
  const t = "SELECT Id FROM A WHERE Id != null [[AND B = '{b}']]";
  assert.equal(render(t, { b: 'x' }), "SELECT Id FROM A WHERE Id != null AND B = 'x'");
  assert.equal(render(t, {}).trim(), 'SELECT Id FROM A WHERE Id != null');
});

test('step reference renders a quoted list, or an empty literal', () => {
  const results = { u: { records: [{ Id: '005A' }, { Id: '005B' }, { Id: '005A' }] } };
  assert.equal(render('WHERE X IN ({@u.Id})', {}, results), "WHERE X IN ('005A','005B')");
  assert.equal(render('WHERE X IN ({@none.Id})', {}, results), "WHERE X IN ('')");
});

test('default fills a missing param; reserved param names are rejected', () => {
  const p = { ...probe, params: { days: { type: 'int', default: '7' } } };
  assert.deepEqual(checkParams(p, {}).params, { days: '7' });
  assert.ok(validateProbe({ ...probe, params: { class: { type: 'name' } } }).some((m) => /reserved/.test(m)));
});

test('production refuses a query whose WHERE sat in a dropped fragment', () => {
  const p = { ...probe, params: { b: { type: 'name', optional: true } }, steps: [{ name: 's', soql: "SELECT Id FROM A [[WHERE B = '{b}']]" }], verdicts: [{ say: 'x' }] };
  assert.throws(() => runProbe(p, {}, 'P', () => [], { production: true }), /unbounded/);
  assert.equal(runProbe(p, { b: 'y' }, 'P', () => [], { production: true }).verdict, 'x');
});

test('every shipped probe file is valid', async () => {
  const { loadProbes } = await import('./lib/engine.mjs');
  const probes = loadProbes(null);
  assert.ok(probes.size >= 60);
});
