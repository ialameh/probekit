# data.find

Which records of this object have this value in this field?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.find --org <org> --obj Account --field Name
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Name
- value: text, optional, e.g. Acme Ltd
- like: text, optional, e.g. Acme%
- fields: fields, default Id, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, e.g. Id, Name, CreatedDate, LastModifiedDate
- limit: int, default 50, e.g. 50

## Steps

### records

```sql
SELECT {fields} FROM {obj} WHERE Id != null [[AND {field} = '{value}']] [[AND {field} LIKE '{like}']] ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- When records.rows === 0: No {obj} matched.
- Otherwise: {records.rows} {obj} record(s) matched.

## Traps

- Pass --value for an exact match or --like with % for a pattern.

## Usage

0 logged run(s).

