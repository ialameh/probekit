# ops.async-jobs

Which async Apex jobs ran recently, and did they fail?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.async-jobs --org <org> 
```

## Parameters

- days: int, default 7, e.g. 7
- apexclass: name, optional, e.g. NightlyCleanupBatch
- status: name, optional, e.g. Failed
- limit: int, default 50, e.g. 50

## Steps

### jobs

```sql
SELECT ApexClass.Name, JobType, Status, ExtendedStatus, NumberOfErrors, JobItemsProcessed, TotalJobItems, CreatedBy.Name, CreatedDate, CompletedDate FROM AsyncApexJob WHERE CreatedDate = LAST_N_DAYS:{days} [[AND ApexClass.Name = '{apexclass}']] [[AND Status = '{status}']] ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- When jobs.rows === 0: No jobs matched in the last {days} day(s).
- When jobs.records.some(r => r.Status === "Failed" || r.NumberOfErrors > 0): {= jobs.records.filter(r => r.Status === "Failed" || r.NumberOfErrors > 0).length} of {jobs.rows} job(s) failed or had errors.
- Otherwise: {jobs.rows} job(s), none failed.

## Traps

- A Completed batch can still carry errors: read NumberOfErrors and ExtendedStatus.

## Usage

0 logged run(s).

