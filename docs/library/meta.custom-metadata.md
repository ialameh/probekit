# meta.custom-metadata

What rows does this custom metadata type hold, and do they match across orgs?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.custom-metadata --org <org> --type Feature_Setting__mdt
```

## Parameters

- type: sobject, e.g. Feature_Setting__mdt
- fields: fields, default DeveloperName, MasterLabel, e.g. DeveloperName, MasterLabel

## Steps

### rows

```sql
SELECT {fields} FROM {type} ORDER BY DeveloperName LIMIT 2000
```

## Verdicts

- When rows.rows === 0: {type} has no rows.
- Otherwise: {type}: {rows.rows} row(s).

## Traps

- Values that name an org, a user or an endpoint differ between orgs by design; they belong in per-org config, not in deployable rows.

## Usage

0 logged run(s).

