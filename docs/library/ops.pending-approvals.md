# ops.pending-approvals

Which pending approval requests are older than the selected age?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.pending-approvals --org <org> 
```

## Parameters

- days: int, default 7, e.g. 7
- limit: int, default 50, e.g. 50

## Steps

### requests

```sql
SELECT Id, ProcessInstance.TargetObjectId, ProcessInstance.Status, ActorId, OriginalActorId, CreatedDate, ElapsedTimeInDays FROM ProcessInstanceWorkitem WHERE ProcessInstance.Status = 'Pending' AND CreatedDate < LAST_N_DAYS:{days} ORDER BY CreatedDate ASC LIMIT {limit}
```

## Verdicts

- Otherwise: {requests.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- Covers approval work items exposed by ProcessInstanceWorkitem, not every approval product or flow.
- Elapsed age does not establish a missed service commitment. Oldest returned items may be limited.

## Usage

0 logged run(s).

