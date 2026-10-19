import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadProbes} from '../lib/engine.mjs';
import {sampleParameters,sampleRows} from '../web/investigation-samples.mjs';
import {searchInvestigations,describeInvestigation,buildPlan,analyseExports,compareExports,investigationBundles,investigationExample,catalogueCount,analysePack} from './tools.mjs';
async function fixture(p,variant='A'){
 const parameters=sampleParameters(p),exports={};
 for(const d of p.steps){const s=(await buildPlan({id:p.id,parameters,exports})).steps.find(s=>s.name===d.name);if(s.state==='ready')exports[s.name]={query:s.query,text:JSON.stringify(sampleRows({...d,query:s.query},parameters,variant))};}
 return {parameters,exports};
}
for(const p of loadProbes(null).values())test(`${p.id}: MCP planning, analysis and comparison`,async()=>{
 const a=await fixture(p),b=await fixture(p,'B');const analysis=await analyseExports({id:p.id,...a});assert.ok(analysis.steps.every(s=>['complete','skipped'].includes(s.state)));assert.ok(analysis.findings.length);assert.match(analysis.report,/Investigation report/);assert.ok(analysis.steps.every(s=>!Object.hasOwn(s,'records')));
 const same=await compareExports({id:p.id,a,b:a});assert.ok(same.comparisons.every(c=>['same','unavailable'].includes(c.state)));const different=await compareExports({id:p.id,a,b});assert.ok(different.comparisons.every(c=>!Object.hasOwn(c,'onlyA')));
});
test('discovery is limited to shipped catalogue and rejects invalid filters',()=>{assert.equal(searchInvestigations({limit:catalogueCount}).total,catalogueCount);assert.equal(searchInvestigations({family:'flow'}).total,3);assert.ok(searchInvestigations({query:'permission'}).total);assert.throws(()=>describeInvestigation({id:'../private'}));assert.throws(()=>searchInvestigations({limit:1000}));});
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

test('workflow bundles reference only valid probes and describe their scope',()=>{
 const groups=investigationBundles().bundles;assert.equal(groups.length,6);
 for(const group of groups){assert.ok(group.probes.length>=3);for(const p of group.probes)assert.equal(describeInvestigation({id:p.id}).id,p.id);assert.equal(investigationBundles({id:group.id}).bundles.length,1);}
 assert.throws(()=>investigationBundles({id:'unknown'}));
});
test('plain-language search ranks meaningful matches and accepts exact IDs',()=>{
 assert.equal(searchInvestigations({query:'seats'}).investigations[0].family,'access');
 assert.equal(searchInvestigations({query:'ops.pending-approvals'}).investigations[0].id,'ops.pending-approvals');
 assert.ok(searchInvestigations({query:"user can't see a field",limit:5}).investigations.some(p=>p.id==='access.field-grants'));
 assert.equal(searchInvestigations({query:'zzzznomatch'}).total,0);
});
test('every example replays with fictional labelling through analysis and comparison',async()=>{
 for(const p of loadProbes(null).values()){
  const a=await investigationExample({id:p.id}),b=await investigationExample({id:p.id,variant:'B'});
  assert.equal(a.sample,true);const analysed=await analyseExports(a.analysisInput);assert.equal(analysed.sample,true);assert.match(analysed.report,/FICTIONAL SAMPLE/);
  const {id:_,...runA}=a.analysisInput,{id:__,...runB}=b.analysisInput;
  assert.equal((await compareExports({id:p.id,a:runA,b:runB})).sample,true);
 }
});

test('pack analysis validates evidence, gaps, membership and sample separation',async()=>{
 const a=(await investigationExample({id:'access.license-capacity'})).analysisInput;
 const b=(await investigationExample({id:'access.permission-license-capacity'})).analysisInput;
 const result=await analysePack({id:'licence-review',checks:[a],skipped:[{id:'access.dormant-users',reason:'Not in scope'}]});
 assert.equal(result.counts.reviewed,1);assert.equal(result.counts.skipped,1);assert.equal(result.counts['not started'],2);assert.equal(result.sample,true);
 assert.ok(!JSON.stringify(result).includes('"records":'));assert.match(result.report,/FICTIONAL SAMPLE PACK/);
 await assert.rejects(analysePack({id:'licence-review',checks:[a,{...b,sample:false}]}),/separate packs/);
 await assert.rejects(analysePack({id:'licence-review',checks:[a,a]}),/unique members/);
 await assert.rejects(analysePack({id:'data-quality',checks:[a]}),/unique members/);
 const bad=structuredClone(a);Object.values(bad.exports)[0].query+=' LIMIT 1';
 await assert.rejects(analysePack({id:'licence-review',checks:[bad]}),/differs/);
 const partial=await analysePack({id:'licence-review',checks:[{id:a.id,parameters:a.parameters}]});assert.equal(partial.counts.partial,1);
});
