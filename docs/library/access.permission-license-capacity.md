# access.permission-license-capacity

What permission-set licence allocations, usage and expiry dates are reported?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.permission-license-capacity --org <org> 
```

## Parameters

- limit: int, default 100, e.g. 100

## Steps

### licenses

```sql
SELECT DeveloperName, MasterLabel, Status, TotalLicenses, UsedLicenses, ExpirationDate FROM PermissionSetLicense ORDER BY DeveloperName LIMIT {limit}
```

## Verdicts

- Otherwise: {licenses.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- Permission-set licences differ from user licences. Availability alone does not grant access.
- Zero or special totals need separate interpretation; expiry is date-based.

## Usage

0 logged run(s).

