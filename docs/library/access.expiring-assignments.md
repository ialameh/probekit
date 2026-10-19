# access.expiring-assignments

Which active users have expiring, inactive or revoked permission assignments?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.expiring-assignments --org <org> 
```

## Parameters

- days: int, default 30, e.g. 30
- limit: int, default 50, e.g. 50

## Steps

### assignments

```sql
SELECT AssigneeId, Assignee.Username, PermissionSet.Name, PermissionSetGroup.DeveloperName, ExpirationDate, IsActive, IsRevoked FROM PermissionSetAssignment WHERE Assignee.IsActive = true AND (IsActive = false OR IsRevoked = true OR ExpirationDate <= TODAY OR ExpirationDate = NEXT_N_DAYS:{days}) ORDER BY ExpirationDate ASC NULLS LAST LIMIT {limit}
```

## Verdicts

- Otherwise: {assignments.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- NEXT_N_DAYS follows Salesforce relative-date boundaries. Dates, query identity and time of export matter.
- Inactive or revoked assignments may have no expiration date. Group muting and other grants remain separate.
- Empty results are not proof that no access will expire.

## Usage

0 logged run(s).

