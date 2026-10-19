# access.dormant-users

Which active users have no recorded login or last logged in before the selected window?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.dormant-users --org <org> 
```

## Parameters

- days: int, default 90, e.g. 90
- limit: int, default 50, e.g. 50

## Steps

### users

```sql
SELECT Id, Username, IsActive, UserType, LastLoginDate, CreatedDate FROM User WHERE IsActive = true AND (LastLoginDate = null OR LastLoginDate < LAST_N_DAYS:{days}) ORDER BY LastLoginDate ASC NULLS FIRST LIMIT {limit}
```

## Verdicts

- Otherwise: {users.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- LastLoginDate is a limited activity signal, not proof a user is unused.
- A null login date can include newly provisioned users. No automatic deactivation is recommended.

## Usage

0 logged run(s).

