# ops.test-queue

Which Apex test queue items are waiting or processing?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.test-queue --org <org> 
```

## Parameters

- days: int, default 7, e.g. 7
- limit: int, default 50, e.g. 50

## Steps

### queue

```sql
SELECT Id, ApexClass.Name, Status, ExtendedStatus, CreatedDate FROM ApexTestQueueItem WHERE CreatedDate = LAST_N_DAYS:{days} AND Status IN ('Holding', 'Queued', 'Preparing', 'Processing') ORDER BY CreatedDate ASC LIMIT {limit}
```

## Verdicts

- Otherwise: {queue.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- A pending state alone does not prove a stuck run. Older entries can fall outside the chosen window.

## Usage

0 logged run(s).

