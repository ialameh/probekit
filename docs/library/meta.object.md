# meta.object

What is this object: label, key prefix, sharing model, and where it comes from?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.object --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### entity

```sql
SELECT QualifiedApiName, Label, KeyPrefix, DurableId, NamespacePrefix, IsCustomSetting, InternalSharingModel, ExternalSharingModel, LastModifiedDate FROM EntityDefinition WHERE QualifiedApiName = '{obj}'
```

## Verdicts

- When entity.rows === 0: No object {obj} on this org.
- Otherwise: {obj} exists, key prefix {= entity.records[0].KeyPrefix}.

## Traps

- Use this to decode a record id: the first three characters are the key prefix.

## Usage

0 logged run(s).

