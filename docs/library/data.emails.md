# data.emails

Which emails were logged against this record?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.emails --org <org> --id 001000000000000AAA
```

## Parameters

- id: id, e.g. 001000000000000AAA
- limit: int, default 20, e.g. 20

## Steps

### emails

```sql
SELECT Subject, Status, Incoming, MessageDate, CreatedBy.Name FROM EmailMessage WHERE RelatedToId = '{id}' ORDER BY MessageDate DESC LIMIT {limit}
```

## Verdicts

- When emails.rows === 0: No emails logged against {id}.
- Otherwise: {emails.rows} email(s) logged against {id}.

## Traps

- An email sent by automation is logged here when the send logs activity; a missing row does not prove the email was not sent.

## Usage

0 logged run(s).

