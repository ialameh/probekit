# meta.object-fields

Which fields does this object have, optionally matching a pattern?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.object-fields --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account
- like: text, optional, e.g. Billing%

## Steps

### fields (Tooling API)

```sql
SELECT QualifiedApiName, Label, DataType, IsCalculated, LastModifiedDate FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = '{obj}' [[AND QualifiedApiName LIKE '{like}']] ORDER BY QualifiedApiName
```

## Verdicts

- When fields.rows === 0: No fields matched on {obj}.
- Otherwise: {fields.rows} field(s) on {obj}.

## Traps

- describe is filtered by the running user's field access; FieldDefinition is not.

## Usage

0 logged run(s).

