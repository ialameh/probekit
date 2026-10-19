# access.license-capacity

What user licence allocations and usage are reported by this org?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.license-capacity --org <org> 
```

## Parameters

- limit: int, default 100, e.g. 100

## Steps

### licenses

```sql
SELECT Name, Status, TotalLicenses, UsedLicenses, UsedLicensesLastUpdated FROM UserLicense ORDER BY Name LIMIT {limit}
```

## Verdicts

- Otherwise: {licenses.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- Zero or special licence totals must not be used as a percentage denominator.
- Usage is reported data, not a purchasing recommendation or proof that a user can be provisioned.

## Usage

0 logged run(s).

