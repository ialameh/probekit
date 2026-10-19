import {guidance} from './investigation-guidance.mjs';
export const bundles=[
 {id:'access-review',title:'Explain an access problem',description:'Trace identity, assignment state and the permissions relevant to the affected user.',probes:['access.user','access.frozen-users','access.expiring-assignments','access.field-grants','access.object-grants','access.record-access','access.group-health']},
 {id:'operational-review',title:'Review jobs and approvals',description:'Inspect pending work, failures and the evidence needed before a retry or escalation.',probes:['ops.pending-approvals','ops.approval-history','ops.async-jobs','ops.scheduled-jobs','ops.test-queue','ops.debug-logging']},
 {id:'licence-review',title:'Review licence capacity',description:'Compare reported allocations with usage and review active-user activity separately.',probes:['access.license-capacity','access.permission-license-capacity','access.dormant-users','access.expiring-assignments']},
 {id:'data-quality',title:'Review record quality',description:'Find missing values, inactive ownership, older records and duplicate candidates.',probes:['data.missing-values','data.inactive-owners','data.stale-records','data.duplicates','data.history']},
 {id:'release-review',title:'Investigate release differences',description:'Compare selected configuration and test evidence without treating it as deployment approval.',probes:['meta.installed-packages','flow.versions','meta.apex-class','meta.dependencies','ops.test-results','ops.code-coverage','ops.deploys']},
 {id:'omnistudio-review',title:'Trace an OmniStudio issue',description:'Follow active versions through elements, data mapping and compilation evidence.',probes:['omni.active-version','omni.elements','omni.data-mapper','omni.compiled','omni.flexcard']}
];
const stop=new Set(['a','an','the','is','are','was','were','to','for','of','in','on','my','our','why','how','which','what','does','do','can','cant','cannot','with','and']);
const aliases={licenses:'licence',license:'licence',licensing:'licence',seats:'licence',licences:'licence',permissions:'permission',users:'user',fields:'field',approvals:'approval',jobs:'job',flows:'flow',records:'record',inactive:'inactive',stuck:'pending',expired:'expiry',expires:'expiry',expiring:'expiry',unused:'dormant',old:'stale',duplicates:'duplicate',tests:'test'};
const words=s=>s.toLowerCase().replaceAll("'",'').split(/[^a-z0-9]+/).filter(Boolean).map(t=>aliases[t]??t);
export function searchCatalogue(catalogue,query='',family=''){
 const terms=[...new Set(words(query).filter(t=>!stop.has(t)))];
 return catalogue.filter(p=>!family||p.family===family).map(p=>{
  const title=new Set(words(guidance(p).title)),question=new Set(words(p.question)),body=new Set(words(p.steps.map(s=>s.soql).join(' '))),id=new Set(words(p.id));
  const matched=terms.filter(t=>title.has(t)||question.has(t)||body.has(t)||id.has(t));
  let score=terms.reduce((n,t)=>n+(title.has(t)?12:0)+(id.has(t)?8:0)+(question.has(t)?4:0)+(body.has(t)?1:0),0);
  if(p.id===query.trim())score+=10000;
  return {probe:p,score,matched};
 }).filter(r=>!terms.length||r.score>0).sort((a,b)=>b.score-a.score||a.probe.id.localeCompare(b.probe.id));
}
