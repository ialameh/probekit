import {queries, parseResults, analyse, report, sampleInput, sampleData, MAX_BYTES} from './access-analysis.mjs';
const $ = s => document.querySelector(s);
const titles = {user:'Find the user and profile', grants:'Find the field permission rows', assignments:'Find the user’s assignments'};
let input, current, sample = false, generation = 0;
function invalidate() { current = null; $('#results').hidden = true; $('#analysis-error').textContent = ''; }
function clear() {
  generation++; input = null; sample = false; invalidate(); $('#setup-form').reset(); $('#queries').replaceChildren(); $('#query-stage').hidden = true; $('#mode').hidden = true; $('#setup-error').textContent = ''; $('#complete').checked = false;
}
function build() {
  const next = Object.fromEntries(['object','field','username'].map(k => [k,$('#'+k).value.trim()]));
  const sql = queries(next); generation++; input = next; invalidate(); $('#complete').checked = false; $('#setup-error').textContent = ''; $('#queries').replaceChildren();
  for (const [kind, query] of Object.entries(sql)) {
    const block = document.createElement('article'); block.className = 'query';
    block.innerHTML = `<div class="query-head"><h3></h3><button type="button">Copy query</button></div><pre></pre><div class="import"><label>Paste JSON or CSV<textarea id="${kind}-data" spellcheck="false" aria-describedby="${kind}-hint"></textarea></label><label>Or choose a file<input id="${kind}-file" type="file" accept=".json,.csv,application/json,text/csv"><span class="small" id="${kind}-hint">Up to 2 MB. Files stay in this tab.</span></label></div><p class="error" role="alert"></p>`;
    block.querySelector('h3').textContent = titles[kind]; block.querySelector('pre').textContent = query;
    block.querySelector('button').onclick = async e => {
      try { await navigator.clipboard.writeText(query); e.target.textContent = 'Copied'; $('#status').textContent = `${titles[kind]} query copied.`; }
      catch { block.querySelector('.error').textContent = 'Clipboard access was unavailable. Select and copy the query above.'; }
    };
    const area = block.querySelector('textarea'), fileInput = block.querySelector('input'); let upload = 0;
    const dirty = () => { invalidate(); $('#complete').checked = false; block.querySelector('.error').textContent = ''; };
    area.oninput = () => { upload++; dirty(); };
    fileInput.onchange = async () => {
      const file = fileInput.files[0]; if (!file) return;
      const version = generation, ticket = ++upload; dirty(); area.value = '';
      try {
        if (file.size > MAX_BYTES) throw Error('Choose a file under 2 MB.');
        const text = await file.text(); if (version !== generation || ticket !== upload) return;
        area.value = text;
      } catch (e) { if (version === generation && ticket === upload) block.querySelector('.error').textContent = e.message; }
    };
    $('#queries').append(block);
  }
  $('#query-stage').hidden = false;
}
function run() {
  invalidate();
  try {
    if (!input || !$('#complete').checked) throw Error('Confirm that all three exports are complete and from the same investigation.');
    const datasets = Object.fromEntries(Object.keys(titles).map(k => {
      try { return [k,parseResults($('#'+k+'-data').value,k)]; } catch(e) {throw Error(`${titles[k]}: ${e.message}`);}
    }));
    current = analyse(input,datasets);
    $('#summary').textContent = `${sample ? 'Fictional sample · ' : ''}${input.object}.${input.field} · ${input.username} · ${current.counts.grants} field row(s), ${current.counts.assignments} assignment row(s).`;
    $('#findings').replaceChildren();
    for (const f of current.findings) { const card = document.createElement('article'); card.className='finding'; for (const [tag,text] of [['h3',f.label],['strong',f.status],['p',f.text]]) {const el=document.createElement(tag);el.textContent=text;card.append(el);} $('#findings').append(card); }
    $('#matches').replaceChildren();
    for (const row of current.matched) {const tr=document.createElement('tr');for(const text of [row.name,row.source,row.read?'Yes':'No',row.edit?'Yes':'No']){const td=document.createElement('td');td.textContent=text;tr.append(td);}$('#matches').append(tr);}
    if (!current.matched.length) {const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='No matching profile or direct permission-set rows in these exports.';tr.append(td);$('#matches').append(tr);}
    $('#next').replaceChildren(); for(const text of current.next){const li=document.createElement('li');li.textContent=text;$('#next').append(li);}
    $('#results').hidden=false;$('#results').focus();$('#status').textContent='Analysis complete. Findings and next checks are ready.';
  } catch(e) {$('#analysis-error').textContent=e.message;}
}
$('#setup-form').onsubmit=e=>{e.preventDefault();sample=false;$('#mode').hidden=true;try{build();$('#query-stage').scrollIntoView({behavior:'smooth'});}catch(e){$('#setup-error').textContent=e.message;}};
for(const k of ['object','field','username']) $('#'+k).oninput=()=>{generation++;input=null;invalidate();$('#query-stage').hidden=true;$('#queries').replaceChildren();sample=false;$('#mode').hidden=true;};
$('#clear').onclick=()=>{clear();$('#object').focus();};
$('#analyse').onclick=run;
$('#complete').onchange=invalidate;
$('#sample').onclick=()=>{clear();for(const [k,v] of Object.entries(sampleInput))$('#'+k).value=v;build();for(const [k,v] of Object.entries(sampleData))$('#'+k+'-data').value=JSON.stringify(v,null,2);sample=true;$('#mode').hidden=false;$('#complete').checked=true;run();};
$('#download').onclick=()=>{if(!current)return;const url=URL.createObjectURL(new Blob([report(input,current,sample)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=sample?'probekit-sample-findings.txt':'probekit-field-access-findings.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
