# access.group-health

Which permission-set groups have not reached Updated status?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.group-health --org <org> 
```

## Parameters

- limit: int, default 50, e.g. 50

## Steps

### groups

```sql
SELECT DeveloperName, MasterLabel, Status, LastModifiedDate FROM PermissionSetGroup WHERE Status != 'Updated' ORDER BY LastModifiedDate DESC LIMIT {limit}
```

## Verdicts

- Otherwise: {groups.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- Status describes an export-time snapshot. Calculation may complete after the query.
- Effective permissions also depend on muting, assignment and other grants.

## Usage

0 logged run(s).

