# data.stale-records

Which records have not been modified since before the selected window?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.stale-records --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account
- days: int, default 90, e.g. 90
- limit: int, default 50, e.g. 50

## Steps

### records

```sql
SELECT Id, LastModifiedDate, LastModifiedBy.Name FROM {obj} WHERE LastModifiedDate < LAST_N_DAYS:{days} ORDER BY LastModifiedDate ASC LIMIT {limit}
```

## Verdicts

- Otherwise: {records.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- Old records can be valid reference or historical data. This is not a deletion list.
- The object must support the selected modification fields; query limits may omit other records.

## Usage

0 logged run(s).

