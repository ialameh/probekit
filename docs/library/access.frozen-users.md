# access.frozen-users

Which user logins are frozen, and which returned users are still active?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.frozen-users --org <org> 
```

## Parameters

- limit: int, default 50, e.g. 50

## Steps

### logins

```sql
SELECT UserId, IsFrozen FROM UserLogin WHERE IsFrozen = true LIMIT {limit}
```

### users

Runs when: `logins.rows > 0`

```sql
SELECT Id, Username, IsActive, UserType FROM User WHERE Id IN ({@logins.UserId}) ORDER BY Username
```

## Verdicts

- Otherwise: {logins.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- The second query resolves the bounded first export only.
- This is an administrative review; a freeze may be deliberate.

## Usage

0 logged run(s).

