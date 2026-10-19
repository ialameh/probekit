# omni.expression-set

Which versions of this expression set exist, and which is active?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.expression-set --org <org> --name Pricing_Rules
```

## Parameters

- name: name, e.g. Pricing_Rules

## Steps

### versions

```sql
SELECT ApiName, VersionNumber, IsActive, Rank, StartDateTime, EndDateTime, LastModifiedDate FROM ExpressionSetVersion WHERE ExpressionSet.ApiName = '{name}' ORDER BY VersionNumber DESC
```

## Verdicts

- When versions.rows === 0: No expression set {name}.
- When versions.records.filter(r => r.IsActive).length === 0: {name} has no active version.
- Otherwise: {name}: {versions.rows} version(s), version {= versions.records.find(r => r.IsActive).VersionNumber} active.

## Traps

- New versions are their own records; the parent expression set date does not move when one is added.

## Usage

0 logged run(s).

