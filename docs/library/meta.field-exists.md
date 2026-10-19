# meta.field-exists

Does this field exist on the org, regardless of who can see it?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.field-exists --org <org> --obj Account --field Industry
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Industry

## Steps

### field (Tooling API)

```sql
SELECT QualifiedApiName, DataType, Length, IsCalculated, LastModifiedDate, LastModifiedBy.Name FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = '{obj}' AND QualifiedApiName = '{field}'
```

## Verdicts

- When field.rows === 0: {obj}.{field} does not exist on this org.
- Otherwise: {obj}.{field} exists.

## Traps

- Use this, not describe: describe hides fields the running user cannot read.

## Usage

0 logged run(s).

