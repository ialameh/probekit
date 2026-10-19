import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureCheck,combinedReport} from './investigation-packs.mjs';
const probe={id:'access.license-capacity',question:'Capacity?',steps:[{name:'licenses'}]};
const run={label:'Example',params:{},steps:[{name:'licenses',state:'complete',records:[{Name:'RAW_VALUE_NOT_FOR_REPORT'}],warnings:[],importedAt:'2026-01-01'}],findings:[]};
test('pack snapshots omit raw rows and retain explicit coverage and sample labels',()=>{
 const entry=captureCheck(probe,[run],{sample:true});const report=combinedReport('licence-review',[entry]);
 assert.equal(report.counts.reviewed,1);assert.equal(report.counts['not started'],3);assert.equal(report.sample,true);
 assert.ok(!JSON.stringify(report).includes('RAW_VALUE_NOT_FOR_REPORT'));assert.match(report.report,/not that the org passed/);
 assert.throws(()=>combinedReport('licence-review',[entry,entry]),/unique/);
 assert.equal(captureCheck(probe,[run,{...run,steps:[]}]).status,'partial');
 assert.throws(()=>captureCheck(probe,[]),/Build query/);
});
test('pack gaps and unavailable evidence never become reviewed',()=>{
 const entry=captureCheck(probe,[{...run,steps:[{name:'licenses',state:'unavailable',reason:'No access'}]}]);
 const report=combinedReport('licence-review',[entry,{id:'access.dormant-users',status:'skipped',reason:'Outside scope'}]);
 assert.equal(report.counts.reviewed,0);assert.equal(report.counts.partial,1);assert.equal(report.counts.skipped,1);assert.match(report.report,/Outside scope/);
 assert.throws(()=>combinedReport('licence-review',[entry,{...entry,id:'access.permission-license-capacity',sample:true}]),/separate packs/);
});
