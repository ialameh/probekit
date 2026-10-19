import {parseCSV, MAX_BYTES} from './access-analysis.mjs';

export const LIMITS = {bytes: MAX_BYTES, rows: 10000, query: 100000};
const TYPES = {
  sobject: /^[A-Za-z][A-Za-z0-9_]*$/, field: /^[A-Za-z][A-Za-z0-9_]*$/,
  name: /^[A-Za-z0-9_ .\-]+$/, username: /^[^\s'"\\]+@[^\s'"\\]+$/,
  id: /^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/, text: /^[^'\\\x00-\x1f]*$/,
  int: /^\d{1,6}$/, fields: /^[A-Za-z][\w.]*(\s*,\s*[A-Za-z][\w.]*)*$/
};
export function parameters(probe, given) {
  const out = Object.create(null);
  for (const [key, spec] of Object.entries(probe.params)) {
    const v = String(given[key] ?? spec.default ?? '').trim();
    if (!v) { if (!spec.optional) throw Error(`${key} is required.`); continue; }
    if (v.length > 2000 || !TYPES[spec.type]?.test(v)) throw Error(`${key}: enter a valid ${spec.type}.`);
    if (spec.type === 'int' && Number(v) < 1) throw Error(`${key} must be at least 1.`);
    if (key === 'active' && !['true', 'false'].includes(v)) throw Error('active must be true or false.');
    out[key] = v;
  }
  return out;
}
export function condition(expression, params, results) {
  if (!expression) return {state:'ready'};
  let m = expression.match(/^(\w+) !== undefined$/);
  if (m) return {state:params[m[1]] === undefined ? 'skipped' : 'ready', reason:`Optional parameter ${m[1]} was not supplied.`};
  m = expression.match(/^(\w+)\.rows (===|>) (\d+)$/);
  if (!m) throw Error('Unsupported step condition.');
  const result = results[m[1]];
  if (!result) return {state:'waiting', reason:`Import ${m[1]} first.`};
  if (result.state !== 'complete') return {state:'blocked', reason:`${m[1]} has no completed result.`};
  const count = result.records.length;
  const passes = m[2] === '===' ? count === Number(m[3]) : count > Number(m[3]);
  return {state: passes ? 'ready' : 'skipped', reason:`Condition ${expression} was not met (${count} row(s)).${m[3] === '1' && count > 1 ? ' Multiple matches require investigation.' : ''}`};
}
export function renderQuery(template, params, results = {}) {
  let out = template.replace(/\[\[(.*?)\]\]/gs, (_, fragment) => [...fragment.matchAll(/\{(\w+)\}/g)].every(m => params[m[1]] !== undefined) ? fragment : '').replace(/\s+/g,' ').trim();
  out = out.replace(/\{@(\w+)\.([\w.]+)\}/g, (_, name, col) => {
    const result = results[name];
    if (!result || result.state !== 'complete') throw Error(`Import ${name} before building this query.`);
    const vals = [...new Set(result.records.map(r => r[col]).filter(v => v !== null && v !== undefined))];
    if (vals.some(v => !['string','number','boolean'].includes(typeof v))) throw Error(`Dependent column ${col} must contain scalar values.`);
    return vals.length ? vals.map(v => "'" + String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/[\r\n]/g,' ') + "'").join(',') : "''";
  });
  out = out.replace(/\{(\w+)\}/g, (m,k) => params[k] ?? m).trim();
  if (/\{[@\w]/.test(out)) throw Error('A query parameter is missing.');
  if (out.length > LIMITS.query) throw Error('This dependent query is too long. Narrow the investigation in Salesforce before continuing.');
  return out;
}
export function columns(query) {
  const m = query.match(/^SELECT\s+(.+?)\s+FROM\s+([\w.]+)/i);
  if (!m) throw Error('Expected a read-only SELECT query.');
  const list = []; let start = 0, depth = 0;
  for(let i = 0; i <= m[1].length; i++) {
    const c = m[1][i]; if(c === '(') depth++; if(c === ')') depth--;
    if ((c === ',' && depth === 0) || i === m[1].length) {list.push(m[1].slice(start,i).trim());start=i+1;}
  }
  return list.map(s => {
    if (/^[\w.]+$/.test(s)) return {key:s, kind:'field'};
    const a = s.match(/^COUNT\([\w.]+\)\s+(\w+)$/i);
    if(a) return {key:a[1],kind:'number'};
    throw Error(`Unsupported selected column: ${s}`);
  });
}
function read(row, key) {
  if(Object.hasOwn(row,key)) return {exists:true,value:row[key]};
  let obj=row;
  for(const part of key.split('.')) {
    if(obj === null) return {exists:true,value:null};
    if(!obj || typeof obj !== 'object' || !Object.hasOwn(obj,part)) return {exists:false};
    obj=obj[part];
  }
  return {exists:true,value:obj};
}
const BOOL = /^(Is[A-Z]|Has[A-Z]|Permissions[A-Z]|Usage[A-Z])|^(Active|Incoming|CheckOnly)$/;
const NUM = /^(ElapsedTimeInDays|ElapsedTimeInHours|ElapsedTimeInMinutes|TotalLicenses|UsedLicenses|TimesTriggered|NumLinesCovered|NumLinesUncovered|NumberOfErrors|JobItemsProcessed|TotalJobItems|NumberComponentsDeployed|NumberComponentErrors|NumberTestsCompleted|NumberTestErrors|Retries|Position|Tip|Rank|Level|SequenceNumber|VersionNumber|MajorVersion|MinorVersion|PatchVersion|Length|BodyLength|LengthWithoutComments|ContentSize|LogLength|DurationMilliseconds|RunTime|BatchSize|ApiVersion)$/;
function normalise(v, column) {
  if(v === null) return null;
  const name=column.key.split('.').at(-1);
  if(BOOL.test(name)) {
    if(v === true || v === false) return v;
    if(typeof v === 'string' && /^(true|false)$/i.test(v)) return v.toLowerCase()==='true';
    throw Error(`${column.key} must be true, false, or null.`);
  }
  if(column.kind === 'number' || NUM.test(name)) {
    if((typeof v !== 'number' && typeof v !== 'string') || String(v).trim()==='' || !Number.isFinite(Number(v))) throw Error(`${column.key} must be a finite number or null.`);
    return Number(v);
  }
  if(typeof v === 'object') return JSON.stringify(v);
  return v;
}
export async function importResult(text, step, query) {
  if(new TextEncoder().encode(text).length > LIMITS.bytes) throw Error('Each result must be under 2 MB.');
  text=text.trim().replace(/^\uFEFF/,'');
  if(!text) throw Error('Paste JSON/CSV or choose an export file. Use [] for a successful query returning zero rows.');
  let records,headers; const format=/^[\[{]/.test(text)?'json':'csv';
  if(/^[\[{]/.test(text)) {
    let data;try{data=JSON.parse(text);}catch{throw Error('Invalid JSON. Export the complete query result.');}
    if(!data || typeof data!=='object') throw Error('Expected query records.');
    if(data.status!==undefined && data.status!==0) throw Error('This is a failed query response.');
    data=data.result??data;
    if(data.done===false || data.nextRecordsUrl) throw Error('Export all result pages before continuing.');
    records=Array.isArray(data)?data:data.records;
    if(!Array.isArray(records)) throw Error('Expected a records array, REST response, or CLI JSON result.');
    if(data.totalSize!==undefined && Number(data.totalSize)!==records.length) throw Error('The reported row total differs from this export. Export all result pages.');
  } else ({records,headers}=parseCSV(text));
  if(records.length>LIMITS.rows) throw Error('Each export is limited to 10,000 rows.');
  const selected=columns(query);
  if(headers && selected.some(c=>!headers.includes(c.key))) throw Error('CSV headers must include every selected column: '+selected.map(c=>c.key).join(', '));
  const table=records.map(row=>{
    if(!row || typeof row!=='object' || Array.isArray(row)) throw Error('Every result row must be an object.');
    const out=Object.create(null);
    for(const col of selected) {const v=read(row,col.key);if(!v.exists)throw Error(`Missing column ${col.key}. Keep every selected column in the export.`);out[col.key]=normalise(v.value,col);}
    return out;
  });
  const object=query.match(/\bFROM\s+(\w+)/i)[1];
  for(const row of records) if(row.attributes?.type && !['AggregateResult',object].includes(row.attributes.type)) throw Error(`These rows are for ${row.attributes.type}, but the query is for ${object}.`);
  for(const key of step.hash??[]) {
    if(!selected.some(c=>c.key===key)) throw Error(`Hash column ${key} is missing from the query.`);
    const cache=new Map();
    for(const row of table) if(row[key]!==null) {
      const source=String(row[key]);
      if(!cache.has(source)) {const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));cache.set(source,'sha256:'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join(''));}
      row[key]=cache.get(source);
    }
  }
  const warnings=[];const limit=query.match(/\bLIMIT\s+(\d+)\s*$/i);
  if(limit && table.length>=Number(limit[1])) warnings.push(`The ${limit[1]}-row query limit was reached. These results may omit other matching records.`);
  if(!table.length) warnings.push('Zero returned rows do not prove absence. Check the query, permissions, API, filters and export completeness.');
  return {state:'complete',records:table,columns:selected.map(c=>c.key),query,warnings,format,importedAt:new Date().toISOString()};
}
export function plan(probe, params, imported) {
  const results=Object.create(null),steps=[];
  for(const step of probe.steps) {
    let state=condition(step.when,params,results), query='';
    if(state.state==='ready') {
      const deps=[...step.soql.matchAll(/\{@(\w+)\./g)].map(m=>m[1]);
      const missing=deps.find(n=>results[n]?.state!=='complete');
      if(missing) state={state:results[missing]?'blocked':'waiting',reason:`Import ${missing} before using its values.`};
      else try{query=renderQuery(step.soql,params,results);}catch(e){state={state:'blocked',reason:e.message};}
    }
    if(state.state==='ready' && imported[step.name]) {
      const previous=imported[step.name];
      if(previous.query!==query) state={state:'ready',reason:'The query changed. Import a fresh result.'};
      else state=previous;
    }
    const item={...step,...state,query:query||state.query||''};
    if(!['ready','waiting'].includes(item.state)) results[step.name]=item;
    steps.push(item);
  }
  return steps;
}
const stable=v=>JSON.stringify(v);
export function compareResults(a,b,step) {
  if(a?.state!=='complete' || b?.state!=='complete') return {state:'unavailable',reason:'Both sides need a completed export for this step.'};
  let selected;
  if(Array.isArray(step.compare)) selected=step.compare;
  else {
    if(stable([...a.columns].sort())!==stable([...b.columns].sort())) return {state:'unavailable',reason:'Selected columns differ. Use matching columns on both sides.'};
    selected=a.columns.filter(k=>step.compare!=='*'||k!=='Id');
  }
  if(selected.some(k=>!a.columns.includes(k)||!b.columns.includes(k))) return {state:'unavailable',reason:'A comparison column is missing.'};
  const count=rows=>{const map=new Map();for(const r of rows){const values=selected.map(k=>r[k]);const key=stable(values);const existing=map.get(key);map.set(key,{values,count:(existing?.count??0)+1});}return map;};
  const left=count(a.records),right=count(b.records),onlyA=[],onlyB=[];
  for(const [key,row] of left){const n=row.count-(right.get(key)?.count??0);if(n>0)onlyA.push({values:row.values,count:n});}
  for(const [key,row] of right){const n=row.count-(left.get(key)?.count??0);if(n>0)onlyB.push({values:row.values,count:n});}
  return {state:onlyA.length||onlyB.length?'different':'same',columns:selected,onlyA,onlyB,scope:step.compare?'Declared comparison columns only; excluded columns were not compared.':'Exact exported columns, including IDs and dates. Differences may be expected between orgs.',warnings:[...a.warnings,...b.warnings,...(a.format!==b.format?['Export formats differ. Unknown CSV fields remain text and may compare differently from typed JSON values.']:[])]};
}
export function reportText(probe,runs,{sample=false,notes='',comparisons=[]}={}) {
  const lines=['ProbeKit · Free tools by OrgParity',sample?'FICTIONAL SAMPLE — not an org assessment':'Investigation report',probe.id,probe.question,`Created: ${new Date().toISOString()}`,'','Scope: supplied exports only. Org identity, freshness, query execution and completeness are attested by the user, not independently verified. Empty results are not proof of absence.'];
  for(const run of runs) {
    lines.push('',`== ${run.label} ==`,`Parameters: ${JSON.stringify(run.params)}`);
    for(const step of run.steps){lines.push('',`${step.name}: ${step.state}`,step.query||step.reason||'');if(step.state==='complete')lines.push(`${step.records.length} row(s); imported ${step.importedAt}`,...step.warnings.map(w=>'LIMIT: '+w));else if(step.reason)lines.push(step.reason);}
    for(const f of run.findings??[])lines.push('',`${f.title} [${f.kind}]`,f.text);
  }
  for(const c of comparisons) {
    lines.push('',`Comparison ${c.name}: ${c.state}`,c.reason??c.scope??'');
    if(c.columns)lines.push('Columns: '+c.columns.join(', '),`Only A: ${c.onlyA.reduce((n,r)=>n+r.count,0)} row(s); only B: ${c.onlyB.reduce((n,r)=>n+r.count,0)} row(s).`,...c.warnings);
  }
  lines.push('','Checks and limitations',...(probe.traps??[]).map(t=>'- '+t));
  if(notes.trim())lines.push('','User notes',notes.trim());
  lines.push('','Raw exported rows are not included in this report.','https://probekit.orgparity.com');
  return lines.join('\n');
}
