export const FAMILIES = {
 access:{title:'Access & permissions',description:'Trace users, grants, assignments, groups and record access.',check:'Confirm licences, activation, expiry, group muting and effective access as the affected user.'},
 meta:{title:'Metadata & configuration',description:'Inspect definitions, versions, dependencies and configuration differences.',check:'Check API visibility, namespaces and the relevant org feature before treating an empty result as absence.'},
 flow:{title:'Flows & automation',description:'Review active versions, triggers and paused interviews.',check:'Confirm entry conditions and runtime behaviour. An active definition alone does not prove that it runs.'},
 omni:{title:'OmniStudio',description:'Inspect processes, components, mappings, versions and compilation.',check:'These queries target the standard OmniStudio object model. Managed-package namespaces and feature availability may require adapted queries.'},
 ops:{title:'Operations & health',description:'Review jobs, logs, tests, coverage, deployments and subscribers.',check:'Results reflect an export time and query window, not continuous monitoring or the current org state.'},
 data:{title:'Records & data quality',description:'Find records, changes, duplicates, related files and counts.',check:'Record visibility, sharing, retention and query filters limit the evidence. Confirm the business rule before changing data.'}
};
const entries = {
 'access.apex-class-access':['Apex class access','Confirm a unique class match, then review grants. Class access is separate from object, field and record access.','access.user,access.permset'],
 'access.custom-permission':['Custom permission holders','Review profile grants and group assignments separately. The holder query is bounded and filters active users.','access.permset,access.permset-group'],
 'access.field-grants':['Field permission grants','Use the dedicated field-access checker for user matching by ID. These rows alone do not establish effective field access.','access.object-grants,access.user,meta.field-exists'],
 'access.group-members':['Group and queue membership','The member list can include groups, roles or nested membership. Returned users are not the full transitive membership.','access.user,access.record-shares'],
 'access.logins':['Login history','Review the exported login status and time range. Retention and limits affect the history available.','access.user,access.permset'],
 'access.object-grants':['Object permission grants','Match grants to the user’s profile and assignments; rows elsewhere in the org do not grant that user access.','access.user,access.field-grants'],
 'access.permset-group':['Permission-set group status','Check calculation status and muting before relying on the group’s effective permissions.','access.permset-holders,access.permset'],
 'access.permset-holders':['Permission-set assignments','Review expiration, activation and group-derived permissions before treating an assignment as usable access.','access.permset-group,access.user'],
 'access.permset':['Permission-set configuration','Review high-impact permissions with the permissions owner; a grant is not proof of assignment.','access.permset-holders,access.object-grants'],
 'access.record-access':['User record access','This evaluates the exported UserRecordAccess row at query time. Field access and screen visibility remain separate.','access.record-shares,access.field-grants'],
 'access.record-shares':['Record sharing rows','Share rows are not the complete access model: ownership, hierarchy and broader permissions may also grant access.','access.record-access,access.group-members'],
 'access.tab-settings':['Tab visibility settings','Tab visibility does not establish object CRUD or record access. Match settings to the user’s assignments.','access.object-grants,access.user'],
 'access.user':['User access profile','Check active/frozen state, licences and assignments together. Do not infer effective permissions from counts alone.','access.permset,access.logins'],
 'data.count-by':['Record counts by value','Counts cover the selected creation window and returned groups. A query limit can omit further groups.','data.find,data.recent'],
 'data.duplicates':['Duplicate values','Repeated values are candidates for review, not proof of business duplicates. Do not merge or delete without validation.','data.find,meta.duplicate-rules'],
 'data.emails':['Related email activity','Email visibility, retention and the relationship field can limit returned activity.','data.record,data.history'],
 'data.files':['Related files','Confirm document sharing and actual content separately. Equal metadata does not establish equal file contents.','data.record,access.record-access'],
 'data.find':['Find records by value','Check exact versus wildcard filtering and the selected result limit.','data.record,data.duplicates'],
 'data.history':['Field change history','Only tracked fields and retained history are available. No row does not establish that a record never changed.','data.record,ops.setup-audit'],
 'data.recent':['Recent record changes','The selected fields and time window describe only the exported records.','data.history,ops.setup-audit'],
 'data.record':['Record inspection','When comparing orgs, map equivalent business records rather than assuming Salesforce IDs match.','data.history,access.record-access'],
 'flow.interviews':['Flow interviews','Inspect status and current element before calling an interview paused or failed.','flow.versions,ops.debug-logging'],
 'flow.on-object':['Flows on an object','The filter uses the object label. Review trigger type and entry criteria before linking a flow to an observed change.','flow.versions,meta.apex-trigger'],
 'flow.versions':['Flow version alignment','Review active and latest versions alongside the intended release. Version differences do not show definition content.','flow.on-object,meta.dependencies'],
 'meta.apex-class':['Apex class differences','Body fingerprints compare exact exported source. They do not evaluate semantics or runtime behaviour.','ops.test-results,ops.code-coverage'],
 'meta.apex-trigger':['Apex triggers','Review active triggers and source differences alongside flows and runtime evidence.','flow.on-object,ops.debug-logging'],
 'meta.credentials':['Credential configuration','This inspects metadata, not secret values, authentication success or connectivity.','meta.dependencies,ops.setup-audit'],
 'meta.custom-field':['Custom field change details','Review creation and modification metadata for the requested field. The field name excludes the __c suffix in this query.','meta.field-exists,meta.object-fields'],
 'meta.custom-labels':['Custom labels','Translations and language settings can change the runtime text even when the exported base label matches.','meta.lwc,meta.dependencies'],
 'meta.custom-metadata':['Custom metadata records','Choose all business-relevant fields for comparison. A match on selected columns does not establish full equality.','meta.dependencies,ops.setup-audit'],
 'meta.dependencies':['Component dependencies','Dependency tracking is incomplete for dynamic references. Review source and runtime behaviour as well.','meta.apex-class,meta.lwc'],
 'meta.duplicate-rules':['Duplicate-rule status','An active rule is not proof that it applies to every record. Review conditions and matching rules.','data.duplicates,meta.validation-rules'],
 'meta.email-template':['Email template differences','Review folder access, translations and merge context. Equal body fingerprints do not establish equal rendered email.','data.emails,meta.custom-labels'],
 'meta.field-exists':['Field definition','A returned definition establishes presence in the export; an empty result may reflect visibility or query context.','access.field-grants,meta.picklist-values'],
 'meta.installed-packages':['Installed package versions','Compare package versions and namespaces; configuration and package data may still differ.','meta.dependencies,meta.org'],
 'meta.layouts':['Layouts and assignments','Inspect profile and record-type assignments. Dynamic Forms and Lightning page visibility can override the apparent layout path.','meta.record-pages,meta.record-types'],
 'meta.lwc':['Lightning component files','Source fingerprints show exact exported file differences. Review page placement, permissions and runtime errors separately.','meta.record-pages,meta.dependencies'],
 'meta.object-fields':['Object field catalogue','Review the requested filter and namespace; exported definitions are not a user-access assessment.','meta.field-exists,access.field-grants'],
 'meta.object':['Object definition','Review sharing settings alongside sharing rules, ownership and effective record access.','access.record-access,meta.object-fields'],
 'meta.org':['Org identity','Record the exported org identity and sandbox flag. Do not infer that every non-sandbox org is a production customer org.','meta.installed-packages,ops.setup-audit'],
 'meta.picklist-values':['Picklist values','Record-type restrictions, dependencies and translations can affect the choices a user sees.','meta.record-types,meta.field-exists'],
 'meta.record-pages':['Lightning record pages','Page presence does not establish activation or assignment. Verify app, profile, record type and form-factor activation.','meta.layouts,meta.lwc'],
 'meta.record-types':['Record types','Review record-type availability and defaults for the affected profile, not just active status.','meta.layouts,meta.picklist-values'],
 'meta.static-resource':['Static resource metadata','Matching size and content type do not prove identical bytes. Download the resources for a content comparison.','meta.lwc,meta.dependencies'],
 'meta.validation-rules':['Validation-rule status','The query does not include the rule formula. Review conditions and bypass permissions before explaining a failed save.','meta.duplicate-rules,flow.on-object'],
 'omni.active-version':['Process active versions','Confirm the intended Type/SubType and language. Multiple active matches need review before following a single process.','omni.elements,omni.compiled'],
 'omni.compiled':['Process compilation','Timestamp ordering can suggest a stale compilation; it does not prove the cause of a rendering failure.','omni.active-version,omni.elements'],
 'omni.data-mapper':['Data Mapper configuration','Review input data, conditions and runtime output in addition to mapping rows.','omni.elements,meta.field-exists'],
 'omni.decision-matrix':['Decision matrix versions','Enabled flags and date windows do not establish that a process uses the matrix. Multiple enabled versions can contribute rows.','omni.expression-set,omni.elements'],
 'omni.document-template':['Document template versions','Review activation, permissions and the runtime document-generation path.','omni.data-mapper,omni.elements'],
 'omni.elements':['Process elements','An active element may still be behind a condition. Configuration fingerprints do not establish execution.','omni.data-mapper,omni.compiled'],
 'omni.expression-set':['Expression-set versions','Review rank, start/end windows and the caller before deciding which version runs.','omni.decision-matrix,omni.elements'],
 'omni.flexcard':['FlexCard versions','Review the selected version, data source and page activation in the actual user journey.','omni.active-version,meta.record-pages'],
 'ops.async-jobs':['Async job failures','Review job errors and completion states within the selected window. Counts alone do not identify a root cause.','ops.debug-logging,ops.scheduled-jobs'],
 'ops.code-coverage':['Apex coverage','Coverage is exported aggregate data, not a deployment validation or proof of adequate assertions.','ops.test-results,meta.apex-class'],
 'ops.debug-logging':['Debug logging status','A future expiration alone is insufficient: check start time, log type, debug level and the target user.','access.user,ops.async-jobs'],
 'ops.deploys':['Deployment outcomes','Inspect check-only versus deployment runs and component/test errors. A failed job needs detailed failure messages.','ops.test-results,meta.dependencies'],
 'ops.event-subscribers':['Event subscriber health','Inspect status, retry counts, errors and position/Tip in the export. The configuration step is org-wide and may include unrelated subscribers.','ops.async-jobs,ops.debug-logging'],
 'ops.scheduled-jobs':['Scheduled jobs','Review state, next fire time, timezone and the related job before changing a schedule.','ops.async-jobs,ops.setup-audit'],
 'ops.setup-audit':['Setup change audit','Audit retention and filters constrain the timeline. A nearby change is a lead, not proof of causation.','meta.custom-field,meta.validation-rules'],
 'ops.test-results':['Apex test outcomes','These are the latest exported method results, not necessarily one test run. Group by job/run before drawing release conclusions.','ops.code-coverage,ops.deploys']
};
export function guidance(probe) {
 const entry=entries[probe.id];if(!entry)throw Error('Missing investigation guidance: '+probe.id);
 return {title:entry[0],next:entry[1],related:entry[2].split(','),family:FAMILIES[probe.family]};
}
const boolKeys=['IsActive','Active','IsEnabled','IsFrozen','HasReadAccess','HasEditAccess','PermissionsRead','PermissionsEdit','PermissionsModifyAllData','PermissionsViewAllData'];
export function findings(probe,steps,now=new Date()) {
 const out=[];
 const add=(title,text,kind='Observation')=>out.push({title,text,kind});
 for(const step of steps) {
  if(step.state!=='complete') {add(step.name,step.reason||'No completed export for this step.','Unresolved');continue;}
  const rows=step.records;
  add(step.name,`${rows.length} row(s) supplied${rows.length?' for the generated query.':'. No presence or access conclusion can be made from an empty export alone.'}`);
  for(const w of step.warnings)add(step.name,w,'Limit');
  for(const key of boolKeys) if(step.columns.includes(key)&&rows.length) {
   const yes=rows.filter(r=>r[key]===true).length,no=rows.filter(r=>r[key]===false).length;
   add(key,`${yes} true, ${no} false, ${rows.length-yes-no} unknown in ${step.name}.`);
  }
  for(const key of ['Status','State','Outcome','InterviewStatus'])if(step.columns.includes(key)&&rows.length){
   const counts=new Map();for(const row of rows){const v=String(row[key]??'Unknown');counts.set(v,(counts.get(v)??0)+1);}
   add(key,[...counts].slice(0,15).map(([k,v])=>`${k}: ${v}`).join('; ')+(counts.size>15?'; additional values omitted.':'.'));
  }
 }
 const records=name=>steps.find(s=>s.name===name&&s.state==='complete')?.records??[];
 if(probe.id==='flow.versions') for(const r of records('definition')) {
  const active=r['ActiveVersion.VersionNumber'],latest=r['LatestVersion.VersionNumber'];
  add('Version alignment',`Exported active version: ${active??'none'}; latest version: ${latest??'unknown'}. ${active!==null&&active!==latest?'The values differ; review the intended release.':'Review runtime entry conditions separately.'}`);
 }
 if(['omni.active-version','omni.flexcard','omni.expression-set','omni.decision-matrix'].includes(probe.id)) {
  const key=probe.id==='omni.decision-matrix'?'IsEnabled':'IsActive';
  const active=records('versions').filter(r=>r[key]===true);
  add('Selected versions',active.length?`${active.length} row(s) have ${key}=true. Version numbers: ${active.map(r=>r.VersionNumber).join(', ')}. Check date windows and runtime selection.`:`No supplied version row has ${key}=true. This is limited to the exported rows.`);
 }
 if(probe.id==='omni.compiled') {
  const p=records('process'),c=records('compiled');
  if(p.length===1&&c.length){const dates=c.map(r=>Date.parse(r.LastModifiedDate));const source=Date.parse(p[0].LastModifiedDate);if(Number.isFinite(source)&&dates.every(Number.isFinite))add('Compilation timing',Math.max(...dates)<source?'The most recent exported compilation predates the process change. Recompilation may be needed.':'An exported compilation is at least as recent as the process change. This does not establish runtime correctness.');}
 }
 if(probe.id==='ops.code-coverage')for(const r of records('coverage')){
  const total=r.NumLinesCovered+r.NumLinesUncovered;
  add('Coverage',r.NumLinesCovered===null||r.NumLinesUncovered===null||total<=0?'No nonzero measurable line total in this row.':`${Math.round(100*r.NumLinesCovered/total)}% of ${total} counted lines are covered in this export.`);
 }
 if(probe.id==='ops.async-jobs')add('Failure signals',`${records('jobs').filter(r=>r.Status==='Failed'||r.NumberOfErrors>0).length} supplied job row(s) report Failed or a positive error count.`);
 if(probe.id==='ops.deploys')add('Deployment errors',`${records('deploys').filter(r=>r.NumberComponentErrors>0||r.NumberTestErrors>0).length} supplied deployment row(s) have component or test errors.`);
 if(probe.id==='ops.event-subscribers')add('Subscriber signals',`${records('subscribers').filter(r=>r.Position!==null&&r.Tip!==null&&r.Position<r.Tip).length} supplied subscriber row(s) have Position below Tip. Check runtime status and errors.`);
 if(probe.id==='ops.debug-logging'){
  const flags=records('flags');
  add('Trace-flag window',`${flags.filter(r=>Date.parse(r.StartDate)<=now.getTime()&&Date.parse(r.ExpirationDate)>now.getTime()).length} supplied flag(s) have start/end dates spanning ${now.toISOString()}. Log type, levels and target still matter.`);
 }
 if(['data.count-by','data.duplicates'].includes(probe.id)){
  const rows=records(probe.id==='data.count-by'?'counts':'dupes');
  add('Returned groups',`${rows.length} group(s), totalling ${rows.reduce((n,r)=>n+(r.n??0),0)} counted records across the returned groups. This is not necessarily the org-wide total.`);
 }
 add('Next check',guidance(probe).next,'Action');
 add('Scope',FAMILIES[probe.family].check,'Limit');
 return out;
}
