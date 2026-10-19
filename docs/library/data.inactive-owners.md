# data.inactive-owners

Which records on this object belong to inactive users?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.inactive-owners --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account
- limit: int, default 50, e.g. 50

## Steps

### records

```sql
SELECT Id, OwnerId, Owner.Name, LastModifiedDate FROM {obj} WHERE OwnerId IN (SELECT Id FROM User WHERE IsActive = false) ORDER BY LastModifiedDate DESC LIMIT {limit}
```

## Verdicts

- Otherwise: {records.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- The selected object must support OwnerId and LastModifiedDate. Queue ownership is excluded.
- Visibility and the query limit constrain results. Inactive ownership is not proof the record is abandoned.

## Usage

0 logged run(s).

