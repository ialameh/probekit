# data.recent

Which records of this object changed recently, and who changed them?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.recent --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account
- days: int, default 1, e.g. 1
- user: username, optional, e.g. jane.doe@example.com
- fields: fields, default Id, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, e.g. Id, Name, CreatedDate, LastModifiedDate
- limit: int, default 50, e.g. 50

## Steps

### records

```sql
SELECT {fields} FROM {obj} WHERE LastModifiedDate = LAST_N_DAYS:{days} [[AND LastModifiedBy.Username = '{user}']] ORDER BY LastModifiedDate DESC LIMIT {limit}
```

## Verdicts

- When records.rows === 0: No {obj} changed in the last {days} day(s).
- Otherwise: {records.rows} {obj} record(s) changed.

## Traps

- Integration users and automation also change records; LastModifiedBy names the user the change ran as.

## Usage

0 logged run(s).

