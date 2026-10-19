# omni.active-version

Which version of this OmniScript or Integration Procedure is active, and who touched each version?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.active-version --org <org> --type Account --subtype Create
```

## Parameters

- type: name, e.g. Account
- subtype: name, e.g. Create

## Steps

### versions

```sql
SELECT Name, VersionNumber, IsActive, IsIntegrationProcedure, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM OmniProcess WHERE Type = '{type}' AND SubType = '{subtype}' ORDER BY VersionNumber DESC
```

## Verdicts

- When versions.rows === 0: No OmniProcess {type}/{subtype} on this org.
- When versions.records.filter(r => r.IsActive).length === 0: {type}/{subtype} has {versions.rows} version(s) and none is active.
- Otherwise: {type}/{subtype}: version {= versions.records.find(r => r.IsActive).VersionNumber} is active, {versions.rows} version(s) in total.

## Traps

- Two orgs on the same version number means a deploy overwrites in place. A higher target version survives as inactive.
- A recent LastModifiedBy who is not you means someone may be mid-change. Ask before editing.

## Usage

0 logged run(s).

