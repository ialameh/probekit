import {bundles} from './investigation-discovery.mjs';
import {reportText} from './investigation-engine.mjs';
export function packDefinition(id){const pack=bundles.find(p=>p.id===id);if(!pack)throw Error('Unknown investigation pack.');return pack;}
export function captureCheck(probe,runs,options={}){
 if(!runs.length||!runs.some(r=>r.steps.length))throw Error('Build query steps before saving this check.');
 const states=runs.flatMap(r=>r.steps.map(s=>s.state));
 const complete=runs.every(r=>r.steps.length===probe.steps.length&&r.steps.every(s=>['complete','skipped'].includes(s.state)));
 return {id:probe.id,status:complete?'reviewed':'partial',sample:options.sample===true,savedAt:new Date().toISOString(),completedExports:states.filter(s=>s==='complete').length,report:reportText(probe,runs,options)};
}
export function combinedReport(id,entries=[],notes=''){
 const pack=packDefinition(id);
 if(!Array.isArray(entries)||entries.length>pack.probes.length)throw Error('Too many pack entries.');
 if(typeof notes!=='string'||notes.length>10000)throw Error('Pack notes must be at most 10,000 characters.');
 const seen=new Set();
 for(const e of entries){if(!pack.probes.includes(e.id)||seen.has(e.id))throw Error('Pack entries must be unique members of this pack.');seen.add(e.id);if(!['reviewed','partial','skipped'].includes(e.status))throw Error('Invalid check status.');}
 const evidence=entries.filter(e=>e.status!=='skipped');
 if(new Set(evidence.map(e=>e.sample===true)).size>1)throw Error('Keep fictional samples and supplied exports in separate packs. Clear the pack before switching.');
 const sample=evidence.length>0&&evidence.every(e=>e.sample===true);
 const checks=pack.probes.map(id=>entries.find(e=>e.id===id)??{id,status:'not started'});
 const counts=Object.fromEntries(['reviewed','partial','skipped','not started'].map(s=>[s,checks.filter(c=>c.status===s).length]));
 const lines=['ProbeKit · Free tools by OrgParity',sample?'FICTIONAL SAMPLE PACK — not an org assessment':'Investigation pack report',pack.title,`Created: ${new Date().toISOString()}`,'',pack.description,'Scope: saved check snapshots only. These checks may use different orgs, filters and time windows; confirm their context before combining conclusions. Reviewed means exports were supplied or conditions skipped steps, not that the org passed. Skipped and unstarted checks provide no evidence.','',`Progress: ${counts.reviewed} reviewed; ${counts.partial} partial; ${counts.skipped} skipped; ${counts['not started']} not started.`];
 for(const c of checks)lines.push('',`== ${c.id}: ${c.status} ==`,...(c.status==='skipped'?[`User reason: ${c.reason||'No reason supplied.'}`]:c.report?[`Snapshot saved: ${c.savedAt}`,c.report]:['No saved evidence.']));
 if(notes.trim())lines.push('','Pack notes',notes.trim());
 lines.push('','Reports exclude raw result rows but can contain parameters, query values and notes. Review before sharing.');
 return {tool:'ProbeKit by OrgParity',pack:id,title:pack.title,sample,counts,checks,notes,report:lines.join('\n')};
}
