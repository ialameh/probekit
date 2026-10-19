export const MAX_BYTES = 2 * 1024 * 1024;
export function value(row, key) {
  if (Object.hasOwn(row, key)) return row[key];
  return key.split('.').reduce((v, k) => v == null ? null : v[k], row);
}
const present = v => v !== undefined && v !== null && v !== '';
const truth = v => v === true || String(v).toLowerCase() === 'true';
export function queries({object, field, username}) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(object) || !/^[A-Za-z][A-Za-z0-9_]*$/.test(field)) throw Error('Use API names containing letters, numbers and underscores.');
  if (!/^[^\s'"\\]+@[^\s'"\\]+$/.test(username) || username.length > 254) throw Error('Enter the exact Salesforce username, including any sandbox suffix.');
  return {
    user: `SELECT Id, Username, ProfileId, IsActive FROM User WHERE Username = '${username}' LIMIT 2`,
    grants: `SELECT Field, SobjectType, ParentId, Parent.Name, Parent.ProfileId, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE SobjectType = '${object}' AND Field = '${object}.${field}' ORDER BY ParentId`,
    assignments: `SELECT AssigneeId, PermissionSetId, PermissionSetGroupId FROM PermissionSetAssignment WHERE Assignee.Username = '${username}' ORDER BY PermissionSetId`
  };
}
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === '"') {
      if (cell || closed) throw Error('Invalid CSV quotation.');
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell); cell = ''; closed = false;
      if (c !== ',') { if (row.some(x => x !== '')) rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
    } else { if (closed) throw Error('Unexpected text after a CSV quote.'); cell += c; }
  }
  if (quoted) throw Error('CSV has an unclosed quote.');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  if (!rows.length) throw Error('CSV needs a header row.');
  const headers = rows.shift().map(x => x.trim());
  if (headers.some(x => !x) || new Set(headers).size !== headers.length) throw Error('CSV headers must be nonempty and unique.');
  return {headers, records: rows.map(r => {
    if (r.length !== headers.length) throw Error('CSV rows do not match the header count.');
    return Object.fromEntries(headers.map((h, i) => [h, r[i] === '' || r[i].toLowerCase() === 'null' ? null : r[i]]));
  })};
}
const columns = {
  user: ['Id', 'Username', 'ProfileId', 'IsActive'],
  grants: ['Field', 'SobjectType', 'ParentId', 'Parent.Name', 'Parent.ProfileId', 'PermissionsRead', 'PermissionsEdit'],
  assignments: ['AssigneeId', 'PermissionSetId', 'PermissionSetGroupId']
};
function has(row, key) {
  if (Object.hasOwn(row, key)) return true;
  const bits = key.split('.'); let v = row;
  for (const bit of bits) { if (!v || !Object.hasOwn(v, bit)) return false; v = v[bit]; }
  return true;
}
export function parseResults(text, kind) {
  if (!columns[kind]) throw Error('Unknown result type.');
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw Error('Keep each result under 2 MB.');
  text = text.trim().replace(/^\uFEFF/, '');
  if (!text) throw Error('Paste results or choose a JSON or CSV file. For zero rows, use [] or a CSV with headers.');
  let records, headers;
  if (/^[\[{]/.test(text)) {
    let data;
    try { data = JSON.parse(text); } catch { throw Error('Invalid JSON. Export the full query result, not a screenshot or console table.'); }
    if (!data || typeof data !== 'object') throw Error('Expected a JSON query result.');
    if (data.status !== undefined && data.status !== 0) throw Error('This is an error response, not a successful query result.');
    data = data.result ?? data;
    if (data.done === false || data.nextRecordsUrl) throw Error('These results are incomplete. Export all pages before analysing.');
    records = Array.isArray(data) ? data : data.records;
    if (!Array.isArray(records)) throw Error('Expected a JSON records array, REST query response, or CLI JSON result.');
    if (data.totalSize !== undefined && Number(data.totalSize) !== records.length) throw Error('The reported total differs from the supplied rows. Export all results.');
  } else ({records, headers} = parseCSV(text));
  if (records.length > 10000) throw Error('Use at most 10,000 rows per result.');
  if (headers && columns[kind].some(k => !headers.includes(k))) throw Error(`Use the supplied query. Required columns: ${columns[kind].join(', ')}.`);
  for (const row of records) {
    if (!row || typeof row !== 'object' || Array.isArray(row) || columns[kind].some(k => !has(row, k))) throw Error(`A row is missing required columns for ${kind}. Run the supplied query without removing columns.`);
    for (const k of kind === 'user' ? ['IsActive'] : kind === 'grants' ? ['PermissionsRead', 'PermissionsEdit'] : []) {
      if (![true, false, 'true', 'false', 'TRUE', 'FALSE'].includes(value(row, k))) throw Error(`${k} must be true or false.`);
    }
    for (const k of kind === 'user' ? ['Id', 'ProfileId'] : kind === 'grants' ? ['ParentId'] : ['AssigneeId', 'PermissionSetId']) {
      if (!/^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/.test(value(row, k) ?? '')) throw Error(`${k} must be a 15- or 18-character Salesforce ID.`);
    }
  }
  return records;
}
const id = v => String(v ?? '').slice(0, 15);
export function analyse(input, datasets) {
  queries(input);
  const {user, grants, assignments} = datasets;
  if (user.length !== 1) throw Error(user.length ? 'More than one user was returned. Check the username and export.' : 'No user was returned. Confirm the username and your permission to query users.');
  const u = user[0];
  if (String(value(u, 'Username')).toLowerCase() !== input.username.toLowerCase()) throw Error('The user result does not match the selected username.');
  if (grants.some(r => value(r, 'Field') !== `${input.object}.${input.field}` || value(r, 'SobjectType') !== input.object)) throw Error('Field results contain a different object or field.');
  if (assignments.some(r => id(value(r, 'AssigneeId')) !== id(value(u, 'Id')))) throw Error('Assignments belong to a different user.');
  const direct = new Set(assignments.filter(r => !present(value(r, 'PermissionSetGroupId'))).map(r => id(value(r, 'PermissionSetId'))));
  const matched = grants.filter(r => (present(value(r, 'Parent.ProfileId')) && id(value(r, 'Parent.ProfileId')) === id(value(u, 'ProfileId'))) || direct.has(id(value(r, 'ParentId'))));
  const readable = matched.filter(r => truth(value(r, 'PermissionsRead')));
  const editable = matched.filter(r => truth(value(r, 'PermissionsEdit')));
  const groups = new Set(assignments.map(r => value(r, 'PermissionSetGroupId')).filter(present)).size;
  const findings = [
    {label: 'Read grant', status: readable.length ? 'Evidence found' : 'Not established', text: readable.length ? `${readable.length} matching profile or directly assigned permission-set row(s) declare read access.` : 'No matching read grant was found in the supplied profile and direct-assignment rows. This does not prove that access is denied.'},
    {label: 'Edit grant', status: editable.length ? 'Evidence found' : 'Not established', text: editable.length ? `${editable.length} matching profile or directly assigned permission-set row(s) declare edit access.` : 'No matching edit grant was found in the supplied profile and direct-assignment rows. This does not prove that access is denied.'}
  ];
  const next = [
    'Confirm object-level Read and Edit permissions for this user.',
    'Check record access, sharing, page layout, Dynamic Forms visibility and field behaviour in the affected screen.',
    'Check assignment expiry, session activation requirements and licences. A permission row alone does not prove usable access.',
    'If no field row was returned, verify field existence and whether field-level security applies. Broader permissions such as View All Fields can affect access.',
    'Reproduce the issue as the affected user after any approved change.'
  ];
  if (groups) next.unshift(`Review ${groups} assigned permission-set group(s), their calculation status and muting. Group-derived access is not evaluated here.`);
  if (!truth(value(u, 'IsActive'))) next.unshift('The supplied user record is inactive. Resolve that before testing sign-in or access.');
  return {findings, next, matched: matched.map(r => ({name: String(value(r, 'Parent.Name')), source: present(value(r, 'Parent.ProfileId')) ? 'Profile' : 'Direct permission set', read: truth(value(r, 'PermissionsRead')), edit: truth(value(r, 'PermissionsEdit'))})), counts: {grants: grants.length, assignments: assignments.length, groups}, active: truth(value(u, 'IsActive'))};
}
export function report(input, result, sample = false) {
  return ['ProbeKit — a free OrgParity tool', sample ? 'SAMPLE WALKTHROUGH — fictional data' : 'Field-access investigation', `Created: ${new Date().toISOString()}`, `Field: ${input.object}.${input.field}`, `Username: ${input.username}`, '', 'Scope: supplied exports only; not a complete effective-access calculation. Exports are assumed to be complete and from the same org and time.', ...result.findings.flatMap(f => ['', `${f.label}: ${f.status}`, f.text]), '', 'Matching rows', ...result.matched.map(r => `${r.source}: ${r.name} | read=${r.read} | edit=${r.edit}`), '', 'Next checks', ...result.next.map((s, i) => `${i + 1}. ${s}`), '', 'https://probekit.orgparity.com/field-access.html'].join('\n');
}
export const sampleInput = {object:'Account', field:'Industry', username:'jane.doe@example.com'};
export const sampleData = {
  user: [{Id:'005000000000001', Username:'jane.doe@example.com', ProfileId:'00e000000000001', IsActive:true}],
  grants: [{Field:'Account.Industry', SobjectType:'Account', ParentId:'0PS000000000001', 'Parent.Name':'Account_Reader', 'Parent.ProfileId':null, PermissionsRead:true, PermissionsEdit:false}],
  assignments: [{AssigneeId:'005000000000001', PermissionSetId:'0PS000000000001', PermissionSetGroupId:null}]
};
