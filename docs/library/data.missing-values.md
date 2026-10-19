# data.missing-values

Which records lack a value in the selected field?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.missing-values --org <org> --obj Account --field Industry
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Industry
- limit: int, default 50, e.g. 50

## Steps

### records

```sql
SELECT Id, {field}, LastModifiedDate FROM {obj} WHERE {field} = null ORDER BY LastModifiedDate DESC LIMIT {limit}
```

## Verdicts

- Otherwise: {records.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- The field must be queryable and filterable; the object must support Id and LastModifiedDate.
- Null is not the same as whitespace, a default value or a business-invalid value. No values are filled automatically.

## Usage

0 logged run(s).

