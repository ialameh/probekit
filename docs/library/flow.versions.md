# flow.versions

Which version of this flow is active, which is latest, and who changed each?

- Family: flow
- Writes: no
- Orgs: any

## Run

```
probe run flow.versions --org <org> --name Account_Before_Save
```

## Parameters

- name: name, e.g. Account_Before_Save

## Steps

### definition (Tooling API)

```sql
SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition WHERE DeveloperName = '{name}'
```

### versions (Tooling API)

Runs when: `definition.rows === 1`

```sql
SELECT VersionNumber, Status, ProcessType, ApiVersion, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM Flow WHERE Definition.DeveloperName = '{name}' ORDER BY VersionNumber DESC
```

## Verdicts

- When definition.rows === 0: No flow {name}.
- When !definition.records[0]['ActiveVersion.VersionNumber']: {name} has no active version: it does not run.
- When definition.records[0]['ActiveVersion.VersionNumber'] !== definition.records[0]['LatestVersion.VersionNumber']: {name}: version {= definition.records[0]["ActiveVersion.VersionNumber"]} is active, but version {= definition.records[0]["LatestVersion.VersionNumber"]} is newer and not active.
- Otherwise: {name}: latest version {= definition.records[0]["ActiveVersion.VersionNumber"]} is active.

## Traps

- A deploy can leave the new version as Draft or inactive. Check here after every deploy.
- Retiring a flow means no active version; the definition stays.

## Usage

0 logged run(s).

