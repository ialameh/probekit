import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseResults,queries,analyse,report,sampleInput,sampleData} from './access-analysis.mjs';
const fixture=()=>structuredClone(sampleData);
test('query parameters cannot escape SOQL literals or identifiers',()=>{
 assert.throws(()=>queries({...sampleInput,object:"Account WHERE Name != ''"}));
 assert.throws(()=>queries({...sampleInput,username:"x' OR Name != 'x@y.com"}));
 assert.throws(()=>queries({...sampleInput,username:'x\\@example.com'}));
 assert.match(queries(sampleInput).grants,/Field = 'Account.Industry'/);
});
test('JSON REST, CLI, and flattened CSV exports give equivalent evidence',()=>{
 const nested={...sampleData.grants[0],Parent:{Name:'Account_Reader',ProfileId:null}};delete nested['Parent.Name'];delete nested['Parent.ProfileId'];
 const a=parseResults(JSON.stringify({done:true,totalSize:1,records:[nested]}),'grants');
 const b=parseResults(JSON.stringify({status:0,result:{records:sampleData.grants,totalSize:1}}),'grants');
 const csv='Field,SobjectType,ParentId,Parent.Name,Parent.ProfileId,PermissionsRead,PermissionsEdit\r\nAccount.Industry,Account,0PS000000000001,"Account_Reader",,true,false';
 const c=parseResults(csv,'grants');
 for(const grants of [a,b,c]) assert.equal(analyse(sampleInput,{...fixture(),grants}).findings[0].status,'Evidence found');
});
test('CSV supports escaped quotes, commas and line breaks without losing records',()=>{
 const csv='Field,SobjectType,ParentId,Parent.Name,Parent.ProfileId,PermissionsRead,PermissionsEdit\nAccount.Industry,Account,0PS000000000001,"Account, ""Reader""\nteam",,true,false';
 assert.equal(parseResults(csv,'grants')[0]['Parent.Name'],'Account, "Reader"\nteam');
 assert.throws(()=>parseResults(csv+'"','grants'));
});
test('incomplete, failed and incompatible exports are rejected',()=>{
 for(const x of [{done:false,records:[]},{nextRecordsUrl:'/next',records:[]},{totalSize:2,records:[]},{status:1,result:[]},{records:[{Id:'x'}]}])assert.throws(()=>parseResults(JSON.stringify(x),'user'));
 assert.throws(()=>parseResults('Id,Id\na,b','user'));
 assert.throws(()=>parseResults('Id,Username\na,b','user'));
 assert.throws(()=>parseResults('x'.repeat(2*1024*1024+1),'user'));
 const d=fixture();d.grants[0].PermissionsRead='yes';assert.throws(()=>parseResults(JSON.stringify(d.grants),'grants'));
});
test('profile grants match by ProfileId and direct assignments by PermissionSetId',()=>{
 const d=fixture();d.assignments=[];d.grants[0]['Parent.ProfileId']=d.user[0].ProfileId;
 const out=analyse(sampleInput,d);assert.equal(out.matched[0].source,'Profile');assert.equal(out.findings[0].status,'Evidence found');
 d.grants[0]['Parent.ProfileId']='00e000000000002';assert.equal(analyse(sampleInput,d).findings[0].status,'Not established');
});
test('group assignments are not treated as proven direct grants',()=>{
 const d=fixture();d.assignments[0].PermissionSetGroupId='0PG000000000001';
 const out=analyse(sampleInput,d);assert.equal(out.matched.length,0);assert.match(out.next[0],/muting/);
});
test('mismatched users, fields and assignments cannot be analysed together',()=>{
 const d=fixture();d.user[0].Username='someone@example.com';assert.throws(()=>analyse(sampleInput,d));
 const e=fixture();e.grants[0].Field='Account.Name';assert.throws(()=>analyse(sampleInput,e));
 const f=fixture();f.assignments[0].AssigneeId='005000000000002';assert.throws(()=>analyse(sampleInput,f));
});
test('empty grants do not claim denial or field absence; inactive users are flagged',()=>{
 const d=fixture();d.grants=[];d.user[0].IsActive=false;
 const out=analyse(sampleInput,d);assert.match(out.findings[0].text,/does not prove/);assert.match(out.next[0],/inactive/);
 assert.deepEqual(parseResults('[]','grants'),[]);
 assert.throws(()=>analyse(sampleInput,{...d,user:[]}));
});
test('sample report is labelled and includes limits and next checks',()=>{
 const text=report(sampleInput,analyse(sampleInput,fixture()),true);
 assert.match(text,/SAMPLE WALKTHROUGH/);assert.match(text,/not a complete effective-access/);assert.match(text,/Next checks/);
});
