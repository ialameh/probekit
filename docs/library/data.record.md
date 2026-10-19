# data.record

What does this one record hold right now?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.record --org <org> --obj Account --id 001000000000000AAA
```

## Parameters

- obj: sobject, e.g. Account
- id: id, e.g. 001000000000000AAA
- fields: fields, default Id, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, e.g. Id, Name, CreatedDate, LastModifiedDate

## Steps

### record

```sql
SELECT {fields} FROM {obj} WHERE Id = '{id}'
```

## Verdicts

- When record.rows === 0: No {obj} {id}, or the running user cannot see it.
- Otherwise: {obj} {id} found.

## Traps

- Run with --fields to choose columns. Field access applies: a hidden field errors rather than reading blank.

## Usage

0 logged run(s).

