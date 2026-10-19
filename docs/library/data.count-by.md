# data.count-by

How are recent records of this object spread across the values of this field?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.count-by --org <org> --obj Account --field Industry
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Industry
- days: int, default 30, e.g. 30
- limit: int, default 50, e.g. 50

## Steps

### counts

```sql
SELECT {field}, COUNT(Id) n FROM {obj} WHERE CreatedDate = LAST_N_DAYS:{days} GROUP BY {field} ORDER BY COUNT(Id) DESC LIMIT {limit}
```

## Verdicts

- When counts.rows === 0: No {obj} created in the last {days} day(s).
- Otherwise: {counts.rows} distinct {field} value(s).

## Usage

0 logged run(s).

