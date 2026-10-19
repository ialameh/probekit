# access.logins

When and how did this user last log in?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.logins --org <org> --user jane.doe@example.com
```

## Parameters

- user: username, e.g. jane.doe@example.com
- limit: int, default 20, e.g. 20

## Steps

### u

```sql
SELECT Id FROM User WHERE Username = '{user}'
```

### logins

Runs when: `u.rows === 1`

```sql
SELECT LoginTime, Status, Application, LoginType, Platform, Browser FROM LoginHistory WHERE UserId IN ({@u.Id}) ORDER BY LoginTime DESC LIMIT {limit}
```

## Verdicts

- When u.rows === 0: No user {user}.
- When logins.rows === 0: No logins recorded for {user}.
- Otherwise: Last login {= logins.records[0].LoginTime}: {= logins.records[0].Status}.

## Usage

0 logged run(s).

