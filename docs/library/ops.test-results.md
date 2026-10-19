# ops.test-results

How did the latest test runs of this class go?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.test-results --org <org> --apexclass AccountServiceTest
```

## Parameters

- apexclass: name, e.g. AccountServiceTest
- limit: int, default 50, e.g. 50

## Steps

### results

```sql
SELECT MethodName, Outcome, Message, RunTime, TestTimestamp, AsyncApexJobId FROM ApexTestResult WHERE ApexClass.Name = '{apexclass}' ORDER BY TestTimestamp DESC LIMIT {limit}
```

## Verdicts

- When results.rows === 0: No test results for {apexclass}.
- When results.records.some(r => r.Outcome !== "Pass"): {= results.records.filter(r => r.Outcome !== "Pass").length} of the latest {results.rows} result(s) did not pass.
- Otherwise: Latest {results.rows} result(s) all passed.

## Usage

0 logged run(s).

