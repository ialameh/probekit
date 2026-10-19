# ops.approval-history

What approval instances and completed steps are recorded for this record?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.approval-history --org <org> --record 001000000000001
```

## Parameters

- record: id, e.g. 001000000000001
- limit: int, default 50, e.g. 50

## Steps

### instances

```sql
SELECT Id, Status, SubmittedBy.Name, LastActor.Name, CreatedDate, ElapsedTimeInDays FROM ProcessInstance WHERE TargetObjectId = '{record}' ORDER BY CreatedDate DESC LIMIT {limit}
```

### steps

Runs when: `instances.rows > 0`

```sql
SELECT ProcessInstanceId, StepStatus, Actor.Name, OriginalActor.Name, CreatedDate, ElapsedTimeInDays FROM ProcessInstanceStep WHERE ProcessInstanceId IN ({@instances.Id}) ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- Otherwise: {instances.rows} row(s) returned by the first query. Review selected columns, query limits and follow-up steps; this is not an org-wide assessment.

## Traps

- Only exposed and visible approval history is included. Pending requests are not completed steps.
- Both steps are bounded; a timeline can be incomplete. Comments are deliberately not selected.

## Usage

0 logged run(s).

