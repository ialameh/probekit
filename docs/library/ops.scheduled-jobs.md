# ops.scheduled-jobs

Which scheduled jobs exist, who owns them, and when do they fire next?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.scheduled-jobs --org <org> 
```

## Parameters

- name: text, default %, e.g. %

## Steps

### jobs

```sql
SELECT CronJobDetail.Name, CronJobDetail.JobType, State, CronExpression, NextFireTime, PreviousFireTime, CreatedBy.Name FROM CronTrigger WHERE CronJobDetail.Name LIKE '{name}' ORDER BY CronJobDetail.Name LIMIT 500
```

## Verdicts

- When jobs.rows === 0: No scheduled jobs matched {name}.
- Otherwise: {jobs.rows} scheduled job(s).

## Traps

- A scheduled job runs as the user who scheduled it (CreatedBy).
- A scheduled Apex class cannot be redeployed while its schedule exists.

## Usage

0 logged run(s).

