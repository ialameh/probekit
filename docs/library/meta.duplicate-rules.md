# meta.duplicate-rules

Which duplicate rules run on this object?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.duplicate-rules --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### rules

```sql
SELECT DeveloperName, MasterLabel, IsActive, SobjectType, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM DuplicateRule WHERE SobjectType = '{obj}' ORDER BY DeveloperName
```

## Verdicts

- When rules.rows === 0: No duplicate rules on {obj}.
- Otherwise: {obj}: {= rules.records.filter(r => r.IsActive).length} active of {rules.rows} rule(s).

## Usage

0 logged run(s).

