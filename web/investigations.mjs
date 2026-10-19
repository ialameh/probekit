import catalogue from './investigation-catalogue.mjs';
import {parameters,plan,importResult,compareResults,reportText,LIMITS} from './investigation-engine.mjs';
import {FAMILIES,guidance,findings} from './investigation-guidance.mjs';
import {sampleRun} from './investigation-samples.mjs';
const $=s=>document.querySelector(s);
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const btn=(text,fn,cls='secondary')=>{const e=node('button',text,cls);e.type='button';e.onclick=fn;return e;};
const link=(text,href)=>{const e=node('a',text);e.href=href;return e;};
let probe=null,runs=[],isSample=false,epoch=0;
const draft=()=>Object.fromEntries(Object.entries(probe.params).map(([k,s])=>[k,s.default??'']));
const makeRun=i=>({label:`Result ${i===0?'A':'B'}`,draft:draft(),params:null,imported:Object.create(null),version:0});
function announce(text){$('#status').textContent=text;}
function clearData(){epoch++;isSample=false;runs=[makeRun(0),makeRun(1)];$('#sample-notice').hidden=true;$('#notes').value='';renderRuns();renderSummary();}
function route(){
 const id=location.hash.slice(1);probe=catalogue.find(p=>p.id===id)??null;epoch++;
 $('#catalogue').hidden=!!probe;$('#workspace').hidden=!probe;
 if(!probe){runs=[];$('#workspace').hidden=true;$('#run-panels').replaceChildren();for(const id of ['findings','differences','related','traps'])$('#'+id).replaceChildren();$('#notes').value='';document.title='Salesforce investigations · ProbeKit by OrgParity';renderCatalogue();return;}
 const info=guidance(probe);$('#title').textContent=info.title;$('#question').textContent=probe.question;$('#family-label').textContent=info.family.title;$('#guidance').textContent=info.next;
 document.title=`${info.title} · ProbeKit by OrgParity`;
 $('#compare-mode').checked=false;clearData();window.scrollTo(0,0);
}
function renderCatalogue(){
 const q=$('#search').value.toLowerCase().trim().split(/\s+/).filter(Boolean),family=$('#family').value;
 const rows=catalogue.filter(p=>(!family||p.family===family)&&q.every(t=>(p.id+' '+p.question+' '+guidance(p).title+' '+p.steps.map(s=>s.soql).join(' ')).toLowerCase().includes(t)));
 $('#cards').replaceChildren();$('#catalogue-count').textContent=`${rows.length} of ${catalogue.length} investigations`;
 for(const p of rows){const a=link('',`#${p.id}`);a.className='investigation-card';a.append(node('span',FAMILIES[p.family].title,'eyebrow'),node('h2',guidance(p).title),node('p',p.question),node('span',`${p.steps.length} query step${p.steps.length===1?'':'s'}${p.steps.some(s=>s.tooling)?' · Includes Tooling API':''}`,'small'));$('#cards').append(a);}
 $('#empty').hidden=rows.length!==0;
}
for(const [key,f] of Object.entries(FAMILIES)){const option=node('option',f.title);option.value=key;$('#family').append(option);}
$('#search').oninput=renderCatalogue;$('#family').onchange=renderCatalogue;window.addEventListener('hashchange',route);
function currentSteps(run){return run.params?plan(probe,run.params,run.imported):[];}
function invalidateFrom(run,name){
 const index=probe.steps.findIndex(s=>s.name===name);for(const step of probe.steps.slice(index))delete run.imported[step.name];run.version++;
}
function renderRuns(){
 $('#run-panels').replaceChildren();$('#run-panels').classList.toggle('compare',$('#compare-mode').checked);
 const count=$('#compare-mode').checked?2:1;
 for(let i=0;i<count;i++)renderRun(i);
}
function renderRun(index){
 const run=runs[index];let panel=$(`#run-${index}`);
 if(!panel){panel=node('section',undefined,'panel run-panel');panel.id=`run-${index}`;$('#run-panels').append(panel);}panel.replaceChildren();
 const header=node('div',undefined,'run-header');header.append(node('h2',`Result ${index===0?'A':'B'}`));
 if(index===1)header.append(btn('Copy A’s parameters',()=>{run.draft={...runs[0].draft};run.params=null;run.imported=Object.create(null);run.version++;renderRun(index);renderSummary();}));
 panel.append(header);
 const label=node('label','Export label');const labelInput=document.createElement('input');labelInput.maxLength=80;labelInput.value=run.label;labelInput.autocomplete='off';labelInput.oninput=()=>{run.label=labelInput.value.trim()||`Result ${index===0?'A':'B'}`;renderSummary();};label.append(labelInput);panel.append(label);
 const form=document.createElement('form'),grid=node('div',undefined,'param-grid');
 for(const [key,spec] of Object.entries(probe.params)){
  const wrapper=node('label',key+(spec.optional?' (optional)':''));const inp=document.createElement('input');inp.name=key;inp.value=run.draft[key]??'';inp.placeholder=spec.example??'';inp.required=!spec.optional;inp.maxLength=2000;inp.autocomplete='off';inp.spellcheck=false;
  inp.oninput=()=>{run.draft[key]=inp.value;run.params=null;run.imported=Object.create(null);run.version++;panel.querySelector('.step-list')?.replaceChildren();renderSummary();};
  wrapper.append(inp,node('small',`${spec.type}${spec.default!==undefined?` · default ${spec.default}`:''}`));grid.append(wrapper);
 }
 form.append(grid);const actions=node('div',undefined,'actions');const build=node('button','Build query steps');build.type='submit';actions.append(build);form.append(actions);
 const error=node('p','','error');error.setAttribute('role','alert');form.append(error);
 form.onsubmit=e=>{e.preventDefault();try{run.params=parameters(probe,run.draft);run.imported=Object.create(null);run.version++;error.textContent='';renderStepList(index);renderSummary();announce('Query steps built.');}catch(e){error.textContent=e.message;}};
 panel.append(form);const list=node('div',undefined,'step-list');panel.append(list);renderStepList(index);
}
function resultTable(result){
 const wrap=node('div',undefined,'result-preview'),table=document.createElement('table'),head=document.createElement('thead'),hr=document.createElement('tr'),body=document.createElement('tbody');
 for(const key of result.columns){const th=node('th',key);th.scope='col';hr.append(th);}head.append(hr);table.append(head);
 for(const row of result.records.slice(0,25)) {const tr=document.createElement('tr');for(const k of result.columns){const text=row[k]===null?'null':String(row[k]);const td=node('td',text.length>180?text.slice(0,180)+'…':text);tr.append(td);}body.append(tr);}
 table.append(body);wrap.append(table);return wrap;
}
function renderStepList(index){
 const run=runs[index],list=$(`#run-${index} .step-list`);list.replaceChildren();
 for(const step of currentSteps(run)){
  const section=node('article',undefined,'step-panel');section.dataset.step=step.name;
  const title=node('div',undefined,'step-title');title.append(node('h3',step.name.replaceAll('_',' ')),node('span',`${step.tooling?'Tooling API':'Standard API'} · ${step.state}`,'badge'+(['blocked','unavailable'].includes(step.state)?' warning':'')));section.append(title);
  if(step.reason)section.append(node('p',step.reason,'small'));
  if(step.query){
   const pre=node('pre',step.query);section.append(pre,btn('Copy query',async e=>{try{await navigator.clipboard.writeText(step.query);e.target.textContent='Copied';announce('Query copied.');}catch{announce('Clipboard unavailable. Select and copy the query text.');}}));
   if(!/\b(WHERE|LIMIT)\b/i.test(step.query))section.append(node('p','This query is not bounded by WHERE or LIMIT. Review org size and access before running it.','small'));
  }
  if(step.state==='complete'){
   section.append(node('p',`${step.records.length} imported row(s).${step.hash?.length?' Source/configuration columns are fingerprinted locally.':''}`,'small'));
   for(const w of step.warnings)section.append(node('p',w,'notice'));
   if(step.records.length)section.append(resultTable(step),node('p',`Preview: first ${Math.min(25,step.records.length)} of ${step.records.length} row(s). Long values are shortened for display.`,'small'));
   section.append(btn('Replace this result',()=>{invalidateFrom(run,step.name);renderStepList(index);renderSummary();}));
  }else if(step.state==='unavailable')section.append(btn('Retry this step',()=>{invalidateFrom(run,step.name);renderStepList(index);renderSummary();}));
  else if(step.state==='ready'){
   const areaLabel=node('label','Paste JSON or CSV','import-area'),area=document.createElement('textarea');area.spellcheck=false;area.setAttribute('aria-label',`${run.label}: ${step.name} results`);areaLabel.append(area);section.append(areaLabel);
   const fileLabel=node('label','Or choose a JSON/CSV export','file-input'),file=document.createElement('input');file.type='file';file.accept='.json,.csv,application/json,text/csv';fileLabel.append(file);section.append(fileLabel);
   const confirmation=node('label',undefined,'confirmation'),confirm=document.createElement('input');confirm.type='checkbox';confirmation.append(confirm,node('span','I used this query, exported every result page, and checked the org and time window.'));section.append(confirmation);
   const error=node('p','','error');error.setAttribute('role','alert');let revision=0;
   const accept=btn('Accept result',async()=>{
    if(!confirm.checked){error.textContent='Confirm the query and completeness before accepting the result.';return;}
    const ticket=revision,version=run.version,routeEpoch=epoch;accept.disabled=true;error.textContent='';
    try{const result=await importResult(area.value,step,step.query);if(ticket!==revision||version!==run.version||routeEpoch!==epoch)return;invalidateFrom(run,step.name);run.imported[step.name]=result;renderStepList(index);renderSummary();announce(`${step.name}: ${result.records.length} rows accepted.`);}
    catch(e){if(ticket===revision&&version===run.version&&routeEpoch===epoch)error.textContent=e.message;}
    finally{accept.disabled=false;}
   },'');
   area.oninput=()=>{revision++;confirm.checked=false;error.textContent='';};
   file.onchange=async()=>{
    const f=file.files[0];if(!f)return;const ticket=++revision,version=run.version,routeEpoch=epoch;area.value='';confirm.checked=false;error.textContent='';
    try{if(f.size>LIMITS.bytes)throw Error('Choose an export under 2 MB.');const text=await f.text();if(ticket===revision&&version===run.version&&routeEpoch===epoch)area.value=text;}
    catch(e){if(ticket===revision&&routeEpoch===epoch)error.textContent=e.message;}
   };
   const actions=node('div',undefined,'actions');actions.append(accept,btn('Result unavailable',()=>{invalidateFrom(run,step.name);run.imported[step.name]={state:'unavailable',query:step.query,reason:'Marked unavailable by the user. No result or absence conclusion is recorded.'};renderStepList(index);renderSummary();}));section.append(actions,error,node('p','Up to 2 MB / 10,000 rows per export. Later imports on this side are cleared if this result changes.','small'));
  }
  list.append(section);
 }
}
function summaries(){
 return runs.slice(0,$('#compare-mode').checked?2:1).map(r=>({label:r.label,params:r.params??{},steps:currentSteps(r),findings:r.params?findings(probe,currentSteps(r)):[]}));
}
function comparisons(items){return items.length===2?probe.steps.map(s=>({name:s.name,...compareResults(items[0].steps.find(x=>x.name===s.name),items[1].steps.find(x=>x.name===s.name),s)})):[];}
function renderSummary(){
 const items=summaries(),hasAny=items.some(r=>r.steps.length);$('#findings-panel').hidden=!hasAny;
 if(!hasAny){for(const id of ['findings','differences','related','traps'])$('#'+id).replaceChildren();$('#progress').textContent='';return;}
 const all=items.flatMap(r=>r.steps),completed=all.filter(s=>s.state==='complete').length;
 $('#progress').textContent=`${completed} completed export(s); ${all.filter(s=>['ready','waiting'].includes(s.state)).length} awaiting results; ${all.filter(s=>['blocked','unavailable'].includes(s.state)).length} unresolved. Conditions can skip other steps.`;
 $('#findings').replaceChildren();
 for(const run of items){const group=node('section',undefined,'finding-group');group.append(node('h3',run.label));if(!run.steps.length)group.append(node('p','Build the query steps to begin this result set.'));
  for(const f of run.findings){const card=node('article',undefined,'finding');card.append(node('strong',`${f.title} · ${f.kind}`),node('p',f.text));group.append(card);}$('#findings').append(group);}
 $('#comparison').hidden=items.length!==2;$('#differences').replaceChildren();
 if(items.length===2){
  if(JSON.stringify(items[0].params)!==JSON.stringify(items[1].params))$('#differences').append(node('p','The parameter sets differ. Compare equivalent records, filters and time windows before interpreting differences.','notice'));
  for(const c of comparisons(items)){
   const box=node('article',undefined,'difference');box.append(node('h3',`${c.name}: ${c.state==='same'?'same selected values':c.state==='different'?'different selected values':'not comparable'}`));
   box.append(node('p',c.reason??c.scope));
   if(c.columns){box.append(node('p','Compared: '+c.columns.join(', '),'small'));
    for(const [name,rows] of [[items[0].label,c.onlyA],[items[1].label,c.onlyB]])if(rows.length){box.append(node('h4',`Only in ${name}: ${rows.reduce((n,r)=>n+r.count,0)} row(s)`));box.append(node('div',rows.slice(0,50).map(r=>`${r.count} × ${JSON.stringify(r.values)}`).join('\n'),'diff-rows'));if(rows.length>50)box.append(node('p',`Showing 50 of ${rows.length} distinct differences.`,'small'));}
    for(const w of c.warnings)box.append(node('p',w,'notice'));
   }$('#differences').append(box);
  }
 }
 $('#traps').replaceChildren();for(const text of [guidance(probe).next,FAMILIES[probe.family].check,...(probe.traps??[])])$('#traps').append(node('li',text));
 $('#related').replaceChildren();for(const id of guidance(probe).related){const p=catalogue.find(x=>x.id===id);if(p)$('#related').append(link(guidance(p).title,'#'+id));}
 if(probe.family==='access')$('#related').append(link('Dedicated field-access checker','/field-access.html'));
}
$('#compare-mode').onchange=()=>{
 const enabled=$('#compare-mode').checked;$('#run-panels').classList.toggle('compare',enabled);
 if(enabled){if(!runs[1].params)runs[1].draft={...runs[0].draft};renderRun(1);}
 else{runs[1].version++;$('#run-1')?.remove();}
 renderSummary();
};
$('#clear').onclick=()=>{clearData();announce('All investigation data cleared.');};
$('#sample').onclick=async()=>{
 const ticket=++epoch;$('#sample').disabled=true;
 try{
  const p=probe;const samples=await Promise.all([sampleRun(p,'A'),sampleRun(p,'B')]);if(ticket!==epoch)return;
  isSample=true;$('#sample-notice').hidden=false;$('#notes').value='';
  runs=samples.map((r,i)=>({label:`Fictional result ${i===0?'A':'B'}`,draft:{...r.params},params:r.params,imported:r.imported,version:0}));
  renderRuns();renderSummary();$('#findings-panel').focus();announce('Fictional sample loaded.');
 }catch(e){announce(e.message);}finally{$('#sample').disabled=false;}
};
function download(text,type,extension){const url=URL.createObjectURL(new Blob([text],{type}));const a=link('',url);a.download=`probekit-${probe.id}${isSample?'-sample':''}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download').onclick=()=>{const items=summaries();download(reportText(probe,items,{sample:isSample,notes:$('#notes').value,comparisons:comparisons(items)}),'text/plain;charset=utf-8','txt');};
$('#download-json').onclick=()=>{
 const items=summaries();const data={tool:'ProbeKit by OrgParity',investigation:probe.id,question:probe.question,sample:isSample,createdAt:new Date().toISOString(),scope:'Supplied exports only. No independent verification of org identity, query execution, freshness or completeness.',notes:$('#notes').value,runs:items.map(r=>({label:r.label,params:r.params,findings:r.findings,steps:r.steps.map(s=>({name:s.name,state:s.state,query:s.query,reason:s.reason,rows:s.records?.length,columns:s.columns,warnings:s.warnings,importedAt:s.importedAt}))})),comparisons:comparisons(items).map(c=>({name:c.name,state:c.state,reason:c.reason,scope:c.scope,columns:c.columns,onlyARows:c.onlyA?.reduce((n,r)=>n+r.count,0),onlyBRows:c.onlyB?.reduce((n,r)=>n+r.count,0),warnings:c.warnings}))};
 download(JSON.stringify(data,null,2),'application/json','json');
};
route();
