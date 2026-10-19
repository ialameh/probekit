# access.record-shares

Which share rows open this record, to whom, and why?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.record-shares --org <org> --share AccountShare --parent AccountId --level AccountAccessLevel --record 001000000000000AAA
```

## Parameters

- share: sobject, e.g. AccountShare
- parent: field, e.g. AccountId
- level: field, e.g. AccountAccessLevel
- record: id, e.g. 001000000000000AAA

## Steps

### shares

```sql
SELECT UserOrGroupId, UserOrGroup.Name, {level}, RowCause, LastModifiedDate FROM {share} WHERE {parent} = '{record}' ORDER BY RowCause
```

## Verdicts

- When shares.rows === 0: No share rows on {record}.
- Otherwise: {shares.rows} share row(s) on {record}.

## Traps

- Standard objects name the parent and level fields after the object (AccountId, AccountAccessLevel); custom share objects use ParentId and AccessLevel.

## Usage

0 logged run(s).

