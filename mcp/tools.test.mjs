import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadProbes} from '../lib/engine.mjs';
import {sampleParameters,sampleRows} from '../web/investigation-samples.mjs';
import {searchInvestigations,describeInvestigation,buildPlan,analyseExports,compareExports} from './tools.mjs';
async function fixture(p,variant='A'){
 const parameters=sampleParameters(p),exports={};
 for(const d of p.steps){const s=(await buildPlan({id:p.id,parameters,exports})).steps.find(s=>s.name===d.name);if(s.state==='ready')exports[s.name]={query:s.query,text:JSON.stringify(sampleRows({...d,query:s.query},parameters,variant))};}
 return {parameters,exports};
}
for(const p of loadProbes(null).values())test(`${p.id}: MCP planning, analysis and comparison`,async()=>{
 const a=await fixture(p),b=await fixture(p,'B');const analysis=await analyseExports({id:p.id,...a});assert.ok(analysis.steps.every(s=>['complete','skipped'].includes(s.state)));assert.ok(analysis.findings.length);assert.match(analysis.report,/Investigation report/);assert.ok(analysis.steps.every(s=>!Object.hasOwn(s,'records')));
 const same=await compareExports({id:p.id,a,b:a});assert.ok(same.comparisons.every(c=>['same','unavailable'].includes(c.state)));const different=await compareExports({id:p.id,a,b});assert.ok(different.comparisons.every(c=>!Object.hasOwn(c,'onlyA')));
});
test('discovery is limited to shipped catalogue and rejects invalid filters',()=>{assert.equal(searchInvestigations({limit:61}).total,61);assert.equal(searchInvestigations({family:'flow'}).total,3);assert.ok(searchInvestigations({query:'permission'}).total);assert.throws(()=>describeInvestigation({id:'../private'}));assert.throws(()=>searchInvestigations({limit:1000}));});
test('untrusted exports cannot skip prerequisites, change queries or add steps',async()=>{
 const id='access.custom-permission',parameters={name:'Example'};const first=(await buildPlan({id,parameters})).steps[0];
 await assert.rejects(buildPlan({id,parameters:{...parameters,extra:'value'}}),/Unknown parameter/);
 await assert.rejects(buildPlan({id,parameters,exports:{holders:{query:'SELECT Id FROM User',text:'[]'}}}),/prerequisites/);
 await assert.rejects(buildPlan({id,parameters,exports:{perm:{query:first.query+' LIMIT 1',text:'[]'}}}),/differs/);
 await assert.rejects(buildPlan({id,parameters,exports:{other:{query:first.query,text:'[]'}}}),/Unknown export/);
 await assert.rejects(buildPlan({id,parameters,exports:{perm:{query:first.query,text:'{"done":false,"records":[]}'}}}),/all result pages/);
 await assert.rejects(buildPlan({id,parameters,exports:{perm:{query:first.query,text:'x'.repeat(2*1024*1024+1)}}}),/under 2 MB/);
});
test('comparison values are opt-in, bounded and preserve multiplicities',async()=>{
 const id='data.record',parameters={obj:'Account',id:'001000000000001',fields:'Id, Name'};const query=(await buildPlan({id,parameters})).steps[0].query;
 const a={parameters,exports:{record:{query,text:JSON.stringify(Array.from({length:25},(_,i)=>({Id:'001000000000001',Name:`Example ${i}`})))}}},b={parameters,exports:{record:{query,text:'[]'}}};
 const hidden=await compareExports({id,a,b});assert.equal(hidden.comparisons[0].onlyACount,25);assert.equal(hidden.comparisons[0].onlyA,undefined);
 const shown=await compareExports({id,a,b,includeValues:true});assert.equal(shown.comparisons[0].onlyA.length,20);assert.equal(shown.comparisons[0].truncated,true);
});
test('empty exports skip dependencies and source columns become fingerprints',async()=>{
 const p=loadProbes(null).get('meta.apex-class'),a=await fixture(p),b=await fixture(p,'B');const r=await compareExports({id:p.id,a,b,includeValues:true});assert.match(JSON.stringify(r),/sha256:/);assert.doesNotMatch(JSON.stringify(r),/Example content/);
 const id='access.custom-permission',parameters={name:'Example'},query=(await buildPlan({id,parameters})).steps[0].query;const result=await analyseExports({id,parameters,exports:{perm:{query,text:'[]'}}});assert.equal(result.steps[1].state,'skipped');assert.match(result.steps[0].warnings[0],/do not prove absence/);
});
