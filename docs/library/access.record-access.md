# access.record-access

What access does this user have to this record, as the platform calculates it?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.record-access --org <org> --user jane.doe@example.com --record 001000000000000AAA
```

## Parameters

- user: username, e.g. jane.doe@example.com
- record: id, e.g. 001000000000000AAA

## Steps

### u

```sql
SELECT Id FROM User WHERE Username = '{user}'
```

### access

Runs when: `u.rows === 1`

```sql
SELECT RecordId, HasReadAccess, HasEditAccess, HasDeleteAccess, HasTransferAccess, MaxAccessLevel FROM UserRecordAccess WHERE UserId = {@u.Id} AND RecordId = '{record}'
```

## Verdicts

- When u.rows === 0: No user {user}.
- When access.rows === 0 || !access.records[0].HasReadAccess: {user} cannot read {record}.
- Otherwise: {user} has {= access.records[0].MaxAccessLevel} access to {record}.

## Traps

- This is the sharing answer only. Field access is separate (access.field-grants).

## Usage

0 logged run(s).

