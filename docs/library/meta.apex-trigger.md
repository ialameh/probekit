# meta.apex-trigger

Which triggers run on this object, and are they the same across orgs?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.apex-trigger --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### triggers

```sql
SELECT Name, Status, ApiVersion, UsageBeforeInsert, UsageAfterInsert, UsageBeforeUpdate, UsageAfterUpdate, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, Body FROM ApexTrigger WHERE TableEnumOrId = '{obj}' ORDER BY Name
```

## Verdicts

- When triggers.rows === 0: No triggers on {obj}.
- Otherwise: {obj}: {= triggers.records.filter(r => r.Status === "Active").length} active trigger(s) of {triggers.rows}.

## Traps

- Compare the Body hash, not LastModifiedDate, which can read stale after a deploy.

## Usage

0 logged run(s).

