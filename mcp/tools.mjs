import {bundles,searchCatalogue} from '../web/investigation-discovery.mjs';
import {sampleParameters,sampleRows} from '../web/investigation-samples.mjs';
import {version} from '../lib/release.mjs';
import {loadProbes} from '../lib/engine.mjs';
import {parameters,plan,importResult,compareResults,reportText,LIMITS} from '../web/investigation-engine.mjs';
import {guidance,findings} from '../web/investigation-guidance.mjs';

const catalogue=loadProbes(null);
export const catalogueCount=catalogue.size;
export const MAX_RUN_BYTES=8*1024*1024;
const scope='Supplied exports only. Query execution, org identity, freshness and completeness must be checked by the user. Empty results do not prove absence. Equal selected values do not establish whole-org parity.';
function probe(id){const p=catalogue.get(id);if(!p)throw Error('Unknown investigation. Use search_investigations to find a catalogue ID.');return p;}
function object(value,label){if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${label} must be an object.`);}
function checkedParams(p,given){object(given,'parameters');for(const k of Object.keys(given)){if(!Object.hasOwn(p.params,k))throw Error('Unknown parameter for this investigation.');if(!['string','number','boolean'].includes(typeof given[k]))throw Error('Parameter values must be strings, numbers or booleans.');}return parameters(p,given);}
function summary(s){return {name:s.name,state:s.state,api:s.tooling?'tooling':'standard',query:s.query,reason:s.reason,rows:s.records?.length,columns:s.columns,warnings:s.warnings??[]};}
async function prepare(p,run={}){
 object(run,'run');const params=checkedParams(p,run.parameters??{}),exports=run.exports??{};object(exports,'exports');
 let bytes=0;
 for(const[name,e]of Object.entries(exports)){
  if(!p.steps.some(s=>s.name===name))throw Error('Unknown export step.');object(e,'export');
  if(typeof e.text!=='string'||typeof e.query!=='string')throw Error('Each export needs its query and JSON/CSV text.');
  bytes+=Buffer.byteLength(e.text)+Buffer.byteLength(e.query);if(bytes>MAX_RUN_BYTES)throw Error('Keep each run under 8 MB.');
  if(e.query.length>LIMITS.query)throw Error('Query exceeds the supported length.');
 }
 const imported=Object.create(null);
 for(const d of p.steps){const e=exports[d.name];if(!e)continue;const step=plan(p,params,imported).find(s=>s.name===d.name);
  if(step.state!=='ready')throw Error(`Cannot import ${d.name}: ${step.state}. Supply its prerequisites first and check the parameters.`);
  if(e.query!==step.query)throw Error(`The export query for ${d.name} differs from the generated query. Build the plan again and use fresh matching exports.`);
  imported[d.name]=await importResult(e.text,step,step.query);
 }
 const steps=plan(p,params,imported);return {label:run.sample?'Fictional sample':'Supplied export',sample:run.sample===true,params,steps,findings:findings(p,steps)};
}
export function searchInvestigations({query='',family,limit=20}={}){
 if(typeof query!=='string'||query.length>200)throw Error('Search text must be at most 200 characters.');
 if(!Number.isInteger(limit)||limit<1||limit>catalogueCount)throw Error(`Limit must be between 1 and ${catalogueCount}.`);
 if(family&&!['access','meta','flow','omni','ops','data'].includes(family))throw Error('Unknown investigation family.');
 const matches=searchCatalogue([...catalogue.values()],query,family);
 return {version,total:matches.length,investigations:matches.slice(0,limit).map(({probe:p,matched})=>({id:p.id,title:guidance(p).title,question:p.question,family:p.family,steps:p.steps.length,matchedTerms:matched})),scope:'Ranked keyword and synonym matches, not a diagnosis.'};
}
export function investigationBundles({id}={}){
 const selected=id?bundles.filter(b=>b.id===id):bundles;if(!selected.length)throw Error('Unknown workflow bundle. Omit id to list available bundles.');
 return {version,bundles:selected.map(b=>({...b,probes:b.probes.map(id=>({id,title:guidance(probe(id)).title,question:probe(id).question}))})),scope:'Suggested investigation order. Each probe needs its own parameters and exports; no automatic query execution or data transfer between probes.'};
}
export async function investigationExample({id,variant='A'}){
 if(!['A','B'].includes(variant))throw Error('Variant must be A or B.');
 const p=probe(id),given=sampleParameters(p),params=parameters(p,given),imported={},exports={};
 for(const d of p.steps){const s=plan(p,params,imported).find(s=>s.name===d.name);if(s.state!=='ready')continue;const text=JSON.stringify(sampleRows(s,params,variant));exports[s.name]={query:s.query,text};imported[s.name]=await importResult(text,s,s.query);}
 return {sample:true,label:'FICTIONAL SAMPLE — not an org assessment',id,variant,analysisInput:{id,parameters:params,exports,sample:true},scope:'For learning only. The returned analysisInput can be passed to analyse_exports. Two variants can be used as comparison runs. Do not mix sample exports with real evidence.'};
}

export function describeInvestigation({id}){const p=probe(id);return {id:p.id,question:p.question,family:p.family,parameters:p.params,guidance:guidance(p),steps:p.steps.map(s=>({name:s.name,api:s.tooling?'tooling':'standard',condition:s.when,template:s.soql,comparison:s.compare,fingerprintColumns:s.hash??[]})),limitations:p.traps??[],scope};}
export async function buildPlan({id,...run}){const p=probe(id),r=await prepare(p,run);return {id,sample:r.sample,parameters:r.params,steps:r.steps.map(summary),scope};}
export async function analyseExports({id,...run}){const p=probe(id),r=await prepare(p,run);return {id,sample:r.sample,steps:r.steps.map(summary),findings:r.findings,report:reportText(p,[r],{sample:r.sample}),scope};}
export async function compareExports({id,a,b,includeValues=false}){
 if(typeof includeValues!=='boolean')throw Error('includeValues must be a boolean.');
 const p=probe(id),left=await prepare(p,a),right=await prepare(p,b);
 const comparisons=p.steps.map(s=>{
  const c=compareResults(left.steps.find(x=>x.name===s.name),right.steps.find(x=>x.name===s.name),s);
  if(c.state==='unavailable')return {name:s.name,...c};
  return {name:s.name,state:c.state,columns:c.columns,scope:c.scope,warnings:c.warnings,onlyACount:c.onlyA.reduce((n,r)=>n+r.count,0),onlyBCount:c.onlyB.reduce((n,r)=>n+r.count,0),...(includeValues?{onlyA:c.onlyA.slice(0,20),onlyB:c.onlyB.slice(0,20),truncated:c.onlyA.length>20||c.onlyB.length>20}:{})};
 });
 return {id,sample:left.sample||right.sample,mixedSampleContext:left.sample!==right.sample,parametersMatch:JSON.stringify(left.params)===JSON.stringify(right.params),comparisons,scope,context:'Parameter differences can explain differences between results. Review both query contexts.'};
}
