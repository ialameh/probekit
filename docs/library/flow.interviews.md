# flow.interviews

Which flow interviews are paused or waiting on this org?

- Family: flow
- Writes: no
- Orgs: any

## Run

```
probe run flow.interviews --org <org> 
```

## Parameters

- days: int, default 7, e.g. 7
- label: text, optional, e.g. Account
- limit: int, default 50, e.g. 50

## Steps

### interviews

```sql
SELECT Name, InterviewLabel, InterviewStatus, CurrentElement, PauseLabel, CreatedBy.Name, CreatedDate FROM FlowInterview WHERE CreatedDate = LAST_N_DAYS:{days} [[AND InterviewLabel LIKE '{label}%']] ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- When interviews.rows === 0: No held interviews in the last {days} day(s).
- Otherwise: {interviews.rows} held interview(s).

## Traps

- Finished interviews are not kept here. For failures, read the flow error emails or the debug log.

## Usage

0 logged run(s).

