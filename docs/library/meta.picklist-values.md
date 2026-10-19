# meta.picklist-values

Which values does this picklist offer?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.picklist-values --org <org> --obj Account --field Industry
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Industry

## Steps

### values

```sql
SELECT Value, Label, IsActive, IsDefaultValue FROM PicklistValueInfo WHERE EntityParticle.EntityDefinition.QualifiedApiName = '{obj}' AND EntityParticle.QualifiedApiName = '{field}' ORDER BY Value
```

## Verdicts

- When values.rows === 0: {obj}.{field} has no picklist values, or is not a picklist.
- Otherwise: {obj}.{field}: {values.rows} value(s).

## Traps

- Values available per record type are set on the record type and are not shown here.

## Usage

0 logged run(s).

