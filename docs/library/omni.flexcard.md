# omni.flexcard

Which version of this FlexCard is active, and who changed each version?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.flexcard --org <org> --name AccountSummaryCard
```

## Parameters

- name: name, e.g. AccountSummaryCard

## Steps

### versions

```sql
SELECT Name, VersionNumber, IsActive, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM OmniUiCard WHERE Name = '{name}' ORDER BY VersionNumber DESC
```

## Verdicts

- When versions.rows === 0: No FlexCard {name}.
- When versions.records.filter(r => r.IsActive).length === 0: {name} has no active version.
- Otherwise: {name}: version {= versions.records.find(r => r.IsActive).VersionNumber} is active.

## Traps

- Edit a new version, never the active one in place.

## Usage

0 logged run(s).

