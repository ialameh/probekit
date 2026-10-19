# Browser investigations

The workspace covers all 61 probes in the current catalogue. It does not claim to cover every possible Salesforce investigation.

## Local preview

```sh
pnpm run preview:web
```

Open http://127.0.0.1:4794/investigations.html. Alternatively, `node probe.mjs web --serve` serves the library and workspace on port 4791. No deployment, Salesforce login or network query is performed by the preview command.

## Workflow

1. Search or filter the catalogue and choose a question.
2. Supply API names and other parameters, then build the query steps.
3. Use the indicated Standard API or Tooling API in an approved query tool.
4. Export complete JSON or CSV results, retaining every selected column.
5. Confirm the query and export context, then accept the result. Dependent steps unlock using the imported values.
6. Review observations, limitations and follow-up checks. Download a text or JSON summary if needed.

Use **Result unavailable** when access, tooling or an org feature prevents obtaining a result. This blocks dependent steps rather than treating them as empty. Replacing a prior result clears all later imports on that side. Changing parameters invalidates that side’s results. Switching investigations or clearing the workspace removes its data.

Every investigation includes clearly labelled fictional sample results. They illustrate the import and analysis workflow, not a real org assessment. Clear the sample before using real exports.

## Comparisons

Enable comparison to import a second result set. Each side can use different parameters, which are disclosed in the comparison and report. Use equivalent records, filters and time windows.

- Declared comparison columns are used where available. Other columns are explicitly outside that comparison.
- Without declared columns, all exported columns are compared, including IDs and dates.
- A wildcard comparison excludes the top-level Id, matching the probe definition.
- Duplicate row counts are preserved; row order is ignored.
- Marked source/configuration columns are fingerprinted using full SHA-256 hashes of exact exported content.
- CSV booleans and known numeric columns are normalised. Unknown CSV fields remain text; mixed formats receive a warning. Empty CSV cells are treated as null.
- Equal selected values do not establish full component or org equality. Missing results cannot be compared.

## Import and privacy limits

Each export is limited to 2 MB and 10,000 rows. JSON arrays, REST query responses, CLI JSON results and CSV with headers are supported. Incomplete/paginated responses, failed queries, missing columns and incompatible known types are rejected. Reaching an explicit query LIMIT produces a coverage warning.

Data is held in tab memory only. There is no upload, browser-storage persistence, remote query execution or imported-code evaluation. Reports include context, parameters, notes and observations but exclude raw rows. Review reports before sharing. The preview and deployed page policy block network connections from the analysis page.

The workspace cannot independently verify the org, query execution, result freshness or completeness. User confirmation is required. Zero rows are not proof of absence, denial, or a healthy system. OmniStudio queries use the standard object model; package namespaces and available features may require query adaptation outside this workspace.

## Coverage

| Investigation | Family | Query steps | Tooling steps |
|---|---|---:|---:|
| access.apex-class-access | access | 2 | 0 |
| access.custom-permission | access | 3 | 0 |
| access.field-grants | access | 3 | 1 |
| access.group-members | access | 4 | 0 |
| access.logins | access | 2 | 0 |
| access.object-grants | access | 1 | 0 |
| access.permset | access | 3 | 0 |
| access.permset-group | access | 2 | 0 |
| access.permset-holders | access | 1 | 0 |
| access.record-access | access | 2 | 0 |
| access.record-shares | access | 1 | 0 |
| access.tab-settings | access | 1 | 0 |
| access.user | access | 4 | 0 |
| data.count-by | data | 1 | 0 |
| data.duplicates | data | 1 | 0 |
| data.emails | data | 1 | 0 |
| data.files | data | 1 | 0 |
| data.find | data | 1 | 0 |
| data.history | data | 1 | 0 |
| data.recent | data | 1 | 0 |
| data.record | data | 1 | 0 |
| flow.interviews | flow | 1 | 0 |
| flow.on-object | flow | 1 | 0 |
| flow.versions | flow | 2 | 2 |
| meta.apex-class | meta | 1 | 0 |
| meta.apex-trigger | meta | 1 | 0 |
| meta.credentials | meta | 2 | 1 |
| meta.custom-field | meta | 2 | 1 |
| meta.custom-labels | meta | 1 | 1 |
| meta.custom-metadata | meta | 1 | 0 |
| meta.dependencies | meta | 3 | 3 |
| meta.duplicate-rules | meta | 1 | 0 |
| meta.email-template | meta | 1 | 0 |
| meta.field-exists | meta | 1 | 1 |
| meta.installed-packages | meta | 1 | 1 |
| meta.layouts | meta | 3 | 2 |
| meta.lwc | meta | 2 | 2 |
| meta.object | meta | 1 | 0 |
| meta.object-fields | meta | 1 | 1 |
| meta.org | meta | 1 | 0 |
| meta.picklist-values | meta | 1 | 0 |
| meta.record-pages | meta | 2 | 1 |
| meta.record-types | meta | 1 | 0 |
| meta.static-resource | meta | 1 | 0 |
| meta.validation-rules | meta | 1 | 1 |
| omni.active-version | omni | 1 | 0 |
| omni.compiled | omni | 2 | 0 |
| omni.data-mapper | omni | 2 | 0 |
| omni.decision-matrix | omni | 2 | 0 |
| omni.document-template | omni | 1 | 0 |
| omni.elements | omni | 2 | 0 |
| omni.expression-set | omni | 1 | 0 |
| omni.flexcard | omni | 1 | 0 |
| ops.async-jobs | ops | 1 | 0 |
| ops.code-coverage | ops | 1 | 1 |
| ops.debug-logging | ops | 3 | 1 |
| ops.deploys | ops | 1 | 1 |
| ops.event-subscribers | ops | 2 | 1 |
| ops.scheduled-jobs | ops | 1 | 0 |
| ops.setup-audit | ops | 1 | 0 |
| ops.test-results | ops | 1 | 0 |
