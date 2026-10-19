# Probe library

61 probes.

| Probe | Question | Writes | Runs logged |
|---|---|---|---|
| [access.apex-class-access](access.apex-class-access.md) | Which profiles and permission sets may run this Apex class? | no | 0 |
| [access.custom-permission](access.custom-permission.md) | Which permission sets grant this custom permission, and who holds them? | no | 0 |
| [access.field-grants](access.field-grants.md) | Who can read and edit this field, and is that access assigned to the user? | no | 0 |
| [access.group-members](access.group-members.md) | Who is in this public group or queue, and which objects does the queue serve? | no | 0 |
| [access.logins](access.logins.md) | When and how did this user last log in? | no | 0 |
| [access.object-grants](access.object-grants.md) | Which profiles and permission sets grant access to this object, and at what level? | no | 0 |
| [access.permset](access.permset.md) | What is this permission set: licence, type, key system permissions, and how much does it grant? | no | 0 |
| [access.permset-group](access.permset-group.md) | What is inside this permission set group, and has it finished recalculating? | no | 0 |
| [access.permset-holders](access.permset-holders.md) | Who holds this permission set or permission set group? | no | 0 |
| [access.record-access](access.record-access.md) | What access does this user have to this record, as the platform calculates it? | no | 0 |
| [access.record-shares](access.record-shares.md) | Which share rows open this record, to whom, and why? | no | 0 |
| [access.tab-settings](access.tab-settings.md) | Which permission sets and profiles show or hide this tab? | no | 0 |
| [access.user](access.user.md) | Who is this user: profile, role, licence, active or frozen, permission sets and licences? | no | 0 |
| [data.count-by](data.count-by.md) | How are recent records of this object spread across the values of this field? | no | 0 |
| [data.duplicates](data.duplicates.md) | Which values of this field appear on more than one record? | no | 0 |
| [data.emails](data.emails.md) | Which emails were logged against this record? | no | 0 |
| [data.files](data.files.md) | Which files are attached to this record, and who can see them? | no | 0 |
| [data.find](data.find.md) | Which records of this object have this value in this field? | no | 0 |
| [data.history](data.history.md) | How did the tracked fields of this record change over time? | no | 0 |
| [data.recent](data.recent.md) | Which records of this object changed recently, and who changed them? | no | 0 |
| [data.record](data.record.md) | What does this one record hold right now? | no | 0 |
| [flow.interviews](flow.interviews.md) | Which flow interviews are paused or waiting on this org? | no | 0 |
| [flow.on-object](flow.on-object.md) | Which flows fire on this object or event? | no | 0 |
| [flow.versions](flow.versions.md) | Which version of this flow is active, which is latest, and who changed each? | no | 0 |
| [meta.apex-class](meta.apex-class.md) | Which version of this Apex class is on the org, and who built and last changed it? | no | 0 |
| [meta.apex-trigger](meta.apex-trigger.md) | Which triggers run on this object, and are they the same across orgs? | no | 0 |
| [meta.credentials](meta.credentials.md) | Which named and external credentials exist, and what do they point at? | no | 0 |
| [meta.custom-field](meta.custom-field.md) | Who created and last changed this custom field? | no | 0 |
| [meta.custom-labels](meta.custom-labels.md) | Which custom labels match this name or text? | no | 0 |
| [meta.custom-metadata](meta.custom-metadata.md) | What rows does this custom metadata type hold, and do they match across orgs? | no | 0 |
| [meta.dependencies](meta.dependencies.md) | What uses this component, and what does it use? | no | 0 |
| [meta.duplicate-rules](meta.duplicate-rules.md) | Which duplicate rules run on this object? | no | 0 |
| [meta.email-template](meta.email-template.md) | Is this email template the same across orgs, and is it active? | no | 0 |
| [meta.field-exists](meta.field-exists.md) | Does this field exist on the org, regardless of who can see it? | no | 0 |
| [meta.installed-packages](meta.installed-packages.md) | Which managed packages are installed, at which version? | no | 0 |
| [meta.layouts](meta.layouts.md) | Which page layouts does this object have, and which profile gets which? | no | 0 |
| [meta.lwc](meta.lwc.md) | Is this Lightning web component the same across orgs, file by file? | no | 0 |
| [meta.object](meta.object.md) | What is this object: label, key prefix, sharing model, and where it comes from? | no | 0 |
| [meta.object-fields](meta.object-fields.md) | Which fields does this object have, optionally matching a pattern? | no | 0 |
| [meta.org](meta.org.md) | Which org is this: name, type, instance, sandbox or production? | no | 0 |
| [meta.picklist-values](meta.picklist-values.md) | Which values does this picklist offer? | no | 0 |
| [meta.record-pages](meta.record-pages.md) | Which Lightning record pages exist for this object? | no | 0 |
| [meta.record-types](meta.record-types.md) | Which record types does this object have, and which are active? | no | 0 |
| [meta.static-resource](meta.static-resource.md) | Is this static resource the same across orgs? | no | 0 |
| [meta.validation-rules](meta.validation-rules.md) | Which validation rules run on this object, and which are active? | no | 0 |
| [omni.active-version](omni.active-version.md) | Which version of this OmniScript or Integration Procedure is active, and who touched each version? | no | 0 |
| [omni.compiled](omni.compiled.md) | Has the active OmniScript been compiled since it last changed? | no | 0 |
| [omni.data-mapper](omni.data-mapper.md) | What does this Data Mapper read and write, and is it the same across orgs? | no | 0 |
| [omni.decision-matrix](omni.decision-matrix.md) | Which versions of this decision matrix are enabled, and what rows does the enabled one hold? | no | 0 |
| [omni.document-template](omni.document-template.md) | Which versions of this document template exist, and which is active? | no | 0 |
| [omni.elements](omni.elements.md) | What steps does the active version of this OmniScript or Integration Procedure run? | no | 0 |
| [omni.expression-set](omni.expression-set.md) | Which versions of this expression set exist, and which is active? | no | 0 |
| [omni.flexcard](omni.flexcard.md) | Which version of this FlexCard is active, and who changed each version? | no | 0 |
| [ops.async-jobs](ops.async-jobs.md) | Which async Apex jobs ran recently, and did they fail? | no | 0 |
| [ops.code-coverage](ops.code-coverage.md) | How much of this class or trigger do tests cover? | no | 0 |
| [ops.debug-logging](ops.debug-logging.md) | Is debug logging on for this user, and what are their latest logs? | no | 0 |
| [ops.deploys](ops.deploys.md) | Which deployments ran recently, and how did they end? | no | 0 |
| [ops.event-subscribers](ops.event-subscribers.md) | Are the subscribers to this platform event keeping up, and who do they run as? | no | 0 |
| [ops.scheduled-jobs](ops.scheduled-jobs.md) | Which scheduled jobs exist, who owns them, and when do they fire next? | no | 0 |
| [ops.setup-audit](ops.setup-audit.md) | What changed in Setup recently, and who changed it? | no | 0 |
| [ops.test-results](ops.test-results.md) | How did the latest test runs of this class go? | no | 0 |
