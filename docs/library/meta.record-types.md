# meta.record-types

Which record types does this object have, and which are active?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.record-types --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### types

```sql
SELECT Id, DeveloperName, Name, IsActive FROM RecordType WHERE SobjectType = '{obj}' ORDER BY DeveloperName
```

## Verdicts

- When types.rows === 0: {obj} has no record types.
- Otherwise: {obj}: {types.rows} record type(s).

## Traps

- Record type ids differ between orgs. Compare and reference by DeveloperName.

## Usage

0 logged run(s).

