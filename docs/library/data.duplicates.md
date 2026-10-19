# data.duplicates

Which values of this field appear on more than one record?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.duplicates --org <org> --obj Account --field Name
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Name
- limit: int, default 50, e.g. 50

## Steps

### dupes

```sql
SELECT {field}, COUNT(Id) n FROM {obj} WHERE {field} != null GROUP BY {field} HAVING COUNT(Id) > 1 ORDER BY COUNT(Id) DESC LIMIT {limit}
```

## Verdicts

- When dupes.rows === 0: No duplicate {field} values on {obj}.
- Otherwise: {dupes.rows} duplicated {field} value(s) on {obj}.

## Traps

- Aggregate queries scan the whole object; on a large object add a date filter with data.count-by instead.

## Usage

0 logged run(s).

