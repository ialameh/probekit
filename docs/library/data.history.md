# data.history

How did the tracked fields of this record change over time?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.history --org <org> --history AccountHistory --parent AccountId --id 001000000000000AAA
```

## Parameters

- history: sobject, e.g. AccountHistory
- parent: field, e.g. AccountId
- id: id, e.g. 001000000000000AAA
- limit: int, default 100, e.g. 100

## Steps

### changes

```sql
SELECT Field, OldValue, NewValue, CreatedBy.Name, CreatedDate FROM {history} WHERE {parent} = '{id}' ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- When changes.rows === 0: No tracked changes on {id}.
- Otherwise: {changes.rows} tracked change(s) on {id}.

## Traps

- Only tracked fields appear, from the day tracking was switched on.
- Standard objects: <Object>History with <Object>Id. Custom objects: <Object>__History with ParentId.

## Usage

0 logged run(s).

