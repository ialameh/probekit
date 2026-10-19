# ops.debug-logging

Is debug logging on for this user, and what are their latest logs?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.debug-logging --org <org> --user jane.doe@example.com
```

## Parameters

- user: username, e.g. jane.doe@example.com
- limit: int, default 20, e.g. 20

## Steps

### u

```sql
SELECT Id FROM User WHERE Username = '{user}'
```

### flags (Tooling API)

Runs when: `u.rows === 1`

```sql
SELECT LogType, StartDate, ExpirationDate, DebugLevel.DeveloperName FROM TraceFlag WHERE TracedEntityId IN ({@u.Id}) ORDER BY ExpirationDate DESC
```

### logs

Runs when: `u.rows === 1`

```sql
SELECT Id, StartTime, Operation, Status, LogLength, DurationMilliseconds FROM ApexLog WHERE LogUserId IN ({@u.Id}) ORDER BY StartTime DESC LIMIT {limit}
```

## Verdicts

- When u.rows === 0: No user {user}.
- When flags.records.filter(r => new Date(r.ExpirationDate) > new Date()).length === 0: No live trace flag for {user}: no new logs are being written.
- Otherwise: Logging is on for {user}; {logs.rows} recent log(s).

## Traps

- Read a log body with: sf apex get log -i <Id>.

## Usage

0 logged run(s).

