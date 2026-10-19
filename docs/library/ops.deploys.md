# ops.deploys

Which deployments ran recently, and how did they end?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.deploys --org <org> 
```

## Parameters

- days: int, default 7, e.g. 7
- limit: int, default 20, e.g. 20

## Steps

### deploys (Tooling API)

```sql
SELECT Id, Status, CheckOnly, StartDate, CompletedDate, CreatedBy.Name, NumberComponentsDeployed, NumberComponentErrors, NumberTestsCompleted, NumberTestErrors FROM DeployRequest WHERE CreatedDate = LAST_N_DAYS:{days} ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- When deploys.rows === 0: No deployments in the last {days} day(s).
- Otherwise: {deploys.rows} deployment(s); latest {= deploys.records[0].Status} by {= deploys.records[0]["CreatedBy.Name"]}.

## Traps

- A successful deploy proves the package deployed, not that it held every component the change needed.

## Usage

0 logged run(s).

