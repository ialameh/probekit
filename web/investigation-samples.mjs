import {parameters,plan,columns,importResult} from './investigation-engine.mjs';
export function sampleParameters(probe) {
 return Object.fromEntries(Object.entries(probe.params).map(([k,s])=>[k,s.default??s.example??'']));
}
export function sampleRows(step,params,variant='A') {
 const col=columns(step.query);
 const object=step.query.match(/\bFROM\s+(\w+)/i)[1];
 const row=Object.fromEntries(col.map(({key,kind})=>{
  const name=key.split('.').at(-1);let val='Example';
  if(kind==='number')val=3;
  else if(/^(Is[A-Z]|Has[A-Z]|Permissions[A-Z]|Usage[A-Z])/.test(name)||['Active','Incoming','CheckOnly'].includes(name))val=!['IsFrozen','IsCustomSetting','CheckOnly','PermissionsModifyAllData','PermissionsViewAllData'].includes(name);
  else if(/^(Id|.*Id)$/.test(name))val='001000000000001';
  else if(name==='DurableId')val=params.obj??'Account';
  else if(/Date|Timestamp|Time$/.test(name)&&name!=='RunTime')val=name==='ExpirationDate'?'2030-01-01T00:00:00.000Z':'2026-01-01T12:00:00.000Z';
  else if(/VersionNumber$/.test(name))val=variant==='B'?3:2;
  else if(name==='Status')val=({PermissionSetGroup:'Updated',EventBusSubscriber:'Running',Flow:variant==='B'?'Draft':'Active',ApexClass:'Active',ApexTrigger:'Active',LoginHistory:'Success',ApexLog:'Success',DeployRequest:variant==='B'?'Failed':'Succeeded'})[object]??(variant==='B'?'Failed':'Completed');
  else if(name==='State')val='WAITING';
  else if(name==='Outcome')val=variant==='B'?'Fail':'Pass';
  else if(name==='InterviewStatus')val='Paused';
  else if(name==='MaxAccessLevel')val='Read';
  else if(name==='Username')val=params.user??'jane.doe@example.com';
  else if(['Body','HtmlValue','Source','PropertySetConfig'].includes(name))val=variant==='B'?'Example content B':'Example content A';
  else if(name==='Name'||name==='DeveloperName'||name==='ApiName')val=params.name??params.permset??params.group??params.apexclass??'Example_Component';
  else if(name==='QualifiedApiName')val=params.field??params.obj??'Account';
  else if(name==='NumLinesCovered')val=80;
  else if(name==='NumLinesUncovered')val=20;
  else if(/^(NumberOfErrors|NumberComponentErrors|NumberTestErrors|Retries)$/.test(name))val=variant==='B'?1:0;
  else if(/^(Rank|Level|SequenceNumber|MajorVersion|MinorVersion|PatchVersion|Length|BodyLength|LengthWithoutComments|ContentSize|LogLength|DurationMilliseconds|RunTime|BatchSize|ApiVersion|Position|Tip|JobItemsProcessed|TotalJobItems|NumberComponentsDeployed|NumberTestsCompleted)$/.test(name))val=10;
  else if(name==='Field')val=params.obj&&params.field?`${params.obj}.${params.field}`:'Industry';
  else if(name==='SobjectType')val=params.obj??'Account';
  return [key,val];
 }));
 return [row];
}
export async function sampleRun(probe,variant='A') {
 const params=parameters(probe,sampleParameters(probe)), imported=Object.create(null);
 for(const definition of probe.steps) {
  const step=plan(probe,params,imported).find(s=>s.name===definition.name);
  if(step.state==='ready')imported[step.name]=await importResult(JSON.stringify(sampleRows(step,params,variant)),step,step.query);
 }
 return {params,imported};
}
