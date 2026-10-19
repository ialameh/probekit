import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadProbes} from '../lib/engine.mjs';
import {parameters,plan,columns,renderQuery,importResult,compareResults,reportText} from './investigation-engine.mjs';
import {sampleRun,sampleParameters} from './investigation-samples.mjs';
import {guidance,findings} from './investigation-guidance.mjs';
const probes=[...loadProbes(null).values()];
for(const p of probes)test(`${p.id}: full sample, dependent steps, guidance, comparison and report`,async()=>{
 const a=await sampleRun(p),b=await sampleRun(p,'B');
 const steps=plan(p,a.params,a.imported),stepsB=plan(p,b.params,b.imported);
 assert.equal(steps.length,p.steps.length);assert.ok(steps.every(s=>['complete','skipped'].includes(s.state)),JSON.stringify(steps));
 assert.ok(guidance(p).next);assert.ok(findings(p,steps).length);
 for(const s of steps){if(s.state!=='complete')continue;assert.equal(s.records.length,1);assert.ok(columns(s.query).length);assert.equal(compareResults(s,s,s).state,'same');assert.ok(['same','different'].includes(compareResults(s,stepsB.find(x=>x.name===s.name),s).state));}
 assert.match(reportText(p,[{label:'Example',params:a.params,steps,findings:findings(p,steps)}],{sample:true}),/FICTIONAL SAMPLE/);
});
test('empty exports satisfy zero-row conditions without turning blocked inputs into absence',async()=>{
 for(const p of probes){const params=parameters(p,sampleParameters(p)),imports={};for(const s of p.steps){const step=plan(p,params,imports).find(x=>x.name===s.name);if(step.state==='ready')imports[s.name]=await importResult('[]',step,step.query);}assert.ok(plan(p,params,imports).every(s=>['complete','skipped','blocked'].includes(s.state)));}
 const p=probes.find(p=>p.id==='access.custom-permission'),params=parameters(p,{name:'Example'}),first=plan(p,params,{})[0];
 const next=plan(p,params,{perm:{state:'unavailable',query:first.query,reason:'Unavailable'}});assert.equal(next[1].state,'blocked');assert.equal(next[2].state,'blocked');
});
test('dependent values are escaped and stale imports are not reused',()=>{
 const result={state:'complete',records:[{Id:"x\\' OR Name != 'a"}]};
 assert.equal(renderQuery('SELECT Id FROM User WHERE Id IN ({@u.Id})',{}, {u:result}),"SELECT Id FROM User WHERE Id IN ('x\\\\\\' OR Name != \\'a')");
 const p=probes.find(p=>p.id==='access.logins'),params=parameters(p,{user:'jane@example.com'});
 assert.equal(plan(p,params,{u:{state:'complete',query:'different',records:[]}})[0].state,'ready');
 assert.throws(()=>renderQuery('SELECT Id FROM User WHERE Id IN ({@u.Id})',{}, {u:{state:'complete',records:[{Id:{bad:true}}]}}));
});
test('unsafe and invalid parameter values are rejected',()=>{
 const p=probes.find(p=>p.id==='data.find');
 assert.throws(()=>parameters(p,{obj:'Account',field:'Name',value:"x' OR Id != null"}));
 assert.throws(()=>parameters(p,{obj:'Account',field:'Name',limit:'0'}));
 assert.throws(()=>parameters(probes.find(p=>p.id==='flow.on-object'),{label:'Account',active:'true OR Id != null'}));
});
test('JSON and CSV normalise known types and nested null relationships',async()=>{
 const step={name:'x'},q='SELECT Id, IsActive, Profile.Name, NumLinesCovered FROM User';
 const a=await importResult('{"records":[{"Id":"one","IsActive":false,"Profile":null,"NumLinesCovered":2}],"done":true,"totalSize":1}',step,q);
 const b=await importResult('Id,IsActive,Profile.Name,NumLinesCovered\none,false,,2',step,q);
 assert.equal(compareResults(a,b,step).state,'same');assert.equal(a.records[0]['Profile.Name'],null);
});
test('incomplete results, wrong objects, missing columns and malformed types are rejected',async()=>{
 const s={name:'x'},q='SELECT Id, IsActive FROM User';
 for(const text of ['{"records":[],"done":false}','{"records":[],"totalSize":2}','{"status":1,"result":[]}','[{"Id":"x"}]','Id,Id\na,b','[{"Id":"x","IsActive":"yes"}]','[{"Id":"x","IsActive":true,"attributes":{"type":"Account"}}]'])await assert.rejects(importResult(text,s,q));
 await assert.rejects(importResult('x'.repeat(2*1024*1024+1),s,q));
});
test('source fingerprints compare exact values without retaining source in records',async()=>{
 const s={name:'x',hash:['Body'],compare:['Name','Body']},q='SELECT Name, Body FROM ApexClass';
 const a=await importResult('[{"Name":"Example","Body":"public class Example {}"}]',s,q),b=await importResult('[{"Name":"Example","Body":"public class Example { }"}]',s,q);
 assert.match(a.records[0].Body,/^sha256:[a-f0-9]{64}$/);assert.equal(compareResults(a,b,s).state,'different');
});
test('comparison preserves duplicate counts and respects declared columns',async()=>{
 const q='SELECT Id, Name FROM Account',s={name:'x',compare:['Name']};
 const a=await importResult('[{"Id":"1","Name":"A"},{"Id":"2","Name":"A"}]',s,q),b=await importResult('[{"Id":"3","Name":"A"}]',s,q);
 const c=compareResults(a,b,s);assert.equal(c.onlyA[0].count,1);assert.equal(c.onlyB.length,0);
 const other=await importResult('[{"Name":"A"}]',s,'SELECT Name FROM Account');assert.equal(compareResults(b,other,{}).state,'unavailable');
});
test('query limits and mismatched parameter contexts remain visible in reports',async()=>{
 const s={name:'records'},q='SELECT Name FROM Account LIMIT 1',r=await importResult('[{"Name":"Example"}]',s,q);assert.match(r.warnings[0],/limit was reached/);
 const p=probes.find(p=>p.id==='data.find');const report=reportText(p,[{label:'A',params:{obj:'Account'},steps:[{...s,...r}]}]);assert.match(report,/LIMIT:/);assert.match(report,/Account/);assert.doesNotMatch(report,/"Name":"Example"/);
});
test('findings do not call a non-sandbox org production or an empty result missing',()=>{
 const p=probes.find(p=>p.id==='meta.org');const f=findings(p,[{name:'org',state:'complete',records:[],columns:[],warnings:[]}]);assert.match(f[0].text,/No presence or access conclusion/);assert.doesNotMatch(JSON.stringify(f),/This is PRODUCTION/);
});
test('query rendering preserves significant spaces inside supplied values',()=>{
 assert.equal(renderQuery("SELECT Id FROM Account WHERE Name = '{name}'",{name:'Example  Company'}),"SELECT Id FROM Account WHERE Name = 'Example  Company'");
});
test('mixed export formats are disclosed without masking differing values',async()=>{
 const s={name:'x'},q='SELECT Name FROM Account';const a=await importResult('[{"Name":"1"}]',s,q),b=await importResult('Name\n1',s,q);
 const c=compareResults(a,b,s);assert.equal(c.state,'same');assert.match(c.warnings[0],/Export formats differ/);
});

test('approval, licence and schedule numbers normalise across JSON and CSV',async()=>{
 const q='SELECT ElapsedTimeInDays, TotalLicenses, UsedLicenses, TimesTriggered FROM Example';
 const a=await importResult('[{"ElapsedTimeInDays":1.25,"TotalLicenses":100,"UsedLicenses":90,"TimesTriggered":2}]',{},q),b=await importResult('ElapsedTimeInDays,TotalLicenses,UsedLicenses,TimesTriggered\n1.25,100,90,2',{},q);
 assert.equal(compareResults(a,b,{}).state,'same');
});
test('licence findings avoid division by zero and flag only known positive totals',()=>{
 const p=probes.find(p=>p.id==='access.license-capacity');const rows=[{TotalLicenses:0,UsedLicenses:0},{TotalLicenses:-1,UsedLicenses:9},{TotalLicenses:null,UsedLicenses:1},{TotalLicenses:100,UsedLicenses:95}];
 const f=findings(p,[{name:'licenses',state:'complete',columns:[],records:rows,warnings:[]}]);
 assert.match(f.find(x=>x.title==='Allocation review').text,/1 supplied allocation/);assert.match(f.find(x=>x.title==='Special totals').text,/3 supplied row/);assert.doesNotMatch(JSON.stringify(f),/NaN|Infinity/);
});
test('pending age and review counts remain evidence-scoped',()=>{
 const p=probes.find(p=>p.id==='ops.pending-approvals');const f=findings(p,[{name:'requests',state:'complete',columns:[],records:[{CreatedDate:'2026-01-01T00:00:00.000Z'}],warnings:[]}],new Date('2026-01-11T00:00:00.000Z'));
 assert.match(f.find(x=>x.title==='Oldest supplied request').text,/10 day/);assert.match(f.find(x=>x.title==='Oldest supplied request').text,/not proof/);
});
